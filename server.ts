import 'dotenv/config';
import crypto from 'node:crypto';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import express, { NextFunction, Request, Response } from 'express';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import { WebSocket, WebSocketServer } from 'ws';

const PORT = Number(process.env.PORT || 3000);
const DATA_DIR = path.resolve(process.cwd(), '.learnloop-data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

// Session secret from env with secure runtime fallback (never hardcoded)
const SESSION_SECRET =
  process.env.SESSION_SECRET && process.env.SESSION_SECRET.length >= 16
    ? process.env.SESSION_SECRET
    : crypto.randomBytes(32).toString('hex');

interface TopicStat {
  answered: number;
  correct: number;
  wrong: number;
}

interface ProgressData {
  totalAnswered: number;
  totalCorrect: number;
  subtopicStats: Record<string, TopicStat>;
  moduleStats: {
    types: TopicStat;
    lists: TopicStat;
  };
  completedGameIds: string[];
  completedLessonIds: string[];
}

type InterfaceLanguage = 'en' | 'hi' | 'ta' | 'te' | 'bn' | 'mr' | 'es' | 'fr';

const ALLOWED_LANGUAGES = new Set<InterfaceLanguage>([
  'en',
  'hi',
  'ta',
  'te',
  'bn',
  'mr',
  'es',
  'fr',
]);

function normalizeLanguage(val: unknown): InterfaceLanguage {
  if (typeof val === 'string' && ALLOWED_LANGUAGES.has(val as InterfaceLanguage)) {
    return val as InterfaceLanguage;
  }
  return 'en';
}

function normalizeAvatarUrl(val: unknown): string | undefined {
  if (typeof val !== 'string') return undefined;
  const trimmed = val.trim();
  if (!trimmed) return undefined;
  if (
    trimmed.length <= 220_000 &&
    /^data:image\/(png|jpeg|jpg|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(trimmed)
  ) {
    return trimmed;
  }
  return undefined;
}

interface StoredUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  avatarUrl?: string;
  points: number;
  preferredLanguage?: InterfaceLanguage;
  progress: ProgressData;
  createdAt: string;
}

interface LibrarySnippet {
  id: string;
  title: string;
  topic: 'types' | 'lists';
  code: string;
  authorName: string;
  createdAt: string;
}

interface DatabaseSchema {
  users: StoredUser[];
  library: LibrarySnippet[];
}

function createDefaultProgress(): ProgressData {
  return {
    totalAnswered: 0,
    totalCorrect: 0,
    subtopicStats: {},
    moduleStats: {
      types: { answered: 0, correct: 0, wrong: 0 },
      lists: { answered: 0, correct: 0, wrong: 0 },
    },
    completedGameIds: [],
    completedLessonIds: [],
  };
}

const SEED_LIBRARY: LibrarySnippet[] = [
  {
    id: 'lib-seed-1',
    title: 'Type Classifier Helper',
    topic: 'types',
    authorName: 'LearnLoop Staff',
    createdAt: '2026-11-25T10:00:00.000Z',
    code: `values = [42, 3.14, "Python", True, [1, 2], {"a": 1}]
for item in values:
    print(item, "->", type(item))`,
  },
  {
    id: 'lib-seed-2',
    title: 'Safe List Copy & Deduplicate',
    topic: 'lists',
    authorName: 'LearnLoop Staff',
    createdAt: '2026-11-25T10:05:00.000Z',
    code: `original = [10, 20, 20, 30, 10, 40]
copied = original.copy()
copied.append(50)

print("Original:", original)
print("Copied:", copied)
print("Unique count:", len(set(original)))`,
  },
];

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadDb(): DatabaseSchema {
  ensureDataDir();
  if (!fs.existsSync(DB_FILE)) {
    const initial: DatabaseSchema = { users: [], library: [...SEED_LIBRARY] };
    fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf8');
    return initial;
  }
  try {
    const parsed = JSON.parse(fs.readFileSync(DB_FILE, 'utf8')) as Partial<DatabaseSchema>;
    return {
      users: Array.isArray(parsed.users) ? parsed.users : [],
      library: Array.isArray(parsed.library) && parsed.library.length > 0 ? parsed.library : [...SEED_LIBRARY],
    };
  } catch {
    return { users: [], library: [...SEED_LIBRARY] };
  }
}

let db: DatabaseSchema = loadDb();

function saveDb(): void {
  ensureDataDir();
  const tmpFile = `${DB_FILE}.tmp`;
  fs.writeFileSync(tmpFile, JSON.stringify(db, null, 2), 'utf8');
  fs.renameSync(tmpFile, DB_FILE);
}

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, stored: string): boolean {
  const [salt, originalHex] = stored.split(':');
  if (!salt || !originalHex) return false;
  const candidate = crypto.scryptSync(password, salt, 64);
  const original = Buffer.from(originalHex, 'hex');
  if (candidate.length !== original.length) return false;
  return crypto.timingSafeEqual(candidate, original);
}

