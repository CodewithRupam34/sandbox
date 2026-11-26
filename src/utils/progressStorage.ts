import { ProgressData, TopicId } from '../types/learning';

export function createDefaultProgress(): ProgressData {
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

// Clear any legacy guest data from localStorage so unsigned-in sessions never persist data
export function clearGuestLocalStorage(): void {
  try {
    localStorage.removeItem('pyconceptProgress');
    localStorage.removeItem('learnloopGuestPoints');
  } catch {
    // Ignore storage access restrictions
  }
}

export function recordQuizAnswerInMemory(
  prev: ProgressData,
  topic: TopicId,
  subtopic: string,
  isCorrect: boolean
): ProgressData {
  const next: ProgressData = structuredClone(prev);
  next.totalAnswered += 1;
  if (isCorrect) {
    next.totalCorrect += 1;
  }

  const modStat = next.moduleStats[topic] ?? { answered: 0, correct: 0, wrong: 0 };
  modStat.answered += 1;
  if (isCorrect) modStat.correct += 1;
  else modStat.wrong += 1;
  next.moduleStats[topic] = modStat;

  const key = `${topic}::${subtopic}`;
  const subStat = next.subtopicStats[key] ?? { answered: 0, correct: 0, wrong: 0 };
  subStat.answered += 1;
  if (isCorrect) subStat.correct += 1;
  else subStat.wrong += 1;
  next.subtopicStats[key] = subStat;

  return next;
}

export function markLessonCompletedInMemory(
  prev: ProgressData,
  lessonId: string
): ProgressData {
  if (prev.completedLessonIds.includes(lessonId)) return prev;
  const next: ProgressData = structuredClone(prev);
  next.completedLessonIds.push(lessonId);
  return next;
}

export function markGameCompletedInMemory(
  prev: ProgressData,
  gameId: string
): ProgressData {
  if (prev.completedGameIds.includes(gameId)) return prev;
  const next: ProgressData = structuredClone(prev);
  next.completedGameIds.push(gameId);
  return next;
}

export function getWeakSubtopics(
  progress: ProgressData,
  topicFilter?: TopicId
): Array<{
  topic: TopicId;
  subtopic: string;
  accuracy: number;
  wrong: number;
  answered: number;
}> {
  const items: Array<{
    topic: TopicId;
    subtopic: string;
    accuracy: number;
    wrong: number;
    answered: number;
  }> = [];

  for (const [key, stat] of Object.entries(progress.subtopicStats)) {
    const [topicRaw, subtopic] = key.split('::');
    const topic = topicRaw as TopicId;
    if (topicFilter && topic !== topicFilter) continue;
    if (stat.answered === 0) continue;
    const accuracy = Math.round((stat.correct / stat.answered) * 100);
    if (stat.wrong > 0 && accuracy < 80) {
      items.push({
        topic,
        subtopic,
        accuracy,
        wrong: stat.wrong,
        answered: stat.answered,
      });
    }
  }

  return items.sort((a, b) => a.accuracy - b.accuracy || b.wrong - a.wrong);
}
