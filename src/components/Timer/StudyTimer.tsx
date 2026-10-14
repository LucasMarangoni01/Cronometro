import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  Maximize2,
  Minimize2,
  Volume2,
  Radio,
  Star,
  Sparkles,
  Coffee,
  Brain,
  ChevronDown
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Habit, PracticeSession, TimerMode, PomodoroPhase, UserProfile } from '../../types';
import {
  formatTimeDigital,
  formatSecondsToHuman,
  getTodayDateString,
  savePracticeSession,
  toggleHabitCompletion,
  getHabitLogs,
  saveDailyJournal,
  getDailyJournal,
  HabitLogsMap
} from '../../utils/storage';
import { soundManager } from '../../utils/audio';

interface StudyTimerProps {
  habits: Habit[];
  profile: UserProfile;
  initialSelectedHabit?: Habit | null;
  onSessionSaved: (session: PracticeSession) => void;
  onHabitLogsUpdated?: (logs: HabitLogsMap) => void;
  onOpenProfile: () => void;
  onTimerRunningChange?: (isRunning: boolean, habitName: string, formattedTime: string) => void;
}

export const StudyTimer: React.FC<StudyTimerProps> = ({
  habits,
  profile,
  initialSelectedHabit,
  onSessionSaved,
  onHabitLogsUpdated,
  onOpenProfile,
  onTimerRunningChange,
}) => {
  // Timer Mode & Phase
  const [mode, setMode] = useState<TimerMode>('pomodoro');
  const [pomodoroPhase, setPomodoroPhase] = useState<PomodoroPhase>('work');
  const [completedPomodoros, setCompletedPomodoros] = useState(0);
  const [customCountdownMinutes, setCustomCountdownMinutes] = useState(
    initialSelectedHabit?.targetMinutes || 15
  );

  // Selected Habit
  const [selectedHabitId, setSelectedHabitId] = useState<string>(
    initialSelectedHabit?.id || habits[0]?.id || ''
  );
  const [zenMode, setZenMode] = useState(false);

  // Timestamp-based running state (Immune to tab switches & throttling)
  const [isRunning, setIsRunning] = useState(false);
  const [segmentStartTime, setSegmentStartTime] = useState<number | null>(null);
  const [accumulatedSeconds, setAccumulatedSeconds] = useState(0);

  // Computed display seconds
  const [displaySeconds, setDisplaySeconds] = useState<number>(profile.pomodoroWorkMinutes * 60);

  // Ambient sound
  const [ambientType, setAmbientType] = useState<'none' | 'rain' | 'whitenoise' | 'binaural'>('none');
  const [ambientVol, setAmbientVol] = useState(0.3);

  // Save Modal state
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [sessionDurationToSave, setSessionDurationToSave] = useState(0);
  const [sessionNotes, setSessionNotes] = useState('');
  const [biblePassage, setBiblePassage] = useState('');
  const [sessionRating, setSessionRating] = useState(5);
  const [sessionStartTime, setSessionStartTime] = useState<number>(Date.now());

  const currentHabit = habits.find((h) => h.id === selectedHabitId) || habits[0] || {
    id: 'default',
    name: 'Foco Geral',
    category: 'productivity',
    color: '#f59e0b',
    icon: '⚡',
    createdAt: '',
  };

  // Target total seconds for countdown / pomodoro
  const getTargetSeconds = useCallback(() => {
    if (mode === 'stopwatch') return 0;
    if (mode === 'countdown') return customCountdownMinutes * 60;
    if (pomodoroPhase === 'work') return profile.pomodoroWorkMinutes * 60;
    if (pomodoroPhase === 'shortBreak') return profile.pomodoroShortBreakMinutes * 60;
    return profile.pomodoroLongBreakMinutes * 60;
  }, [mode, customCountdownMinutes, pomodoroPhase, profile]);

  // Sync if initialSelectedHabit changes externally
  useEffect(() => {
    if (initialSelectedHabit) {
      setSelectedHabitId(initialSelectedHabit.id);
      if (initialSelectedHabit.targetMinutes && !isRunning) {
        setCustomCountdownMinutes(initialSelectedHabit.targetMinutes);
        setMode('countdown');
        setAccumulatedSeconds(0);
        setSegmentStartTime(null);
        setDisplaySeconds(initialSelectedHabit.targetMinutes * 60);
      }
    }
  }, [initialSelectedHabit]);

  // Handle finish event
  const handleTimerFinish = useCallback(() => {
    setIsRunning(false);
    setSegmentStartTime(null);
    setAccumulatedSeconds(0);

    if (profile.soundEnabled) {
      soundManager.playBell(profile.soundVolume);
    }

    if (mode === 'pomodoro') {
      if (pomodoroPhase === 'work') {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#6366f1', '#10b981', '#f59e0b', '#ec4899'],
        });

        const nextCount = completedPomodoros + 1;
        setCompletedPomodoros(nextCount);
        const durationSecs = profile.pomodoroWorkMinutes * 60;

        setSessionDurationToSave(durationSecs);
        setShowSaveModal(true);

        const isLongBreak = nextCount % profile.pomodorosUntilLongBreak === 0;
        const nextPhase: PomodoroPhase = isLongBreak ? 'longBreak' : 'shortBreak';
        setPomodoroPhase(nextPhase);

        const nextBreakSeconds = (isLongBreak ? profile.pomodoroLongBreakMinutes : profile.pomodoroShortBreakMinutes) * 60;
        setDisplaySeconds(nextBreakSeconds);

        if (profile.autoStartBreaks) {
          setIsRunning(true);
          setSegmentStartTime(Date.now());
        }
      } else {
        setPomodoroPhase('work');
        setDisplaySeconds(profile.pomodoroWorkMinutes * 60);
        if (profile.autoStartPomodoro) {
          setIsRunning(true);
          setSegmentStartTime(Date.now());
        }
      }
    } else if (mode === 'countdown') {
      confetti({
        particleCount: 90,
        spread: 70,
        origin: { y: 0.6 },
      });
      const durationSecs = customCountdownMinutes * 60;
      setSessionDurationToSave(durationSecs);
      setShowSaveModal(true);
      setDisplaySeconds(customCountdownMinutes * 60);
    }
  }, [mode, pomodoroPhase, completedPomodoros, profile, customCountdownMinutes]);

  // Accurate Clock Tick using Timestamp Delta
  useEffect(() => {
    const updateTime = () => {
      if (!isRunning) return;

      const now = Date.now();
      const currentSegment = segmentStartTime ? Math.max(0, Math.floor((now - segmentStartTime) / 1000)) : 0;
      const totalElapsed = accumulatedSeconds + currentSegment;

      if (mode === 'stopwatch') {
        setDisplaySeconds(totalElapsed);
      } else {
        const target = getTargetSeconds();
        const remaining = Math.max(0, target - totalElapsed);
        setDisplaySeconds(remaining);

        if (remaining <= 0) {
          handleTimerFinish();
        }
      }
    };

    // Run tick frequently so display is smooth
    const interval = setInterval(updateTime, 250);

    // Also update on visibility change (when switching back to browser tab)
    const handleVisibilityChange = () => {
      updateTime();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
    };
  }, [isRunning, segmentStartTime, accumulatedSeconds, mode, getTargetSeconds, handleTimerFinish]);

  // Update Document title & Navbar running indicator
  useEffect(() => {
    const digital = formatTimeDigital(displaySeconds);
    const timeStr = `${digital.hours ? `${digital.hours}:` : ''}${digital.mins}:${digital.secs}`;

    if (isRunning) {
      document.title = `(${timeStr}) ${currentHabit.icon} ${currentHabit.name} | Evolua`;
      if (onTimerRunningChange) {
        onTimerRunningChange(true, `${currentHabit.icon} ${currentHabit.name}`, timeStr);
      }
    } else {
      document.title = 'Evolua - Hábitos & Desenvolvimento Pessoal';
      if (onTimerRunningChange) {
        onTimerRunningChange(false, '', '');
      }
    }

    return () => {
      document.title = 'Evolua - Hábitos & Desenvolvimento Pessoal';
    };
  }, [isRunning, displaySeconds, currentHabit, onTimerRunningChange]);

  // Mode change handler
  const handleSwitchMode = (newMode: TimerMode) => {
    if (isRunning) {
      if (!window.confirm('O cronômetro está em andamento. Deseja pausar e mudar de modo?')) {
        return;
      }
    }
    soundManager.playTick(profile.soundVolume);
    setIsRunning(false);
    setSegmentStartTime(null);
    setAccumulatedSeconds(0);
    setMode(newMode);

    if (newMode === 'stopwatch') {
      setDisplaySeconds(0);
    } else if (newMode === 'pomodoro') {
      setPomodoroPhase('work');
      setDisplaySeconds(profile.pomodoroWorkMinutes * 60);
    } else if (newMode === 'countdown') {
      setDisplaySeconds(customCountdownMinutes * 60);
    }
  };

  // Toggle Play / Pause
  const handleTogglePlay = () => {
    soundManager.playTick(profile.soundVolume);

    if (!isRunning) {
      // STARTING
      setIsRunning(true);
      setSegmentStartTime(Date.now());
      if (accumulatedSeconds === 0) {
        setSessionStartTime(Date.now());
      }
      if (ambientType !== 'none') {
        soundManager.startAmbient(ambientType, ambientVol);
      }
    } else {
      // PAUSING
      const currentSegment = segmentStartTime ? Math.max(0, Math.floor((Date.now() - segmentStartTime) / 1000)) : 0;
      setAccumulatedSeconds((prev) => prev + currentSegment);
      setSegmentStartTime(null);
      setIsRunning(false);

      if (ambientType !== 'none') {
        soundManager.stopAmbient();
      }
    }
  };

  // Reset
  const handleReset = () => {
    soundManager.playTick(profile.soundVolume);
    setIsRunning(false);
    setSegmentStartTime(null);
    setAccumulatedSeconds(0);

    if (ambientType !== 'none') {
      soundManager.stopAmbient();
    }

    if (mode === 'stopwatch') {
      setDisplaySeconds(0);
    } else if (mode === 'pomodoro') {
      setPomodoroPhase('work');
      setDisplaySeconds(profile.pomodoroWorkMinutes * 60);
    } else {
      setDisplaySeconds(customCountdownMinutes * 60);
    }
  };

  // Manual Save Session
  const handleManualSave = () => {
    const currentSegment = isRunning && segmentStartTime ? Math.max(0, Math.floor((Date.now() - segmentStartTime) / 1000)) : 0;
    let duration = 0;

    if (mode === 'stopwatch') {
      duration = accumulatedSeconds + currentSegment;
    } else {
      const target = getTargetSeconds();
      duration = Math.min(target, accumulatedSeconds + currentSegment);
    }

    if (duration < 60) {
      alert('Para registrar como prática de hábito válida, cronometre pelo menos 1 minuto.');
      return;
    }

    // Pause timer
    setIsRunning(false);
    setSegmentStartTime(null);
    setAccumulatedSeconds(0);

    if (ambientType !== 'none') {
      soundManager.stopAmbient();
    }

    setSessionDurationToSave(duration);
    setShowSaveModal(true);
  };

  // Confirm Save Session Modal
  const confirmSaveSession = () => {
    const todayStr = getTodayDateString();
    const newSession: PracticeSession = {
      id: `sess-${Date.now()}`,
      habitId: currentHabit.id,
      habitName: currentHabit.name,
      category: currentHabit.category,
      color: currentHabit.color,
      startTime: sessionStartTime || Date.now() - sessionDurationToSave * 1000,
      endTime: Date.now(),
      durationSeconds: sessionDurationToSave,
      mode,
      notes: biblePassage.trim()
        ? `[Passagem: ${biblePassage.trim()}] ${sessionNotes.trim()}`
        : sessionNotes.trim(),
      rating: sessionRating,
      date: todayStr,
    };

    savePracticeSession(newSession);
    onSessionSaved(newSession);

    // Auto mark habit as completed in today's tracker
    if (currentHabit.id && onHabitLogsUpdated) {
      const logs = getHabitLogs();
      if (!logs[todayStr]?.[currentHabit.id]) {
        const { allLogs } = toggleHabitCompletion(todayStr, currentHabit.id);
        onHabitLogsUpdated(allLogs);
      }
    }

    // Append to daily journal reflections & verse if available
    const journal = getDailyJournal(todayStr);
    if (biblePassage.trim() && !journal.verseOfDay) {
      journal.verseOfDay = biblePassage.trim();
    }
    if (sessionNotes.trim() || biblePassage.trim()) {
      const noteLine = `• [${currentHabit.icon} ${currentHabit.name} - ${formatSecondsToHuman(sessionDurationToSave)}] ${
        biblePassage.trim() ? `(Passagem: ${biblePassage.trim()}) ` : ''
      }${sessionNotes.trim()}`;
      journal.reflections = journal.reflections
        ? `${journal.reflections}\n${noteLine}`
        : `### Práticas e Sessões do Dia:\n${noteLine}`;
    }
    saveDailyJournal(journal);

    setShowSaveModal(false);
    setSessionNotes('');
    setBiblePassage('');
    setSessionRating(5);
    handleReset();

    confetti({
      particleCount: 60,
      spread: 50,
      origin: { y: 0.7 },
      colors: [currentHabit.color, '#6366f1', '#10b981', '#f59e0b', '#ffffff'],
    });
  };

  const handleAmbientChange = (type: 'none' | 'rain' | 'whitenoise' | 'binaural') => {
    setAmbientType(type);
    if (type === 'none') {
      soundManager.stopAmbient();
    } else if (isRunning) {
      soundManager.startAmbient(type, ambientVol);
    }
  };

  const handleVolumeChange = (vol: number) => {
    setAmbientVol(vol);
    soundManager.setAmbientVolume(vol);
  };

  const digital = formatTimeDigital(displaySeconds);
  const totalPhaseSeconds = getTargetSeconds();

  const progressPercent =
    mode === 'stopwatch'
      ? Math.min(100, (displaySeconds / 3600) * 100)
      : totalPhaseSeconds > 0
      ? Math.max(0, Math.min(100, ((totalPhaseSeconds - displaySeconds) / totalPhaseSeconds) * 100))
      : 0;

  return (
    <div className={`relative transition-all duration-300 ${zenMode ? 'fixed inset-0 z-50 bg-zinc-950 flex flex-col justify-center items-center p-6' : 'w-full'}`}>
      {/* Top Header Toggle */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          {/* Mode Switchers */}
          <div className="inline-flex rounded-xl bg-zinc-900/90 p-1 border border-zinc-800">
            <button
              onClick={() => handleSwitchMode('pomodoro')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                mode === 'pomodoro'
                  ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Pomodoro
            </button>
            <button
              onClick={() => handleSwitchMode('stopwatch')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                mode === 'stopwatch'
                  ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Cronômetro Livre
            </button>
            <button
              onClick={() => handleSwitchMode('countdown')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                mode === 'countdown'
                  ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Regressivo
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setZenMode(!zenMode)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 transition-colors"
            title={zenMode ? 'Sair do Modo Zen' : 'Modo Foco Zen'}
          >
            {zenMode ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline">{zenMode ? 'Sair do Zen' : 'Modo Zen'}</span>
          </button>
        </div>
      </div>

      {/* Main Timer Display Card */}
      <div className={`relative overflow-hidden rounded-3xl border border-zinc-800/80 bg-gradient-to-b from-zinc-900/90 to-zinc-950 p-6 sm:p-10 shadow-2xl transition-all ${zenMode ? 'max-w-2xl w-full border-amber-500/20 shadow-amber-500/5' : ''}`}>
        {/* Ambient Glow */}
        <div
          className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-48 rounded-full blur-3xl opacity-20 pointer-events-none transition-all duration-700"
          style={{ backgroundColor: currentHabit.color }}
        />

        {/* Habit Selector Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6 relative z-10">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider text-zinc-500 font-semibold">
              Hábito / Prática:
            </span>
            <div className="relative inline-block">
              <select
                value={selectedHabitId}
                onChange={(e) => {
                  const newHabit = habits.find((h) => h.id === e.target.value);
                  setSelectedHabitId(e.target.value);
                  if (newHabit?.targetMinutes && !isRunning) {
                    setCustomCountdownMinutes(newHabit.targetMinutes);
                    if (mode === 'countdown') {
                      setDisplaySeconds(newHabit.targetMinutes * 60);
                    }
                  }
                }}
                className="appearance-none cursor-pointer pl-3 pr-8 py-1.5 rounded-xl bg-zinc-800/90 text-sm font-medium text-zinc-100 border border-zinc-700 hover:border-zinc-600 focus:outline-none focus:ring-2 focus:ring-amber-500/40 transition-all"
              >
                {habits.map((h) => (
                  <option key={h.id} value={h.id} className="bg-zinc-900 text-zinc-100">
                    {h.icon} {h.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400 pointer-events-none" />
            </div>
            <div
              className="h-3 w-3 rounded-full shadow-sm"
              style={{ backgroundColor: currentHabit.color }}
            />
          </div>

          {/* Pomodoro Cycles or Countdown Presets */}
          {mode === 'pomodoro' && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-400 font-medium">Ciclo:</span>
              <div className="flex items-center gap-1.5">
                {Array.from({ length: profile.pomodorosUntilLongBreak }).map((_, idx) => (
                  <div
                    key={idx}
                    className={`h-2.5 w-2.5 rounded-full transition-all ${
                      idx < (completedPomodoros % profile.pomodorosUntilLongBreak)
                        ? 'bg-amber-400 scale-110 shadow-sm shadow-amber-400/50'
                        : 'bg-zinc-800 border border-zinc-700'
                    }`}
                  />
                ))}
              </div>
              <span className="text-[11px] text-zinc-500 ml-1">
                ({completedPomodoros} concluídos)
              </span>
            </div>
          )}

          {mode === 'countdown' && (
            <div className="flex items-center gap-1.5">
              {[10, 15, 20, 30, 45, 60].map((mins) => (
                <button
                  key={mins}
                  onClick={() => {
                    if (!isRunning) {
                      setCustomCountdownMinutes(mins);
                      setDisplaySeconds(mins * 60);
                      setAccumulatedSeconds(0);
                    }
                  }}
                  className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors ${
                    customCountdownMinutes === mins
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'text-zinc-500 hover:text-zinc-300 bg-zinc-800/40'
                  }`}
                >
                  {mins}m
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Phase Pill if Pomodoro */}
        {mode === 'pomodoro' && (
          <div className="text-center mb-4">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                pomodoroPhase === 'work'
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  : pomodoroPhase === 'shortBreak'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
              }`}
            >
              {pomodoroPhase === 'work' ? (
                <>
                  <Brain className="h-3.5 w-3.5 animate-pulse" />
                  Prática Consciente & Foco
                </>
              ) : pomodoroPhase === 'shortBreak' ? (
                <>
                  <Coffee className="h-3.5 w-3.5" />
                  Pausa Curta (5m)
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  Descanso Longo Merecido (15m)
                </>
              )}
            </span>
          </div>
        )}

        {/* Big Digital Display with Circular Track */}
        <div className="relative my-6 flex flex-col items-center justify-center">
          <div className="relative flex items-center justify-center">
            <svg className="w-64 h-64 sm:w-80 sm:h-80 -rotate-90 transform">
              <circle
                cx="50%"
                cy="50%"
                r="44%"
                className="stroke-zinc-800/80"
                strokeWidth="6"
                fill="transparent"
              />
              <circle
                cx="50%"
                cy="50%"
                r="44%"
                className="transition-all duration-700 ease-out"
                strokeWidth="8"
                strokeDasharray="276"
                strokeDashoffset={276 - (276 * progressPercent) / 100}
                strokeLinecap="round"
                fill="transparent"
                style={{
                  stroke: isRunning ? currentHabit.color : '#71717a',
                  filter: isRunning ? `drop-shadow(0 0 8px ${currentHabit.color}40)` : 'none',
                }}
              />
            </svg>

            {/* Digits */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <div className="font-['JetBrains_Mono',monospace] font-bold tracking-tight text-zinc-100 flex items-baseline">
                {digital.hours && (
                  <>
                    <span className="text-4xl sm:text-6xl">{digital.hours}</span>
                    <span className="text-2xl sm:text-4xl text-zinc-500 mx-1">:</span>
                  </>
                )}
                <span className="text-5xl sm:text-7xl">{digital.mins}</span>
                <span className="text-2xl sm:text-4xl text-zinc-500 mx-1 animate-pulse">:</span>
                <span className="text-5xl sm:text-7xl">{digital.secs}</span>
              </div>

              <div className="mt-2 flex items-center gap-2">
                <span className="text-xs font-medium text-zinc-400">
                  {isRunning ? 'Praticando...' : 'Pausado'}
                </span>
                {isRunning && (
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Primary Controls */}
        <div className="flex flex-wrap items-center justify-center gap-4 mt-4 relative z-10">
          <button
            onClick={handleReset}
            className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700 border border-zinc-700/60 transition-all active:scale-95"
            title="Reiniciar cronômetro"
          >
            <RotateCcw className="h-5 w-5" />
          </button>

          <button
            onClick={handleTogglePlay}
            className={`flex h-16 px-8 items-center justify-center gap-3 rounded-2xl font-bold text-lg transition-all active:scale-95 shadow-xl ${
              isRunning
                ? 'bg-zinc-800 text-amber-400 border border-amber-500/30 hover:bg-zinc-700'
                : 'bg-gradient-to-r from-amber-500 to-amber-600 text-zinc-950 hover:brightness-110 shadow-amber-500/25'
            }`}
          >
            {isRunning ? (
              <>
                <Pause className="h-6 w-6 fill-amber-400" />
                Pausar
              </>
            ) : (
              <>
                <Play className="h-6 w-6 fill-zinc-950" />
                Iniciar Prática
              </>
            )}
          </button>

          <button
            onClick={handleManualSave}
            className="flex items-center gap-2 h-12 px-5 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-sm font-semibold transition-all active:scale-95"
            title="Concluir e Salvar Sessão no Perfil"
          >
            <CheckCircle2 className="h-4 w-4" />
            Salvar Prática
          </button>
        </div>

        {/* Ambient Sound Bar */}
        <div className="mt-8 pt-6 border-t border-zinc-800/60 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2">
            <Radio className="h-3.5 w-3.5 text-zinc-400" />
            <span className="text-zinc-400 font-medium">Som ambiente para foco:</span>
            <div className="flex items-center gap-1">
              {[
                { id: 'none', label: 'Silêncio' },
                { id: 'rain', label: 'Chuva Suave' },
                { id: 'whitenoise', label: 'Ruído Branco' },
                { id: 'binaural', label: 'Onda Gama 40Hz' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleAmbientChange(item.id as 'none' | 'rain' | 'whitenoise' | 'binaural')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                    ambientType === item.id
                      ? 'bg-zinc-700 text-amber-300 font-semibold'
                      : 'text-zinc-500 hover:text-zinc-300 bg-zinc-800/40'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {ambientType !== 'none' && (
            <div className="flex items-center gap-2">
              <Volume2 className="h-3.5 w-3.5 text-zinc-400" />
              <input
                type="range"
                min="0.05"
                max="1"
                step="0.05"
                value={ambientVol}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                className="w-20 h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            </div>
          )}
        </div>
      </div>

      {/* Save Session Dialog */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div
                className="h-10 w-10 rounded-2xl flex items-center justify-center text-xl shadow-inner"
                style={{ backgroundColor: `${currentHabit.color}25` }}
              >
                {currentHabit.icon}
              </div>
              <div>
                <h3 className="font-bold text-lg text-zinc-100">Registrar Prática de Hábito</h3>
                <p className="text-xs text-zinc-400">
                  {currentHabit.name} • {formatSecondsToHuman(sessionDurationToSave)} de dedicação
                </p>
              </div>
            </div>

            {/* Focus Rating */}
            <div className="mb-4 rounded-2xl bg-zinc-800/50 p-3 border border-zinc-800">
              <label className="block text-xs font-medium text-zinc-400 mb-2">
                Como foi sua presença e foco durante a prática?
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setSessionRating(star)}
                    className="p-1 hover:scale-110 transition-transform"
                  >
                    <Star
                      className={`h-6 w-6 ${
                        star <= sessionRating
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-zinc-600'
                      }`}
                    />
                  </button>
                ))}
                <span className="ml-2 text-xs font-semibold text-zinc-300">
                  {sessionRating === 5
                    ? 'Presença Total 🧘'
                    : sessionRating === 4
                    ? 'Muito Bom ⚡'
                    : sessionRating === 3
                    ? 'Moderado ⏳'
                    : 'Disperso 💭'}
                </span>
              </div>
            </div>

            {/* Bible passage input if reading the Bible */}
            {(currentHabit.category === 'faith' ||
              currentHabit.name.toLowerCase().includes('bíblia') ||
              currentHabit.name.toLowerCase().includes('biblia')) && (
              <div className="mb-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 p-3">
                <label className="block text-xs font-semibold text-indigo-300 mb-1 flex items-center gap-1.5">
                  <span>📖</span> Passagem / Livro / Versículo Lido:
                </label>
                <input
                  type="text"
                  value={biblePassage}
                  onChange={(e) => setBiblePassage(e.target.value)}
                  placeholder="Ex: Salmos 23, Mateus 5:14-16, Provérbios 3:5..."
                  className="w-full px-3 py-1.5 rounded-xl bg-zinc-950/80 border border-zinc-700/60 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                />
              </div>
            )}

            {/* Quick Session Notes */}
            <div className="mb-5">
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                Reflexão ou anotação rápida (vai para o diário de hoje):
              </label>
              <textarea
                value={sessionNotes}
                onChange={(e) => setSessionNotes(e.target.value)}
                placeholder={
                  currentHabit.category === 'faith' || currentHabit.name.toLowerCase().includes('bíblia')
                    ? 'Ex: Meditação sobre a fidelidade de Deus e ensinamentos para aplicar no meu dia...'
                    : 'Ex: Reflexões sobre o que foi praticado e aprendizados da sessão...'
                }
                className="w-full h-24 rounded-2xl bg-zinc-800/80 border border-zinc-700/60 p-3 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40 resize-none"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowSaveModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                Descartar
              </button>
              <button
                onClick={confirmSaveSession}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-zinc-950 font-bold text-xs hover:brightness-110 transition-all shadow-lg shadow-amber-500/20"
              >
                Salvar no Perfil & Diário
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
