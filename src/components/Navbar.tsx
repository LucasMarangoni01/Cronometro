import React from 'react';
import {
  Timer,
  BookOpen,
  BarChart2,
  Lock,
  Flame,
  CheckCircle2,
  Settings,
  Sparkles
} from 'lucide-react';
import { UserProfile, PersonalStats } from '../types';

export type NavTab = 'habits' | 'timer' | 'journal' | 'stats';

interface NavbarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  profile: UserProfile;
  stats: PersonalStats;
  totalHabitsCount: number;
  runningTimerInfo?: { isRunning: boolean; habitName: string; time: string } | null;
  onOpenProfile: () => void;
  onLockApp: () => void;
}

const AVATAR_ICONS: Record<string, string> = {
  target: '🎯',
  brain: '🧠',
  fire: '🔥',
  zen: '🧘',
  rocket: '🚀',
  book: '📚',
  trophy: '🏆',
  sun: '☀️',
};

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  profile,
  stats,
  totalHabitsCount,
  runningTimerInfo,
  onOpenProfile,
  onLockApp,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-xl transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between gap-3">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onSelectTab('habits')}
            className="flex items-center gap-2.5 text-left group"
          >
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-amber-400 p-0.5 shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <div className="h-full w-full rounded-[14px] bg-zinc-950 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-emerald-400" />
              </div>
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight text-zinc-100 flex items-center gap-1.5">
                Evolua
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Hábitos
                </span>
              </span>
              <p className="text-[11px] text-zinc-400 hidden sm:block">
                Desenvolvimento Pessoal & Foco
              </p>
            </div>
          </button>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 sm:gap-1.5 bg-zinc-900/90 p-1.5 rounded-2xl border border-zinc-800">
          <button
            onClick={() => onSelectTab('habits')}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              currentTab === 'habits'
                ? 'bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/20'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>Hábitos</span>
          </button>

          <button
            onClick={() => onSelectTab('timer')}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              currentTab === 'timer'
                ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
          >
            <Timer className="h-4 w-4" />
            <span>Cronômetro</span>
          </button>

          <button
            onClick={() => onSelectTab('journal')}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              currentTab === 'journal'
                ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
          >
            <BookOpen className="h-4 w-4" />
            <span>Diário</span>
          </button>

          <button
            onClick={() => onSelectTab('stats')}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              currentTab === 'stats'
                ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
          >
            <BarChart2 className="h-4 w-4" />
            <span>Estatísticas</span>
          </button>
        </nav>

        {/* Right side widgets */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Live Running Timer Pill (when on another tab) */}
          {runningTimerInfo?.isRunning && currentTab !== 'timer' && (
            <button
              onClick={() => onSelectTab('timer')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 text-xs font-bold transition-all animate-pulse"
              title="Cronômetro em andamento - Clique para abrir o cronômetro"
            >
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="font-mono">{runningTimerInfo.time}</span>
              <span className="hidden sm:inline text-zinc-300">({runningTimerInfo.habitName})</span>
            </button>
          )}

          {/* Streak pill */}
          <div
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-semibold text-zinc-200"
            title="Sequência de dias seguidos de evolução"
          >
            <Flame className="h-4 w-4 text-amber-400 fill-amber-400" />
            <span>{stats.currentStreak} dias</span>
          </div>

          {/* Today Habit Score */}
          <div
            className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-300"
            title="Hábitos concluídos hoje"
          >
            <span>Hoje:</span>
            <strong className="text-emerald-400 font-mono">
              {stats.habitsCompletedToday}/{totalHabitsCount}
            </strong>
          </div>

          {/* Quick Lock */}
          {profile.pinEnabled && (
            <button
              onClick={onLockApp}
              className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-amber-400 border border-zinc-800 transition-colors"
              title="Bloquear aplicativo com PIN"
            >
              <Lock className="h-4 w-4" />
            </button>
          )}

          {/* User Profile trigger */}
          <button
            onClick={onOpenProfile}
            className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-2xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 transition-all text-xs font-semibold text-zinc-200 shadow-sm"
          >
            <span className="text-base">{AVATAR_ICONS[profile.avatar] || '🎯'}</span>
            <span className="max-w-[70px] sm:max-w-[100px] truncate">{profile.name}</span>
            <Settings className="h-3.5 w-3.5 text-zinc-500 ml-0.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
