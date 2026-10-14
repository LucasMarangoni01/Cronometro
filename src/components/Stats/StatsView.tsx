import React, { useState } from 'react';
import {
  Flame,
  Clock,
  TrendingUp,
  Award,
  Calendar,
  PieChart,
  BarChart3,
  CheckCircle2,
  Trash2,
  Filter,
  Layers,
  ArrowUpRight,
  Sparkles,
  Target
} from 'lucide-react';
import { Habit, PracticeSession, UserProfile } from '../../types';
import {
  calculatePersonalStats,
  CATEGORY_LABELS,
  formatDate,
  formatSecondsToHuman,
  getTodayDateString,
  deletePracticeSession,
  HabitLogsMap
} from '../../utils/storage';

interface StatsViewProps {
  sessions: PracticeSession[];
  habits: Habit[];
  habitLogs: HabitLogsMap;
  profile: UserProfile;
  onSessionsChange: (updatedSessions: PracticeSession[]) => void;
  onOpenHabits: () => void;
  onOpenTimer: () => void;
}

export const StatsView: React.FC<StatsViewProps> = ({
  sessions,
  habits,
  habitLogs,
  profile,
  onSessionsChange,
  onOpenHabits,
  onOpenTimer,
}) => {
  const [timeRange, setTimeRange] = useState<'7days' | '30days'>('7days');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');

  const stats = calculatePersonalStats(sessions, habitLogs, profile.dailyHabitsGoal);
  const todayStr = getTodayDateString();

  // Habit goal calculation
  const totalHabits = habits.length;
  const habitsPercentToday = totalHabits > 0 ? Math.round((stats.habitsCompletedToday / totalHabits) * 100) : 0;

  // Filtered practice sessions
  const filteredSessions = sessions.filter((s) =>
    selectedCategoryFilter === 'all' ? true : s.category === selectedCategoryFilter
  );

  // Bar chart data (7 or 30 days)
  const daysCount = timeRange === '7days' ? 7 : 30;
  const chartDays = Array.from({ length: daysCount }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (daysCount - 1 - i));
    const dStr = formatDate(d);

    const habitsDone = stats.dailyHabitsHistory[dStr] || 0;
    const practiceSecs = stats.dailyPracticeHistory[dStr] || 0;
    const practiceMins = Math.round(practiceSecs / 60);

    const weekdayShort = new Intl.DateTimeFormat('pt-BR', { weekday: 'short' }).format(d);
    const dayMonth = `${d.getDate()}/${d.getMonth() + 1}`;

    return {
      date: dStr,
      label: timeRange === '7days' ? weekdayShort : dayMonth,
      fullDate: dStr,
      habitsDone,
      practiceMins,
      isToday: dStr === todayStr,
    };
  });

  const maxHabitsInChart = Math.max(totalHabits || 5, ...chartDays.map((d) => d.habitsDone));

  // Habit Heatmap: Last 84 days (12 weeks)
  const heatmapDays = Array.from({ length: 84 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (83 - i));
    const dStr = formatDate(d);
    const count = stats.dailyHabitsHistory[dStr] || 0;
    const secs = stats.dailyPracticeHistory[dStr] || 0;
    return {
      date: dStr,
      count,
      secs,
    };
  });

  const getHeatmapColor = (count: number) => {
    if (count === 0) return 'bg-zinc-800/60';
    if (count <= 2) return 'bg-emerald-950 text-emerald-300 border border-emerald-800/40';
    if (count <= 4) return 'bg-emerald-700/80';
    return 'bg-emerald-400 shadow-sm shadow-emerald-400/40';
  };

  const handleDeleteSession = (id: string) => {
    if (window.confirm('Deseja excluir esta sessão de prática do seu histórico?')) {
      const updated = deletePracticeSession(id);
      onSessionsChange(updated);
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-zinc-800 bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-950 p-6 md:p-8 shadow-2xl">
        <div className="absolute right-0 top-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                Estatísticas 100% Reais
              </span>
              <span className="text-xs text-zinc-400">Desenvolvimento Pessoal • Sem Dados Fictícios</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-zinc-100 tracking-tight">
              Evolução Real de {profile.name}
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-xl">
              "{profile.manifesto || 'Construindo consistência inabalável através de hábitos diários.'}"
            </p>
          </div>

          {/* Streak Indicator */}
          <div className="flex items-center gap-4 bg-zinc-950/80 border border-zinc-800 px-5 py-4 rounded-2xl shrink-0">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-400 text-zinc-950 shadow-lg shadow-amber-500/30">
              <Flame className="h-7 w-7 fill-zinc-950" />
            </div>
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-zinc-100">{stats.currentStreak}</span>
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                  {stats.currentStreak === 1 ? 'dia seguido' : 'dias seguidos'}
                </span>
              </div>
              <p className="text-[11px] text-zinc-500">
                Recorde real: <strong className="text-zinc-300">{stats.bestStreak} dias</strong> 🔥
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Empty State Banner if completely 0 */}
      {stats.totalHabitCompletions === 0 && stats.totalPracticeSeconds === 0 && (
        <div className="rounded-3xl border border-dashed border-emerald-500/30 bg-emerald-500/5 p-6 sm:p-8 text-center">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 mb-3 border border-emerald-500/20">
            <Target className="h-7 w-7" />
          </div>
          <h3 className="text-lg font-bold text-zinc-100">
            Painel de Hábitos 100% Real • Começando do Zero
          </h3>
          <p className="text-xs text-zinc-400 max-w-lg mx-auto mt-1.5 mb-4 leading-relaxed">
            Nenhum dado simulado ou inventado está sendo mostrado. Suas métricas de hábitos,
            tempo cronometrado, sequência diária e gráficos refletirão com precisão absoluta cada ação
            que você registrar.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={onOpenHabits}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:brightness-110 text-zinc-950 font-bold text-xs transition-all inline-flex items-center gap-2 shadow-lg shadow-emerald-500/20"
            >
              <CheckCircle2 className="h-4 w-4" />
              Concluir Meu Primeiro Hábito Hoje
            </button>
            <button
              onClick={onOpenTimer}
              className="px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-bold text-xs transition-colors inline-flex items-center gap-2"
            >
              <Clock className="h-4 w-4 text-amber-400" />
              Iniciar Cronômetro de Prática
            </button>
          </div>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Hábitos Hoje */}
        <div className="rounded-3xl border border-zinc-800/80 bg-zinc-900/60 p-5 shadow-lg">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Hábitos Hoje</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">
            {stats.habitsCompletedToday} / {totalHabits}
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">{habitsPercentToday}% concluídos hoje</p>
        </div>

        {/* Total Concluídos */}
        <div className="rounded-3xl border border-zinc-800/80 bg-zinc-900/60 p-5 shadow-lg">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total de Hábitos</span>
            <Award className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-zinc-100">
            {stats.totalHabitCompletions}
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">vezes marcados como feito</p>
        </div>

        {/* Tempo de Prática Cronometrado */}
        <div className="rounded-3xl border border-zinc-800/80 bg-zinc-900/60 p-5 shadow-lg">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Foco / Prática</span>
            <Clock className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-cyan-400">
            {formatSecondsToHuman(stats.totalPracticeSeconds)}
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">
            {stats.totalSessions} {stats.totalSessions === 1 ? 'sessão cronometrada' : 'sessões cronometradas'}
          </p>
        </div>

        {/* Esta Semana */}
        <div className="rounded-3xl border border-zinc-800/80 bg-zinc-900/60 p-5 shadow-lg">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Foco Esta Semana</span>
            <TrendingUp className="h-4 w-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-purple-400">
            {formatSecondsToHuman(stats.weekPracticeSeconds)}
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">dedicação na semana</p>
        </div>
      </div>

      {/* 2-Column Section: Chart & Pillars Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Daily Habits Bar Chart */}
        <div className="lg:col-span-7 rounded-3xl border border-zinc-800 bg-zinc-900/60 p-6 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-emerald-400" />
              <h3 className="text-base font-bold text-zinc-100">Consistência de Hábitos Cumpridos</h3>
            </div>
            <div className="inline-flex rounded-xl bg-zinc-950 p-1 border border-zinc-800 text-xs">
              <button
                onClick={() => setTimeRange('7days')}
                className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                  timeRange === '7days' ? 'bg-emerald-500 text-zinc-950' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                7 Dias
              </button>
              <button
                onClick={() => setTimeRange('30days')}
                className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                  timeRange === '30days' ? 'bg-emerald-500 text-zinc-950' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                30 Dias
              </button>
            </div>
          </div>

          {/* Bar Chart Display */}
          <div className="h-52 flex items-end justify-between gap-1 sm:gap-2 pt-6 pb-2 border-b border-zinc-800">
            {chartDays.map((d) => {
              const heightPercent = maxHabitsInChart > 0 ? (d.habitsDone / maxHabitsInChart) * 100 : 0;
              return (
                <div
                  key={d.fullDate}
                  className="flex-1 flex flex-col items-center h-full justify-end group relative"
                >
                  <div className="absolute -top-10 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity bg-zinc-950 border border-zinc-700 text-[10px] text-zinc-200 py-1 px-2 rounded-lg whitespace-nowrap z-20 shadow-xl">
                    <span className="font-bold text-emerald-400">{d.habitsDone} hábitos</span> ({d.fullDate})
                  </div>

                  <div
                    className={`w-full rounded-t-lg transition-all duration-500 ${
                      d.isToday
                        ? 'bg-emerald-400 shadow-md shadow-emerald-400/20'
                        : d.habitsDone > 0
                        ? 'bg-emerald-600/80 group-hover:bg-emerald-500'
                        : 'bg-zinc-800/40'
                    }`}
                    style={{ height: `${Math.max(4, heightPercent)}%` }}
                  />
                  <span
                    className={`text-[10px] mt-2 block truncate w-full text-center ${
                      d.isToday ? 'font-bold text-emerald-400' : 'text-zinc-500'
                    }`}
                  >
                    {d.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Pillars / Categories Breakdown */}
        <div className="lg:col-span-5 rounded-3xl border border-zinc-800 bg-zinc-900/60 p-6 shadow-xl">
          <div className="flex items-center gap-2 mb-6">
            <PieChart className="h-5 w-5 text-amber-400" />
            <h3 className="text-base font-bold text-zinc-100">Pilares de Desenvolvimento</h3>
          </div>

          <div className="space-y-4">
            {Object.entries(CATEGORY_LABELS).map(([catKey, catMeta]) => {
              const habitCount = habits.filter((h) => h.category === catKey).length;
              const practiceSecs = stats.categoryTotals[catKey] || 0;

              return (
                <div key={catKey} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-zinc-300 flex items-center gap-2">
                      <span>{catMeta.icon}</span>
                      <span>{catMeta.label}</span>
                    </span>
                    <span className="text-zinc-400 font-mono">
                      {habitCount} {habitCount === 1 ? 'hábito' : 'hábitos'} • {formatSecondsToHuman(practiceSecs)}
                    </span>
                  </div>
                  <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(100, (habitCount / Math.max(1, totalHabits)) * 100)}%`,
                        backgroundColor: catMeta.color,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Habit Heatmap (12 Weeks) */}
      <div className="rounded-3xl border border-zinc-800 bg-zinc-900/60 p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-emerald-400" />
            <h3 className="text-base font-bold text-zinc-100">Mapa de Constância de Hábitos</h3>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-zinc-400">
            <span>0 feitos</span>
            <div className="h-3 w-3 rounded-sm bg-zinc-800/60" />
            <div className="h-3 w-3 rounded-sm bg-emerald-950 border border-emerald-800" />
            <div className="h-3 w-3 rounded-sm bg-emerald-700/80" />
            <div className="h-3 w-3 rounded-sm bg-emerald-400" />
            <span>Todos</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 pt-2">
          {heatmapDays.map((day) => (
            <div
              key={day.date}
              className={`h-4 w-4 rounded-md transition-all ${getHeatmapColor(
                day.count
              )} hover:scale-125 cursor-pointer relative group`}
            >
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity bg-zinc-950 border border-zinc-700 text-[10px] text-zinc-200 py-1 px-2 rounded whitespace-nowrap z-30 shadow-xl">
                {day.date}: {day.count} hábitos concluídos
              </div>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-zinc-500 mt-3">
          Histórico dos últimos 84 dias. Cada quadrado reflete um dia de disciplina pessoal.
        </p>
      </div>

      {/* Practice Sessions History Table */}
      <div className="rounded-3xl border border-zinc-800 bg-zinc-900/60 p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-base font-bold text-zinc-100">Sessões de Prática Cronometradas</h3>
            <p className="text-xs text-zinc-400">Histórico de foco registrado no seu perfil</p>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-3.5 w-3.5 text-zinc-500" />
            <select
              value={selectedCategoryFilter}
              onChange={(e) => setSelectedCategoryFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-zinc-950 text-xs font-semibold text-zinc-200 border border-zinc-800 focus:outline-none cursor-pointer"
            >
              <option value="all">Todas as Categorias</option>
              {Object.entries(CATEGORY_LABELS).map(([k, meta]) => (
                <option key={k} value={k}>
                  {meta.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
          {filteredSessions.length === 0 ? (
            <div className="text-center py-10 text-zinc-500 text-xs border border-dashed border-zinc-800 rounded-2xl">
              Nenhuma sessão cronometrada encontrada para este filtro.
            </div>
          ) : (
            filteredSessions.map((sess) => (
              <div
                key={sess.id}
                className="p-3.5 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 flex items-center justify-between gap-4 hover:border-zinc-700 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div
                    className="h-3.5 w-3.5 rounded-full mt-1 shrink-0"
                    style={{ backgroundColor: sess.color }}
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-zinc-200">{sess.habitName}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 font-medium uppercase">
                        {sess.mode}
                      </span>
                      <span className="text-[11px] text-zinc-500">{sess.date}</span>
                    </div>
                    {sess.notes && (
                      <p className="text-xs text-zinc-400 mt-1">{sess.notes}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <span className="text-sm font-bold text-zinc-100">
                      {formatSecondsToHuman(sess.durationSeconds)}
                    </span>
                    {sess.rating && (
                      <div className="text-[10px] text-amber-400">
                        {Array.from({ length: sess.rating }).map((_, i) => (
                          <span key={i}>★</span>
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => handleDeleteSession(sess.id)}
                    className="p-1.5 text-zinc-600 hover:text-rose-400 transition-colors rounded-lg hover:bg-zinc-800"
                    title="Excluir sessão"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
