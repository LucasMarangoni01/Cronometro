export type TimerMode = 'stopwatch' | 'pomodoro' | 'countdown';
export type PomodoroPhase = 'work' | 'shortBreak' | 'longBreak';

export type HabitCategory = 'mind' | 'body' | 'knowledge' | 'productivity' | 'wellness' | 'faith';

export interface Habit {
  id: string;
  name: string;
  category: HabitCategory;
  color: string;
  icon: string;
  targetMinutes?: number; // optional target for habits with timer
  createdAt: string;
}

export interface HabitLog {
  date: string; // YYYY-MM-DD
  habitId: string;
  completed: boolean;
  loggedAt: number;
}

export interface PracticeSession {
  id: string;
  habitId?: string;
  habitName: string;
  category: HabitCategory | string;
  color: string;
  startTime: number;
  endTime: number;
  durationSeconds: number;
  mode: TimerMode;
  notes?: string;
  rating?: number; // 1-5
  date: string; // YYYY-MM-DD
}

export interface DailyTodo {
  id: string;
  text: string;
  completed: boolean;
  priority?: 'low' | 'medium' | 'high';
}

export interface DailyJournal {
  date: string; // YYYY-MM-DD
  title: string;
  gratitude: string[]; // 3 gratitudes
  winOfDay: string; // Biggest win of the day
  verseOfDay?: string; // Bible verse / Devotional passage
  reflections: string; // General thoughts and notes
  todos: DailyTodo[];
  mood?: 'great' | 'good' | 'neutral' | 'tired' | 'stressed';
  energyLevel?: number; // 1-5
  updatedAt: number;
}

export interface UserProfile {
  name: string;
  manifesto: string; // Personal development vision
  avatar: string;
  dailyHabitsGoal: number; // e.g. 5 habits per day
  dailyFocusMinutesGoal: number; // e.g. 60 or 120 minutes of focus/habits
  pinCode?: string;
  pinEnabled: boolean;
  soundEnabled: boolean;
  soundVolume: number;
  ambientSound: 'none' | 'rain' | 'whitenoise' | 'binaural';
  ambientVolume: number;
  pomodoroWorkMinutes: number;
  pomodoroShortBreakMinutes: number;
  pomodoroLongBreakMinutes: number;
  pomodorosUntilLongBreak: number;
  autoStartBreaks: boolean;
  autoStartPomodoro: boolean;
  createdAt: string;
}

export interface PersonalStats {
  totalPracticeSeconds: number;
  totalSessions: number;
  todayPracticeSeconds: number;
  weekPracticeSeconds: number;
  monthPracticeSeconds: number;
  habitsCompletedToday: number;
  totalHabitCompletions: number;
  currentStreak: number;
  bestStreak: number;
  categoryTotals: Record<string, number>; // category -> seconds
  dailyPracticeHistory: Record<string, number>; // date -> seconds
  dailyHabitsHistory: Record<string, number>; // date -> habits count
}
