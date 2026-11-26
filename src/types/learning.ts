export type TopicId = 'types' | 'lists';

export type ModeId = 'theory' | 'video' | 'quiz' | 'game' | 'lab';

export type QuizFormat = 'objective' | 'rapid' | 'subjective';

export interface DiagramNode {
  label: string;
  sublabel: string;
  pythonType: string;
  mutable: string;
  detail: string;
}

export interface TheoryDeepDive {
  heading: string;
  body: string;
}

export interface ComparisonRow {
  label: string;
  behavior: string;
  example: string;
}

export interface TheoryLesson {
  id: string;
  title: string;
  summary: string;
  deepDive: TheoryDeepDive[];
  pitfall: string;
  comparisonTitle?: string;
  comparisonRows?: ComparisonRow[];
  diagramTitle: string;
  nodes: DiagramNode[];
  code: string;
  expectedOutput: string;
  keyTakeaway: string;
}

export interface AnimatedCheckpoint {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export type AnimationKind =
  | 'empty-list'
  | 'jump-in'
  | 'pop-fade'
  | 'delete-fade'
  | 'index-scan'
  | 'insert-shift'
  | 'slice-window'
  | 'type-box'
  | 'bool-toggle'
  | 'set-dedup'
  | 'tuple-lock'
  | 'dict-pair';

export interface AnimatedStageItem {
  id: string;
  label: string;
  tag: string;
  highlight?: boolean;
  dimmed?: boolean;
  removed?: boolean;
  added?: boolean;
  duplicate?: boolean;
  scanTarget?: boolean;
  stateLabel?: string;
  pairValue?: string;
}

export interface AnimatedStage {
  id: string;
  title: string;
  narration: string;
  spokenScript: string;
  codeLine: string;
  animationKind: AnimationKind;
  actionBadge?: string;
  returnedValue?: string;
  items: AnimatedStageItem[];
  checkpoint?: AnimatedCheckpoint;
}

export interface VideoExamQuestion {
  q: string;
  answer: string;
  note: string;
}

export interface VideoLessonTrack {
  id: string;
  topic: TopicId;
  shortLabel: string;
  title: string;
  subtitle: string;
  detailedConcepts: string[];
  examQuestions: VideoExamQuestion[];
  stages: AnimatedStage[];
}

export interface QuizQuestion {
  id: string;
  topic: TopicId;
  subtopic: string;
  question: string;
  codeSnippet?: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  supportiveExample: string;
}

export interface SubjectiveQuestion {
  id: string;
  topic: TopicId;
  subtopic: string;
  prompt: string;
  starterCode?: string;
  mode: 'explanation' | 'code';
  requiredKeywords?: string[];
  expectedOutput?: string;
  modelAnswer: string;
  theorySummary: string;
  supportiveExample: string;
}

export interface MistakeFlashcard {
  id: string;
  subtopic: string;
  questionText: string;
  yourAnswer: string;
  correctAnswer: string;
  theoryExplanation: string;
  supportiveExample: string;
}

export interface GameChallenge {
  id: string;
  topic: TopicId;
  title: string;
  instruction: string;
  codeBefore: string;
  codeAfter: string;
  placeholder: string;
  acceptedAnswers: string[];
  tokenHints: string[];
  expectedOutput: string;
  hint: string;
}

export interface PlaygroundPreset {
  id: string;
  title: string;
  description: string;
  code: string;
}

export interface TopicStat {
  answered: number;
  correct: number;
  wrong: number;
}

export interface ProgressData {
  totalAnswered: number;
  totalCorrect: number;
  subtopicStats: Record<string, TopicStat>;
  moduleStats: Record<TopicId, TopicStat>;
  completedGameIds: string[];
  completedLessonIds: string[];
}

export type InterfaceLanguage = 'en' | 'hi' | 'ta' | 'te' | 'bn' | 'mr' | 'es' | 'fr';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  points: number;
  preferredLanguage: InterfaceLanguage;
  progress: ProgressData;
  createdAt: string;
}

export interface AppNotification {
  id: string;
  title: string;
  detail: string;
  time: string;
  read: boolean;
}

export interface LibrarySnippet {
  id: string;
  title: string;
  topic: TopicId;
  code: string;
  authorName: string;
  createdAt: string;
}
