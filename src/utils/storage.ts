import {
  DailyJournal,
  Habit,
  HabitCategory,
  PracticeSession,
  UserProfile,
  PersonalStats,
} from '../types';

const STORAGE_KEYS = {
  PROFILE: 'evolua_profile',
  HABITS: 'evolua_habits',
  HABIT_LOGS: 'evolua_habit_logs', // Record<string, Record<string, boolean>> (date -> { habitId: boolean })
  SESSIONS: 'evolua_practice_sessions',
  JOURNALS: 'evolua_journals',
  LOCKED: 'evolua_is_locked',
};
export const DEFAULT_HABITS: Habit[] = [
  {
    id: 'habit-bible',
    name: 'Leitura da Bíblia Sagrada',
    category: 'faith',
    color: '#6366f1', // Indigo celestial
    icon: '📖',
    targetMinutes: 15,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'habit-1',
    name: 'Leitura Focada',
    category: 'knowledge',
    color: '#10b981', // Emerald
    icon: '📚',
    targetMinutes: 20,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'habit-2',
    name: 'Meditação & Mindfulness',
    category: 'mind',
    color: '#8b5cf6', // Purple
    icon: '🧘',
    targetMinutes: 10,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'habit-3',
    name: 'Exercício / Treino Físico',
    category: 'body',
    color: '#f59e0b', // Amber
    icon: '🏃',
    targetMinutes: 30,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'habit-4',
    name: 'Hidratação (2L de Água)',
    category: 'wellness',
    color: '#06b6d4', // Cyan
    icon: '💧',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'habit-5',
    name: 'Deep Work / Trabalho Focado',
    category: 'productivity',
    color: '#f43f5e', // Rose
    icon: '⚡',
    targetMinutes: 45,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'habit-6',
    name: 'Gratidão & Diário da Noite',
    category: 'mind',
    color: '#ec4899', // Pink
    icon: '✍️',
    createdAt: new Date().toISOString(),
  },
];

export const CATEGORY_LABELS: Record<HabitCategory, { label: string; icon: string; color: string }> = {
  faith: { label: 'Bíblia Sagrada & Fé', icon: '📖', color: '#6366f1' },
  mind: { label: 'Mente & Consciência', icon: '🧠', color: '#8b5cf6' },
  body: { label: 'Corpo & Vitalidade', icon: '⚡', color: '#f59e0b' },
  knowledge: { label: 'Conhecimento & Leitura', icon: '📚', color: '#10b981' },
  productivity: { label: 'Produtividade & Foco', icon: '🎯', color: '#f43f5e' },
  wellness: { label: 'Bem-Estar & Saúde', icon: '🌿', color: '#06b6d4' },
};

export const DEFAULT_PROFILE: UserProfile = {
  name: 'Luke',
  manifesto: 'Construindo consistência inabalável e evolução diária através de hábitos conscientes.',
  avatar: 'target',
  dailyHabitsGoal: 5,
  dailyFocusMinutesGoal: 60,
  pinCode: '',
  pinEnabled: false,
  soundEnabled: true,
  soundVolume: 0.6,
  ambientSound: 'none',
  ambientVolume: 0.3,
  pomodoroWorkMinutes: 25,
  pomodoroShortBreakMinutes: 5,
  pomodoroLongBreakMinutes: 15,
  pomodorosUntilLongBreak: 4,
  autoStartBreaks: false,
  autoStartPomodoro: false,
  createdAt: new Date().toISOString(),
};

// Date helpers
export function formatDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getTodayDateString(): string {
  return formatDate(new Date());
}