interface TokenPayload {
  sub: string;
  exp: number;
}

function signToken(userId: string): string {
  const payload: TokenPayload = {
    sub: userId,
    exp: Date.now() + 1000 * 60 * 60 * 24 * 7, // 7 days
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(encoded)
    .digest('base64url');
  return `${encoded}.${sig}`;
}

function verifyToken(token: string): TokenPayload | null {
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [encoded, sig] = parts;
  const expectedSig = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(encoded)
    .digest('base64url');
  const sigBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expectedBuf.length) return null;
  if (!crypto.timingSafeEqual(sigBuf, expectedBuf)) return null;
  try {
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as TokenPayload;
    if (!payload.sub || typeof payload.exp !== 'number' || payload.exp < Date.now()) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

function sanitizeUser(user: StoredUser) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl,
    points: user.points,
    preferredLanguage: normalizeLanguage(user.preferredLanguage),
    progress: user.progress,
    createdAt: user.createdAt,
  };
}

interface AuthenticatedRequest extends Request {
  authUser?: StoredUser;
}

function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required.' });
    return;
  }
  const token = authHeader.slice(7).trim();
  const payload = verifyToken(token);
  if (!payload) {
    res.status(401).json({ error: 'Invalid or expired session.' });
    return;
  }
  const user = db.users.find((u) => u.id === payload.sub);
  if (!user) {
    res.status(401).json({ error: 'Account not found.' });
    return;
  }
  req.authUser = user;
  next();
}

// ============================================================================
// WebSocket Collaborative Rooms (Quiz Battles & Shared Code Library)
// ============================================================================

interface RoomParticipant {
  clientId: string;
  name: string;
  score: number;
  answeredIndices: number[];
  isHost: boolean;
}

interface RoomChatMessage {
  id: string;
  sender: string;
  text: string;
  timestamp: string;
}

interface CollabRoom {
  code: string;
  mode: 'quiz' | 'code';
  topic: 'types' | 'lists';
  hostClientId: string;
  status: 'lobby' | 'active' | 'finished';
  currentQuestionIndex: number;
  quizQuestionIds: string[];
  sharedCode: string;
  sharedOutput: string[];
  sharedError: string | null;
  lastUpdatedBy: string;
  participants: Map<string, RoomParticipant>;
  sockets: Map<string, WebSocket>;
  chat: RoomChatMessage[];
}

const rooms = new Map<string, CollabRoom>();

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[crypto.randomInt(0, chars.length)];
  }
  return rooms.has(code) ? generateRoomCode() : code;
}

function serializeRoom(room: CollabRoom) {
  return {
    code: room.code,
    mode: room.mode,
    topic: room.topic,
    hostClientId: room.hostClientId,
    status: room.status,
    currentQuestionIndex: room.currentQuestionIndex,
    quizQuestionIds: room.quizQuestionIds,
    sharedCode: room.sharedCode,
    sharedOutput: room.sharedOutput,
    sharedError: room.sharedError,
    lastUpdatedBy: room.lastUpdatedBy,
    participants: Array.from(room.participants.values()),
    chat: room.chat.slice(-40),
  };
}

function broadcastRoomState(room: CollabRoom): void {
  const payload = JSON.stringify({
    type: 'room:state',
    room: serializeRoom(room),
  });
  for (const ws of room.sockets.values()) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(payload);
    }
  }
}

