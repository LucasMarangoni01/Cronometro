import React, { useState } from 'react';
import {
  CheckCircle2,
  Circle,
  Plus,
  Flame,
  Timer,
  Trash2,
  Sparkles,
  Award,
  Filter,
  TrendingUp,
  X,
  Target
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Habit, HabitCategory, UserProfile } from '../../types';
import {
  CATEGORY_LABELS,
  HabitLogsMap,
  getTodayDateString,
  toggleHabitCompletion,
  saveHabits
} from '../../utils/storage';
import { soundManager } from '../../utils/audio';

interface HabitsViewProps {
  habits: Habit[];
  habitLogs: HabitLogsMap;
  profile: UserProfile;
  onHabitsUpdated: (updated: Habit[]) => void;
  onHabitLogsUpdated: (updatedLogs: HabitLogsMap) => void;
  onStartTimerForHabit: (habit: Habit) => void;
}

const PRESET_ICONS = ['📖', '✝️', '🕊️', '📚', '🧘', '🏃', '💧', '⚡', '✍️', '🎯', '🥗', '💤', '🌅', '🏋️', '🧠', '🌿'];
const PRESET_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#06b6d4', '#8b5cf6', '#f43f5e', '#3b82f6', '#ec4899'];

export const HabitsView: React.FC<HabitsViewProps> = ({
  habits,
  habitLogs,
  profile,
  onHabitsUpdated,
  onHabitLogsUpdated,
  onStartTimerForHabit,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New habit form states
  const [newHabitName, setNewHabitName] = useState('');
  const [newHabitCategory, setNewHabitCategory] = useState<HabitCategory>('mind');
  const [newHabitIcon, setNewHabitIcon] = useState('🧘');
  const [newHabitColor, setNewHabitColor] = useState(PRESET_COLORS[0]);
  const [newHabitTarget, setNewHabitTarget] = useState<number | undefined>(15);

  const todayStr = getTodayDateString();
  const todayLogs = habitLogs[todayStr] || {};

  // Calculate today's stats
  const totalHabits = habits.length;
  const completedCount = habits.filter((h) => todayLogs[h.id]).length;
  const percentCompleted = totalHabits > 0 ? Math.round((completedCount / totalHabits) * 100) : 0;

  // Toggle habit
  const handleToggle = (habitId: string) => {
    soundManager.playTick(profile.soundVolume);
    const { completed, allLogs } = toggleHabitCompletion(todayStr, habitId);
    onHabitLogsUpdated(allLogs);

    if (completed) {
      // Check if all completed
      const newDoneCount = habits.filter((h) => allLogs[todayStr]?.[h.id]).length;
      if (newDoneCount === totalHabits && totalHabits > 0) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#10b981', '#f59e0b', '#06b6d4', '#ec4899'],
        });
      }
    }
  };

  // Add Habit
  const handleCreateHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabitName.trim()) return;

    const newHabit: Habit = {
      id: `habit-${Date.now()}`,
      name: newHabitName.trim(),
      category: newHabitCategory,
      icon: newHabitIcon,
      color: newHabitColor,
      targetMinutes: newHabitTarget && newHabitTarget > 0 ? newHabitTarget : undefined,
      createdAt: new Date().toISOString(),
    };

    const nextHabits = [...habits, newHabit];
    saveHabits(nextHabits);
    onHabitsUpdated(nextHabits);

    setNewHabitName('');
    setIsAddModalOpen(false);
  };

  // Delete Habit
  const handleDeleteHabit = (id: string) => {
    if (window.confirm('Deseja excluir este hábito da sua rotina?')) {
      const nextHabits = habits.filter((h) => h.id !== id);
      saveHabits(nextHabits);
      onHabitsUpdated(nextHabits);
    }
  };

  // Filtered habits
  const filteredHabits = habits.filter((h) =>
    selectedCategory === 'all' ? true : h.category === selectedCategory
  );

  // Calculate habit specific streak
  const getHabitStreak = (habitId: string) => {
    let streak = 0;
    const checkDate = new Date();
    // If not checked today yet, check yesterday
    if (!todayLogs[habitId]) {
      checkDate.setDate(checkDate.getDate() - 1);
    }

    while (true) {
      const y = checkDate.getFullYear();
      const m = String(checkDate.getMonth() + 1).padStart(2, '0');
      const d = String(checkDate.getDate()).padStart(2, '0');
      const dStr = `${y}-${m}-${d}`;

      if (habitLogs[dStr]?.[habitId]) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
    return streak;
  };

  return (
    <div className="w-full space-y-6">
      {/* Top Banner: Progress Today */}
      <div className="relative overflow-hidden rounded-3xl border border-zinc-800 bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-950 p-6 md:p-8 shadow-2xl">
        <div className="absolute right-0 top-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                Rotina Diária de Evolução
              </span>
              <span className="text-xs text-zinc-400">100% Real • Privado</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-zinc-100 tracking-tight">
              Hábitos de {profile.name}
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-xl">
              "{profile.manifesto || 'Pequenos hábitos diários constroem grandes transformações.'}"
            </p>
          </div>

          {/* Today Score Card */}
          <div className="flex items-center gap-5 bg-zinc-950/80 border border-zinc-800 px-6 py-4 rounded-2xl shrink-0">
            <div className="text-right">
              <div className="text-2xl font-black text-emerald-400">
                {completedCount} / {totalHabits}
              </div>
              <p className="text-[11px] text-zinc-400 font-medium">concluídos hoje ({percentCompleted}%)</p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
              <Award className="h-6 w-6" />
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-6">
          <div className="w-full bg-zinc-800 h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-emerald-500 to-amber-400 h-full rounded-full transition-all duration-700 ease-out"
              style={{ width: `${percentCompleted}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-[11px] text-zinc-400 mt-2">
            <span>
              {percentCompleted === 100
                ? '🏆 Dia perfeito! Todos os hábitos foram cumpridos hoje!'
                : percentCompleted >= 60
                ? '⚡ Ritmo extraordinário! Continue até fechar todos os hábitos.'
                : '🌱 O dia está apenas começando. Marque cada hábito cumprido.'}
            </span>
            <span className="font-semibold text-zinc-300 font-mono">{percentCompleted}%</span>
          </div>
        </div>
      </div>

      {/* Controls & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              selectedCategory === 'all'
                ? 'bg-zinc-100 text-zinc-950'
                : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Todos ({habits.length})
          </button>
          {Object.entries(CATEGORY_LABELS).map(([catKey, catMeta]) => {
            const count = habits.filter((h) => h.category === catKey).length;
            return (
              <button
                key={catKey}
                onClick={() => setSelectedCategory(catKey)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-all ${
                  selectedCategory === catKey
                    ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
                    : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <span>{catMeta.icon}</span>
                <span>{catMeta.label.split(' ')[0]}</span>
                <span className="text-[10px] opacity-75">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Add Habit Button */}
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:brightness-110 text-zinc-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-amber-500/20"
        >
          <Plus className="h-4 w-4" />
          Novo Hábito
        </button>
      </div>

      {/* Habit Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredHabits.map((habit) => {
          const isDone = Boolean(todayLogs[habit.id]);
          const streak = getHabitStreak(habit.id);
          const categoryMeta = CATEGORY_LABELS[habit.category] || CATEGORY_LABELS.mind;

          return (
            <div
              key={habit.id}
              className={`p-5 rounded-3xl border transition-all duration-300 relative group flex flex-col justify-between ${
                isDone
                  ? 'bg-emerald-950/20 border-emerald-500/40 shadow-lg shadow-emerald-500/5'
                  : 'bg-zinc-900/60 border-zinc-800/80 hover:border-zinc-700'
              }`}
            >
              <div>
                {/* Top header of card */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl p-2 rounded-2xl bg-zinc-850 border border-zinc-750">
                      {habit.icon}
                    </span>
                    <div>
                      <h4
                        className={`text-sm font-bold transition-colors ${
                          isDone ? 'text-zinc-100 line-through opacity-85' : 'text-zinc-100'
                        }`}
                      >
                        {habit.name}
                      </h4>
                      <span className="text-[11px] text-zinc-400 flex items-center gap-1 mt-0.5">
                        <span
                          className="h-2 w-2 rounded-full inline-block"
                          style={{ backgroundColor: habit.color }}
                        />
                        {categoryMeta.label}
                      </span>
                    </div>
                  </div>

                  {/* Toggle check button */}
                  <button
                    onClick={() => handleToggle(habit.id)}
                    className="p-1 text-zinc-400 hover:scale-110 transition-transform"
                    title={isDone ? 'Desmarcar hábito' : 'Concluir hábito hoje'}
                  >
                    {isDone ? (
                      <CheckCircle2 className="h-7 w-7 text-emerald-400 fill-emerald-500/20" />
                    ) : (
                      <Circle className="h-7 w-7 text-zinc-600 hover:text-zinc-400" />
                    )}
                  </button>
                </div>
              </div>

              {/* Bottom footer: streak + timer trigger */}
              <div className="pt-4 border-t border-zinc-800/60 flex items-center justify-between text-xs mt-3">
                <div className="flex items-center gap-1.5 text-zinc-400">
                  <Flame
                    className={`h-4 w-4 ${
                      streak > 0 ? 'text-amber-400 fill-amber-400' : 'text-zinc-600'
                    }`}
                  />
                  <span className="font-semibold text-zinc-300 font-mono">{streak}</span>
                  <span className="text-[11px] text-zinc-500">
                    {streak === 1 ? 'dia' : 'dias seguidos'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {/* Cronômetro para o hábito */}
                  {habit.targetMinutes && (
                    <button
                      onClick={() => onStartTimerForHabit(habit)}
                      className="px-2.5 py-1 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-amber-300 font-semibold text-[11px] flex items-center gap-1 transition-colors border border-zinc-700/60"
                      title={`Praticar no cronômetro (${habit.targetMinutes}m)`}
                    >
                      <Timer className="h-3 w-3" />
                      {habit.targetMinutes}m
                    </button>
                  )}

                  <button
                    onClick={() => handleDeleteHabit(habit.id)}
                    className="p-1 text-zinc-600 hover:text-rose-400 transition-colors opacity-0 group-hover:opacity-100"
                    title="Excluir hábito"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Add New Habit */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 backdrop-blur-md p-4">
          <div className="w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg text-zinc-100">Criar Novo Hábito</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-xl text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateHabit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Nome do Hábito:
                </label>
                <input
                  type="text"
                  placeholder="Ex: Ler 10 páginas, Acordar sem tela, Alongamento..."
                  value={newHabitName}
                  onChange={(e) => setNewHabitName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                  required
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Pilar / Categoria:
                </label>
                <select
                  value={newHabitCategory}
                  onChange={(e) => setNewHabitCategory(e.target.value as HabitCategory)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-zinc-950 border border-zinc-800 text-xs font-semibold text-zinc-200 focus:outline-none cursor-pointer"
                >
                  {Object.entries(CATEGORY_LABELS).map(([key, val]) => (
                    <option key={key} value={key} className="bg-zinc-900">
                      {val.icon} {val.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Icon selector */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Ícone Representativo:
                </label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_ICONS.map((ic) => (
                    <button
                      key={ic}
                      type="button"
                      onClick={() => setNewHabitIcon(ic)}
                      className={`h-9 w-9 rounded-xl text-lg flex items-center justify-center transition-all ${
                        newHabitIcon === ic
                          ? 'bg-amber-500/20 border border-amber-400 scale-110'
                          : 'bg-zinc-950 border border-zinc-800 hover:bg-zinc-800'
                      }`}
                    >
                      {ic}
                    </button>
                  ))}
                </div>
              </div>

              {/* Target duration in minutes (optional for cronometro) */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Meta de Tempo para o Cronômetro (minutos, opcional):
                </label>
                <input
                  type="number"
                  min="0"
                  max="180"
                  placeholder="0 para hábito sem tempo (ex: beber água)"
                  value={newHabitTarget || ''}
                  onChange={(e) => setNewHabitTarget(parseInt(e.target.value) || undefined)}
                  className="w-full px-4 py-2 rounded-2xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 font-mono"
                />
              </div>

              {/* Color */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Cor de Destaque:
                </label>
                <div className="flex items-center gap-2">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNewHabitColor(c)}
                      className={`h-6 w-6 rounded-full transition-transform ${
                        newHabitColor === c
                          ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-zinc-900'
                          : 'opacity-80 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-zinc-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs transition-colors"
                >
                  Salvar Hábito
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