export function formatSecondsToHuman(totalSeconds: number): string {
  if (!totalSeconds || totalSeconds <= 0) return '0m';
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes.toString().padStart(2, '0')}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds.toString().padStart(2, '0')}s`;
  }
  return `${seconds}s`;
}

export function formatTimeDigital(seconds: number): { hours: string; mins: string; secs: string } {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  return {
    hours: h > 0 ? String(h).padStart(2, '0') : '',
    mins: String(m).padStart(2, '0'),
    secs: String(s).padStart(2, '0'),
  };
}

// STORAGE API
export function getUserProfile(): UserProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PROFILE);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(DEFAULT_PROFILE));
      return DEFAULT_PROFILE;
    }
    return { ...DEFAULT_PROFILE, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PROFILE;
  }
}

export function saveUserProfile(profile: UserProfile): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
  } catch (e) {
    console.error('Failed to save profile:', e);
  }
}

// Habits
export function getHabits(): Habit[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.HABITS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify(DEFAULT_HABITS));
      return DEFAULT_HABITS;
    }
    const parsed: Habit[] = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      // Ensure "Leitura da Bíblia Sagrada" is always available
      const hasBible = parsed.some(
        (h) =>
          h.id === 'habit-bible' ||
          h.name.toLowerCase().includes('bíblia') ||
          h.name.toLowerCase().includes('biblia')
      );
      if (!hasBible) {
        const bibleHabit: Habit = {
          id: 'habit-bible',
          name: 'Leitura da Bíblia Sagrada',
          category: 'faith',
          color: '#6366f1',
          icon: '📖',
          targetMinutes: 15,
          createdAt: new Date().toISOString(),
        };
        const updated = [bibleHabit, ...parsed];
        localStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify(updated));
        return updated;
      }
      return parsed;
    }
    return DEFAULT_HABITS;
  } catch {
    return DEFAULT_HABITS;
  }
}

export function saveHabits(habits: Habit[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify(habits));
  } catch (e) {
    console.error('Failed to save habits:', e);
  }
}

// Habit Daily Logs
export type HabitLogsMap = Record<string, Record<string, boolean>>; // date -> { habitId: completed }

export function getHabitLogs(): HabitLogsMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.HABIT_LOGS);
    if (!raw) return {};
    return JSON.parse(raw) || {};
  } catch {
    return {};
  }
}

export function toggleHabitCompletion(date: string, habitId: string): { completed: boolean; allLogs: HabitLogsMap } {
  try {
    const logs = getHabitLogs();
    if (!logs[date]) logs[date] = {};
    const nextVal = !logs[date][habitId];
    logs[date][habitId] = nextVal;
    localStorage.setItem(STORAGE_KEYS.HABIT_LOGS, JSON.stringify(logs));
    return { completed: nextVal, allLogs: logs };
  } catch (e) {
    console.error('Failed to toggle habit:', e);
    return { completed: false, allLogs: {} };
  }
}

// Practice Sessions (Stopwatch / Pomodoro / Practice timer)
// Helper to guarantee 100% unique sessions with zero duplication
export function deduplicateSessions(sessions: PracticeSession[]): PracticeSession[] {
  const seenIds = new Set<string>();
  const seenSignatures = new Set<string>();
  const uniqueList: PracticeSession[] = [];

  for (const s of sessions) {
    if (!s || !s.id) continue;
    if (seenIds.has(s.id)) continue;

    // Logical signature: same habit + same date + duration + within 4 seconds window
    const timeWindow = Math.floor(s.startTime / 4000);
    const signature = `${s.habitId || s.habitName}_${s.date}_${s.durationSeconds}_${timeWindow}`;
    if (seenSignatures.has(signature)) continue;

    seenIds.add(s.id);
    seenSignatures.add(signature);
    uniqueList.push(s);
  }
  return uniqueList;
}

export function getPracticeSessions(): PracticeSession[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SESSIONS);
    if (!raw) return [];
    const parsed: PracticeSession[] = JSON.parse(raw) || [];
    const unique = deduplicateSessions(parsed);
    if (unique.length !== parsed.length) {
      localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(unique));
    }
    return unique;
  } catch {
    return [];
  }
}

export function savePracticeSession(session: PracticeSession): PracticeSession[] {
  try {
    const sessions = getPracticeSessions();

    // Check if session with same ID already exists
    if (sessions.some((s) => s.id === session.id)) {
      return sessions;
    }

    // Check if identical session was already saved (same habit, date and duration within recent 5s)
    const isDuplicate = sessions.some((s) => {
      const sameHabit = s.habitId === session.habitId;
      const sameDate = s.date === session.date;
      const sameDuration = s.durationSeconds === session.durationSeconds;
      const closeTime = Math.abs(s.startTime - session.startTime) < 5000;
      return sameHabit && sameDate && sameDuration && closeTime;
    });

    if (isDuplicate) {
      return sessions;
    }

    const updated = deduplicateSessions([session, ...sessions]);
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error('Failed to save practice session:', e);
    return [];
  }
}

export function deletePracticeSession(id: string): PracticeSession[] {
  try {
    const sessions = getPracticeSessions();
    const filtered = sessions.filter((s) => s.id !== id);
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(filtered));
    return filtered;
  } catch {
    return [];
  }
}

// Daily Journals (Gratitude, Win of Day, Reflections, Todos)
export function getDailyJournals(): Record<string, DailyJournal> {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.JOURNALS);
    if (!raw) return {};
    return JSON.parse(raw) || {};
  } catch {
    return {};
  }
}

export function getDailyJournal(date: string): DailyJournal {
  const journals = getDailyJournals();
  if (journals[date]) {
    return journals[date];
  }
  return {
    date,
    title: '',
    gratitude: ['', '', ''],
    winOfDay: '',
    reflections: '',
    todos: [],
    mood: undefined,
    energyLevel: undefined,
    updatedAt: Date.now(),
  };
}

export function saveDailyJournal(journal: DailyJournal): void {
  try {
    const journals = getDailyJournals();
    journals[journal.date] = { ...journal, updatedAt: Date.now() };
    localStorage.setItem(STORAGE_KEYS.JOURNALS, JSON.stringify(journals));
  } catch (e) {
    console.error('Failed to save journal:', e);
  }
}

// Calculate 100% Real Habit & Personal Stats
export function calculatePersonalStats(
  sessions: PracticeSession[],
  habitLogs: HabitLogsMap,
  goalHabitsCount: number = 5
): PersonalStats {
  const todayStr = getTodayDateString();
  const now = new Date();

  // Week boundary
  const currentDay = now.getDay();
  const diffToMonday = currentDay === 0 ? 6 : currentDay - 1;
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - diffToMonday);
  startOfWeek.setHours(0, 0, 0, 0);

  // Month boundary
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  startOfMonth.setHours(0, 0, 0, 0);

  let totalPracticeSeconds = 0;
  let todayPracticeSeconds = 0;
  let weekPracticeSeconds = 0;
  let monthPracticeSeconds = 0;
  const categoryTotals: Record<string, number> = {};
  const dailyPracticeHistory: Record<string, number> = {};

  sessions.forEach((s) => {
    totalPracticeSeconds += s.durationSeconds;
    categoryTotals[s.category] = (categoryTotals[s.category] || 0) + s.durationSeconds;
    dailyPracticeHistory[s.date] = (dailyPracticeHistory[s.date] || 0) + s.durationSeconds;

    if (s.date === todayStr) {
      todayPracticeSeconds += s.durationSeconds;
    }

    const sessionDate = new Date(s.startTime);
    if (sessionDate >= startOfWeek) {
      weekPracticeSeconds += s.durationSeconds;
    }
    if (sessionDate >= startOfMonth) {
      monthPracticeSeconds += s.durationSeconds;
    }
  });

  // Habit completion totals
  let totalHabitCompletions = 0;
  let habitsCompletedToday = 0;
  const dailyHabitsHistory: Record<string, number> = {};

  Object.entries(habitLogs).forEach(([dStr, log]) => {
    let count = 0;
    Object.values(log).forEach((done) => {
      if (done) count++;
    });
    dailyHabitsHistory[dStr] = count;
    totalHabitCompletions += count;

    if (dStr === todayStr) {
      habitsCompletedToday = count;
    }
  });

  // Calculate Streak: days with at least 1 habit completed or at least 5 minutes of practice
  const activeDates = new Set<string>();
  Object.keys(dailyHabitsHistory).forEach((d) => {
    if ((dailyHabitsHistory[d] || 0) > 0) activeDates.add(d);
  });
  Object.keys(dailyPracticeHistory).forEach((d) => {
    if ((dailyPracticeHistory[d] || 0) >= 300) activeDates.add(d);
  });

  const sortedDates = Array.from(activeDates).sort();

  let currentStreak = 0;
  let bestStreak = 0;

  if (sortedDates.length > 0) {
    const checkDate = new Date(now);
    const checkedTodayStr = formatDate(checkDate);

    // If no activity today yet, check yesterday to keep streak alive
    if (!activeDates.has(checkedTodayStr)) {
      checkDate.setDate(checkDate.getDate() - 1);
    }

    while (true) {
      const dStr = formatDate(checkDate);
      if (activeDates.has(dStr)) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    // Best streak
    let tempStreak = 1;
    bestStreak = 1;
    for (let i = 1; i < sortedDates.length; i++) {
      const prev = new Date(`${sortedDates[i - 1]}T12:00:00`);
      const curr = new Date(`${sortedDates[i]}T12:00:00`);
      const diffTime = Math.abs(curr.getTime() - prev.getTime());
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        tempStreak++;
        if (tempStreak > bestStreak) bestStreak = tempStreak;
      } else if (diffDays > 1) {
        tempStreak = 1;
      }
    }

    if (currentStreak > bestStreak) {
      bestStreak = currentStreak;
    }
  }

  return {
    totalPracticeSeconds,
    totalSessions: sessions.length,
    todayPracticeSeconds,
    weekPracticeSeconds,
    monthPracticeSeconds,
    habitsCompletedToday,
    totalHabitCompletions,
    currentStreak,
    bestStreak,
    categoryTotals,
    dailyPracticeHistory,
    dailyHabitsHistory,
  };
}

// Reset All User Data
export function resetAllUserData(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.SESSIONS);
    localStorage.removeItem(STORAGE_KEYS.HABIT_LOGS);
    localStorage.removeItem(STORAGE_KEYS.JOURNALS);
  } catch (e) {
    console.error('Failed to reset user data:', e);
  }
}

// Backup & Restore
export function exportAllDataJSON(): string {
  const data = {
    version: 2,
    appName: 'Evolua - Hábitos & Desenvolvimento Pessoal',
    exportedAt: new Date().toISOString(),
    profile: getUserProfile(),
    habits: getHabits(),
    habitLogs: getHabitLogs(),
    sessions: getPracticeSessions(),
    journals: getDailyJournals(),
  };
  return JSON.stringify(data, null, 2);
}

export function importAllDataJSON(jsonString: string): boolean {
  try {
    const data = JSON.parse(jsonString);
    if (data.profile) localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(data.profile));
    if (data.habits) localStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify(data.habits));
    if (data.habitLogs) localStorage.setItem(STORAGE_KEYS.HABIT_LOGS, JSON.stringify(data.habitLogs));
    if (data.sessions) localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(data.sessions));
    if (data.journals) localStorage.setItem(STORAGE_KEYS.JOURNALS, JSON.stringify(data.journals));
    return true;
  } catch (e) {
    console.error('Import failed:', e);
    return false;
  }
}

// Lock state
export function isAppLocked(): boolean {
  const profile = getUserProfile();
  if (!profile.pinEnabled || !profile.pinCode) return false;
  return sessionStorage.getItem(STORAGE_KEYS.LOCKED) !== 'unlocked';
}

export function setAppUnlocked(unlocked: boolean): void {
  if (unlocked) {
    sessionStorage.setItem(STORAGE_KEYS.LOCKED, 'unlocked');
  } else {
    sessionStorage.removeItem(STORAGE_KEYS.LOCKED);
  }
}