function broadcastToOthers(room: CollabRoom, senderClientId: string, msg: object): void {
  const payload = JSON.stringify(msg);
  for (const [cid, ws] of room.sockets.entries()) {
    if (cid !== senderClientId && ws.readyState === WebSocket.OPEN) {
      ws.send(payload);
    }
  }
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '512kb' }));
  app.use((err: unknown, _req: Request, res: Response, next: NextFunction) => {
    if (err && typeof err === 'object' && 'status' in err) {
      res.status(400).json({ error: 'Invalid JSON request payload.' });
      return;
    }
    next(err);
  });

  // Auth routes
  app.post('/api/auth/register', (req: Request, res: Response) => {
    const rawName = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
    const rawEmail = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const rawPassword = typeof req.body?.password === 'string' ? req.body.password : '';

    if (rawName.length < 2 || rawName.length > 40) {
      res.status(400).json({ error: 'Display name must be between 2 and 40 characters.' });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawEmail) || rawEmail.length > 120) {
      res.status(400).json({ error: 'Please enter a valid email address.' });
      return;
    }
    if (rawPassword.length < 6 || rawPassword.length > 100) {
      res.status(400).json({ error: 'Password must be at least 6 characters long.' });
      return;
    }

    if (db.users.some((u) => u.email === rawEmail)) {
      res.status(409).json({ error: 'An account with this email already exists.' });
      return;
    }

    const preferredLanguage = normalizeLanguage(req.body?.preferredLanguage);
    const avatarUrl = normalizeAvatarUrl(req.body?.avatarUrl);

    const newUser: StoredUser = {
      id: crypto.randomUUID(),
      name: rawName,
      email: rawEmail,
      passwordHash: hashPassword(rawPassword),
      avatarUrl,
      points: 50, // Welcome bonus points
      preferredLanguage,
      progress: createDefaultProgress(),
      createdAt: new Date().toISOString(),
    };

    db.users.push(newUser);
    saveDb();

    const token = signToken(newUser.id);
    res.status(201).json({ token, user: sanitizeUser(newUser) });
  });

  app.post('/api/auth/login', (req: Request, res: Response) => {
    const rawEmail = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const rawPassword = typeof req.body?.password === 'string' ? req.body.password : '';

    const user = db.users.find((u) => u.email === rawEmail);
    if (!user || !verifyPassword(rawPassword, user.passwordHash)) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    // Allow updating profile photo right during sign-in if the user selected one
    if (Object.prototype.hasOwnProperty.call(req.body ?? {}, 'avatarUrl')) {
      const nextAvatar = normalizeAvatarUrl(req.body?.avatarUrl);
      if (nextAvatar) {
        user.avatarUrl = nextAvatar;
        saveDb();
      }
    }

    const token = signToken(user.id);
    res.json({ token, user: sanitizeUser(user) });
  });

  app.get('/api/auth/me', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    res.json({ user: sanitizeUser(req.authUser!) });
  });

  app.patch('/api/auth/preferences', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    const user = req.authUser!;
    if (typeof req.body?.preferredLanguage === 'string') {
      user.preferredLanguage = normalizeLanguage(req.body.preferredLanguage);
    }
    if (Object.prototype.hasOwnProperty.call(req.body ?? {}, 'avatarUrl')) {
      user.avatarUrl = req.body.avatarUrl === null || req.body.avatarUrl === ''
        ? undefined
        : normalizeAvatarUrl(req.body.avatarUrl) ?? user.avatarUrl;
    }
    saveDb();
    res.json({ user: sanitizeUser(user) });
  });

  // Progress & Points sync
  app.post('/api/progress/sync', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    const user = req.authUser!;
    const action = typeof req.body?.action === 'string' ? req.body.action : '';

    if (action === 'record_quiz') {
      const topic = req.body?.topic === 'lists' ? 'lists' : req.body?.topic === 'types' ? 'types' : null;
      const subtopic = typeof req.body?.subtopic === 'string' ? req.body.subtopic.slice(0, 80) : '';
      const isCorrect = Boolean(req.body?.isCorrect);
      if (!topic || !subtopic) {
        res.status(400).json({ error: 'Invalid quiz payload.' });
        return;
      }

      user.progress.totalAnswered += 1;
      if (isCorrect) user.progress.totalCorrect += 1;

      const mod = user.progress.moduleStats[topic];
      mod.answered += 1;
      if (isCorrect) mod.correct += 1;
      else mod.wrong += 1;

      const key = `${topic}::${subtopic}`;
      const sub = user.progress.subtopicStats[key] ?? { answered: 0, correct: 0, wrong: 0 };
      sub.answered += 1;
      if (isCorrect) sub.correct += 1;
      else sub.wrong += 1;
      user.progress.subtopicStats[key] = sub;

      // Award points: +15 for correct answer, +5 participation for attempt
      user.points += isCorrect ? 15 : 5;
      saveDb();
      res.json({ user: sanitizeUser(user), pointsAwarded: isCorrect ? 15 : 5 });
      return;
    }

    if (action === 'complete_lesson') {
      const lessonId = typeof req.body?.lessonId === 'string' ? req.body.lessonId.slice(0, 60) : '';
      if (!lessonId) {
        res.status(400).json({ error: 'Invalid lessonId.' });
        return;
      }
      let awarded = 0;
      if (!user.progress.completedLessonIds.includes(lessonId)) {
        user.progress.completedLessonIds.push(lessonId);
        awarded = 25;
        user.points += awarded;
        saveDb();
      }
      res.json({ user: sanitizeUser(user), pointsAwarded: awarded });
      return;
    }

    if (action === 'complete_game') {
      const gameId = typeof req.body?.gameId === 'string' ? req.body.gameId.slice(0, 60) : '';
      if (!gameId) {
        res.status(400).json({ error: 'Invalid gameId.' });
        return;
      }
      let awarded = 0;
      if (!user.progress.completedGameIds.includes(gameId)) {
        user.progress.completedGameIds.push(gameId);
        awarded = 30;
        user.points += awarded;
        saveDb();
      }
      res.json({ user: sanitizeUser(user), pointsAwarded: awarded });
      return;
    }

    if (action === 'award_points') {
      const amount = Number(req.body?.amount);
      if (!Number.isInteger(amount) || amount < 1 || amount > 100) {
        res.status(400).json({ error: 'Invalid points amount.' });
        return;
      }
      user.points += amount;
      saveDb();
      res.json({ user: sanitizeUser(user), pointsAwarded: amount });
      return;
    }

    if (action === 'reset_progress') {
      user.progress = createDefaultProgress();
      saveDb();
      res.json({ user: sanitizeUser(user), pointsAwarded: 0 });
      return;
    }

    res.status(400).json({ error: 'Unsupported action.' });
  });

  // Public Leaderboard (no PII exposed)
  app.get('/api/leaderboard', (_req: Request, res: Response) => {
    const top = [...db.users]
      .sort((a, b) => b.points - a.points)
      .slice(0, 10)
      .map((u) => ({
        id: u.id,
        name: u.name,
        points: u.points,
        lessonsCompleted: u.progress.completedLessonIds.length,
        challengesSolved: u.progress.completedGameIds.length,
      }));
    res.json({ leaderboard: top });
  });

  // Shared Code Library endpoints
  app.get('/api/library', (_req: Request, res: Response) => {
    res.json({ snippets: db.library });
  });

  app.post('/api/library', (req: AuthenticatedRequest, res: Response) => {
    const title = typeof req.body?.title === 'string' ? req.body.title.trim() : '';
    const code = typeof req.body?.code === 'string' ? req.body.code : '';
    const topic = req.body?.topic === 'lists' ? 'lists' : 'types';
    let authorName = typeof req.body?.authorName === 'string' ? req.body.authorName.trim() : 'Learner';

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const payload = verifyToken(authHeader.slice(7).trim());
      if (payload) {
        const found = db.users.find((u) => u.id === payload.sub);
        if (found) authorName = found.name;
      }
    }

    if (title.length < 2 || title.length > 80) {
      res.status(400).json({ error: 'Snippet title must be 2–80 characters.' });
      return;
    }
    if (code.trim().length < 2 || code.length > 8000) {
      res.status(400).json({ error: 'Code must be 2–8000 characters.' });
      return;
    }

    const snippet: LibrarySnippet = {
      id: `lib-${crypto.randomUUID().slice(0, 8)}`,
      title,
      topic,
      code,
      authorName: authorName.slice(0, 40) || 'Learner',
      createdAt: new Date().toISOString(),
    };

    db.library.unshift(snippet);
    db.library = db.library.slice(0, 50);
    saveDb();
    res.status(201).json({ snippet, snippets: db.library });
  });

  // MARK Curriculum Tutor Chatbot (grounded in Python Data Types & Python Lists)
  app.post('/api/mark/chat', async (req: Request, res: Response) => {
    const message = typeof req.body?.message === 'string' ? req.body.message.trim() : '';
    const activeTopic = req.body?.activeTopic === 'lists' ? 'Python Lists' : 'Python Data Types';
    const preferredLanguage = normalizeLanguage(req.body?.preferredLanguage);
    const rawHistory: unknown[] = Array.isArray(req.body?.history)
      ? (req.body.history as unknown[])
      : [];

    if (message.length < 1 || message.length > 800) {
      res.status(400).json({ error: 'Please enter a question between 1 and 800 characters.' });
      return;
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      res.status(503).json({
        error: 'MARK requires a Gemini API key in Settings > Secrets (GEMINI_API_KEY).',
      });
      return;
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const LANGUAGE_NAMES: Record<InterfaceLanguage, string> = {
      en: 'English',
      hi: 'Hindi (हिन्दी)',
      ta: 'Tamil (தமிழ்)',
      te: 'Telugu (తెలుగు)',
      bn: 'Bengali (বাংলা)',
      mr: 'Marathi (मराठी)',
      es: 'Spanish (Español)',
      fr: 'French (Français)',
    };

    const systemInstruction = `You are MARK, a concise, friendly Python tutor embedded inside SendBox.
Your knowledge library strictly covers two curriculum modules:
1. Python Data Types:
   - Dynamic typing & type() function
   - Numeric types: int (whole numbers), float (decimals, single-slash / always returns float, 10.0 is float), complex (2 + 3j using j)
   - Floor division (//), modulo (%), exponentiation (**)
   - Strings (str, immutable text in quotes) and Booleans (bool: capitalized True/False; truthiness: 0, "", [], {}, set(), None are falsy while "False" is truthy)
   - Type conversion / casting: int(), float(), str(), bool(), set(), tuple(), list(); int(4.9) truncates to 4; int("3.14") raises ValueError
   - Collections: list [] (ordered, mutable, duplicates ok), tuple () (ordered, immutable), set {} (unordered, mutable, unique items only; empty {} is dict, use set() for empty set), dict {k: v} (key-value mapping)
2. Python Lists:
   - Creating lists with [], len(), membership with 'in', nested lists
   - Zero-based positive indexing (0 is first) and negative indexing (-1 is last)
   - Slicing list[start:stop:step] (start inclusive, stop exclusive, out-of-bounds slices don't error, [:] copies, [::-1] reverses)
   - In-place methods: append(x), insert(i, x), remove(x) (by value, returns None), pop(i) (by index, returns removed item), sort() (in-place returns None vs sorted() returns new list)
   - Mutability & reference aliasing: b = a shares the same list object; use b = a.copy() or a[:] for an independent copy
   - List operations (+ concatenation, * repetition) and list comprehensions [x * 2 for x in nums if x > 10]

Guidelines:
- Keep answers concise (3-6 sentences max) with a short Python code snippet when helpful.
- The student is currently viewing: ${activeTopic}.
- Reply in ${LANGUAGE_NAMES[preferredLanguage]} while keeping Python syntax and code snippets in standard Python.
- If a student asks about topics completely outside Python Data Types or Python Lists, briefly explain how it relates to Data Types or Lists or invite them to ask a doubt from those two modules.`;

    const validHistory = rawHistory
      .slice(-8)
      .filter(
        (m: unknown): m is { role: string; text: string } =>
          typeof m === 'object' &&
          m !== null &&
          typeof (m as { role?: unknown }).role === 'string' &&
          typeof (m as { text?: unknown }).text === 'string' &&
          (m as { text: string }).text.trim().length > 0
      )
      .map((m: { role: string; text: string }) => ({
        role: m.role === 'mark' ? ('model' as const) : ('user' as const),
        parts: [{ text: m.text.slice(0, 800) }],
      }));

    // Gemini multi-turn contents should begin with a user turn
    const firstUserIdx = validHistory.findIndex((turn) => turn.role === 'user');
    const priorTurns = firstUserIdx >= 0 ? validHistory.slice(firstUserIdx) : [];

    // Avoid duplicating the current message if the client included it at the tail
    const lastTurn = priorTurns[priorTurns.length - 1];
    if (
      lastTurn &&
      lastTurn.role === 'user' &&
      lastTurn.parts[0]?.text.trim() === message
    ) {
      priorTurns.pop();
    }

    const contents = [
      ...priorTurns,
      { role: 'user' as const, parts: [{ text: message }] },
    ];

    const callGemini = () =>
      ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents,
        config: {
          systemInstruction,
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        },
      });

    try {
      let response;
      try {
        response = await callGemini();
      } catch (firstErr) {
        const msg = firstErr instanceof Error ? firstErr.message : '';
        if (msg.includes('400') || msg.includes('403') || msg.includes('404')) {
          throw firstErr;
        }
        await new Promise((resolve) => setTimeout(resolve, 400));
        response = await callGemini();
      }

      const reply = (response.text ?? '').trim();
      if (!reply) {
        res.status(502).json({ error: 'MARK did not receive a response. Please try again.' });
        return;
      }
      res.json({ reply });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unable to reach Gemini service.';
      res.status(502).json({ error: msg });
    }
  });

  // In-memory TTS cache to avoid repeating requests against daily free-tier limits
  const ttsCache = new Map<string, { audioBase64: string; mimeType: string; voiceUsed: string }>();

  // Gemini TTS endpoint (Indian English accent + Pegasus voice)
  app.post('/api/tts', async (req: Request, res: Response) => {
    const rawText = typeof req.body?.text === 'string' ? req.body.text : '';
    const preferredLanguage = normalizeLanguage(req.body?.preferredLanguage);
    // Strip markdown code fences/markers so voice reads cleanly
    const cleanText = rawText
      .replace(/```(?:python|py)?[\s\S]*?```/g, ' Python code example shown on screen. ')
      .replace(/[`*_#]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 1500);

    if (!cleanText) {
      res.status(400).json({ error: 'Text is required for speech synthesis.' });
      return;
    }

    const ttsCacheKey = `${preferredLanguage}::${cleanText}`;
    const cachedTts = ttsCache.get(ttsCacheKey);
    if (cachedTts) {
      res.json(cachedTts);
      return;
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      res.status(503).json({
        error: 'Voice playback requires a Gemini API key in Settings > Secrets (GEMINI_API_KEY).',
      });
      return;
    }

    const ai = new GoogleGenAI({
      apiKey,
      apiVersion: 'v1beta',
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const accentPrompt =
      preferredLanguage === 'en'
        ? 'Speak in a warm, clear Indian English accent like a helpful Python tutor.'
        : `Speak clearly in a warm Indian accent suited for language code ${preferredLanguage}.`;

    const synthesizeWithVoice = (model: 'gemini-3.8-flash-lite-tts' | 'gemini-3.8-flash-tts', voiceName: string) =>
      ai.models.generateContent({
        model,
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: cleanText,
                speechMetadata: {
                  style: accentPrompt,
                },
              } as Record<string, unknown>,
            ],
          },
        ],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName },
            },
          },
        },
      });

    try {
      let voiceUsed = 'Pegasus';
      let response;
      try {
        response = await synthesizeWithVoice('gemini-3.8-flash-lite-tts', 'Pegasus');
      } catch (primaryErr) {
        const primaryMsg = primaryErr instanceof Error ? primaryErr.message : '';
        const lowerMsg = primaryMsg.toLowerCase();
        if (lowerMsg.includes('429') || lowerMsg.includes('quota') || lowerMsg.includes('resource_exhausted')) {
          // Try flash-tts model if flash-lite-tts daily free quota is exhausted
          voiceUsed = 'Kore';
          response = await synthesizeWithVoice('gemini-3.8-flash-tts', 'Kore');
        } else if (lowerMsg.includes('voice') || primaryMsg.includes('400') || lowerMsg.includes('invalid')) {
          voiceUsed = 'Kore';
          response = await synthesizeWithVoice('gemini-3.8-flash-lite-tts', 'Kore');
        } else {
          throw primaryErr;
        }
      }

      const audioPart = response.candidates?.[0]?.content?.parts?.find(
        (part) => Boolean(part.inlineData?.data)
      );
      const audioBase64 = audioPart?.inlineData?.data;
      const mimeType = audioPart?.inlineData?.mimeType || 'audio/wav';
      if (!audioBase64) {
        res.status(503).json({ error: 'Voice generator returned empty audio.' });
        return;
      }

      const payload = { audioBase64, mimeType, voiceUsed };
      if (ttsCache.size > 60) {
        const firstKey = ttsCache.keys().next().value;
        if (firstKey) ttsCache.delete(firstKey);
      }
      ttsCache.set(ttsCacheKey, payload);

      res.json(payload);
    } catch (err) {
      let msg = err instanceof Error ? err.message : 'Unable to generate voice audio.';
      let statusCode = 500;
      try {
        const parsed = JSON.parse(msg) as { error?: { code?: number; message?: string; status?: string } };
        if (parsed?.error?.message) {
          msg = parsed.error.message;
        }
        if (typeof parsed?.error?.code === 'number') {
          statusCode = parsed.error.code;
        }
      } catch {
        // Keep string message as-is when not JSON
      }
      const lower = msg.toLowerCase();
      if (lower.includes('quota') || lower.includes('resource_exhausted') || statusCode === 429) {
        res.status(429).json({
          error: 'Daily free Gemini voice quota reached — using built-in device voice.',
        });
        return;
      }
      if (statusCode === 403 || lower.includes('permission_denied') || lower.includes('api_key_invalid')) {
        res.status(403).json({
          error: 'Check your Gemini API key in Settings > Secrets for studio voice narration.',
        });
        return;
      }
      res.status(statusCode >= 400 && statusCode < 500 ? statusCode : 503).json({
        error: msg,
      });
    }
  });

  // Attach Vite in development or static dist in production
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  const httpServer = http.createServer(app);

  // WebSocket Server on /ws
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws: WebSocket) => {
    const clientId = crypto.randomUUID().slice(0, 8);
    let activeRoomCode: string | null = null;

    ws.send(JSON.stringify({ type: 'session:init', clientId }));

    ws.on('message', (raw) => {
      try {
        const msg = JSON.parse(raw.toString()) as Record<string, unknown>;
        const type = typeof msg.type === 'string' ? msg.type : '';

        if (type === 'room:create') {
          const mode = msg.mode === 'code' ? 'code' : 'quiz';
          const topic = msg.topic === 'lists' ? 'lists' : 'types';
          const name = typeof msg.name === 'string' && msg.name.trim() ? msg.name.trim().slice(0, 30) : 'Host';
          const questionIds = Array.isArray(msg.questionIds)
            ? msg.questionIds.filter((q): q is string => typeof q === 'string').slice(0, 12)
            : [];
          const initialCode =
            typeof msg.initialCode === 'string'
              ? msg.initialCode.slice(0, 8000)
              : '# Collaborative Python Library Session\nnums = [10, 20, 30]\nprint("Sum:", sum(nums))';

          // Leave previous room if any
          if (activeRoomCode && rooms.has(activeRoomCode)) {
            const prev = rooms.get(activeRoomCode)!;
            prev.participants.delete(clientId);
            prev.sockets.delete(clientId);
            if (prev.participants.size === 0) rooms.delete(activeRoomCode);
            else broadcastRoomState(prev);
          }

          const code = generateRoomCode();
          const room: CollabRoom = {
            code,
            mode,
            topic,
            hostClientId: clientId,
            status: mode === 'code' ? 'active' : 'lobby',
            currentQuestionIndex: 0,
            quizQuestionIds: questionIds,
            sharedCode: initialCode,
            sharedOutput: [],
            sharedError: null,
            lastUpdatedBy: name,
            participants: new Map([
              [
                clientId,
                {
                  clientId,
                  name,
                  score: 0,
                  answeredIndices: [],
                  isHost: true,
                },
              ],
            ]),
            sockets: new Map([[clientId, ws]]),
            chat: [
              {
                id: crypto.randomUUID().slice(0, 8),
                sender: 'System',
                text: `${name} created ${mode === 'quiz' ? 'a live quiz room' : 'a collaborative code library'}. Share code ${code} to invite friends.`,
                timestamp: new Date().toISOString(),
              },
            ],
          };

          rooms.set(code, room);
          activeRoomCode = code;
          broadcastRoomState(room);
          return;
        }

        if (type === 'room:join') {
          const roomCode = typeof msg.roomCode === 'string' ? msg.roomCode.trim().toUpperCase() : '';
          const name = typeof msg.name === 'string' && msg.name.trim() ? msg.name.trim().slice(0, 30) : 'Friend';
          const room = rooms.get(roomCode);

          if (!room) {
            ws.send(JSON.stringify({ type: 'room:error', message: `Room "${roomCode}" was not found.` }));
            return;
          }

          if (activeRoomCode && activeRoomCode !== roomCode && rooms.has(activeRoomCode)) {
            const prev = rooms.get(activeRoomCode)!;
            prev.participants.delete(clientId);
            prev.sockets.delete(clientId);
            if (prev.participants.size === 0) rooms.delete(activeRoomCode);
            else broadcastRoomState(prev);
          }

          activeRoomCode = roomCode;
          room.sockets.set(clientId, ws);
          if (!room.participants.has(clientId)) {
            room.participants.set(clientId, {
              clientId,
              name,
              score: 0,
              answeredIndices: [],
              isHost: room.hostClientId === clientId,
            });
            room.chat.push({
              id: crypto.randomUUID().slice(0, 8),
              sender: 'System',
              text: `${name} joined the session.`,
              timestamp: new Date().toISOString(),
            });
          }
          broadcastRoomState(room);
          return;
        }

        if (!activeRoomCode || !rooms.has(activeRoomCode)) return;
        const room = rooms.get(activeRoomCode)!;

        if (type === 'quiz:start' && room.hostClientId === clientId) {
          room.status = 'active';
          room.currentQuestionIndex = 0;
          for (const p of room.participants.values()) {
            p.score = 0;
            p.answeredIndices = [];
          }
          broadcastRoomState(room);
          return;
        }

        if (type === 'quiz:answer') {
          const qIdx = Number(msg.questionIndex);
          const isCorrect = Boolean(msg.isCorrect);
          const participant = room.participants.get(clientId);
          if (!participant || !Number.isInteger(qIdx) || qIdx !== room.currentQuestionIndex) return;
          if (participant.answeredIndices.includes(qIdx)) return; // Idempotent guard

          participant.answeredIndices.push(qIdx);
          if (isCorrect) {
            participant.score += 15;
          }
          broadcastRoomState(room);
          return;
        }

        if (type === 'quiz:next' && room.hostClientId === clientId) {
          if (room.currentQuestionIndex + 1 >= room.quizQuestionIds.length) {
            room.status = 'finished';
          } else {
            room.currentQuestionIndex += 1;
          }
          broadcastRoomState(room);
          return;
        }

        if (type === 'code:update') {
          const nextCode = typeof msg.code === 'string' ? msg.code.slice(0, 8000) : '';
          const author = room.participants.get(clientId)?.name ?? 'Collaborator';
          room.sharedCode = nextCode;
          room.lastUpdatedBy = author;
          broadcastToOthers(room, clientId, {
            type: 'code:synced',
            code: nextCode,
            updatedBy: author,
          });
          return;
        }

        if (type === 'code:output') {
          const output = Array.isArray(msg.output)
            ? msg.output.filter((l): l is string => typeof l === 'string').slice(0, 100)
            : [];
          const error = typeof msg.error === 'string' ? msg.error.slice(0, 500) : null;
          room.sharedOutput = output;
          room.sharedError = error;
          broadcastRoomState(room);
          return;
        }

        if (type === 'room:chat') {
          const text = typeof msg.text === 'string' ? msg.text.trim().slice(0, 300) : '';
          if (!text) return;
          const sender = room.participants.get(clientId)?.name ?? 'Learner';
          room.chat.push({
            id: crypto.randomUUID().slice(0, 8),
            sender,
            text,
            timestamp: new Date().toISOString(),
          });
          broadcastRoomState(room);
        }
      } catch {
        // Ignore malformed WS messages safely
      }
    });

    ws.on('close', () => {
      if (activeRoomCode && rooms.has(activeRoomCode)) {
        const room = rooms.get(activeRoomCode)!;
        const leaving = room.participants.get(clientId);
        room.participants.delete(clientId);
        room.sockets.delete(clientId);
        if (room.participants.size === 0) {
          rooms.delete(activeRoomCode);
        } else {
          if (room.hostClientId === clientId) {
            const nextHost = room.participants.values().next().value;
            if (nextHost) {
              nextHost.isHost = true;
              room.hostClientId = nextHost.clientId;
            }
          }
          if (leaving) {
            room.chat.push({
              id: crypto.randomUUID().slice(0, 8),
              sender: 'System',
              text: `${leaving.name} left the session.`,
              timestamp: new Date().toISOString(),
            });
          }
          broadcastRoomState(room);
        }
      }
    });
  });

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`LearnLoop server listening on http://localhost:${PORT}`);
  });
}

startServer();
