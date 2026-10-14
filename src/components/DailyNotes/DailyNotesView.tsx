import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  CheckSquare,
  Square,
  Sparkles,
  Download,
  Copy,
  Search,
  BookOpen,
  Clock,
  Check,
  Heart,
  Trophy,
  Zap,
  ListTodo,
  Smile
} from 'lucide-react';
import { DailyJournal, DailyTodo, Habit, PracticeSession } from '../../types';
import {
  formatDate,
  getTodayDateString,
  getDailyJournal,
  saveDailyJournal,
  getDailyJournals,
  formatSecondsToHuman,
  HabitLogsMap
} from '../../utils/storage';

interface DailyNotesViewProps {
  habits: Habit[];
  habitLogs: HabitLogsMap;
  sessions: PracticeSession[];
  onOpenTimerForToday: () => void;
}

export const DailyNotesView: React.FC<DailyNotesViewProps> = ({
  habits,
  habitLogs,
  sessions,
  onOpenTimerForToday,
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateString());
  const [journal, setJournal] = useState<DailyJournal>(getDailyJournal(selectedDate));
  const [newTodoText, setNewTodoText] = useState('');
  const [newTodoPriority, setNewTodoPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedToast, setCopiedToast] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');

  // Load journal when date changes
  useEffect(() => {
    setJournal(getDailyJournal(selectedDate));
  }, [selectedDate]);

  const updateJournal = (updater: (prev: DailyJournal) => DailyJournal) => {
    setSaveStatus('saving');
    setJournal((prev) => {
      const next = updater(prev);
      saveDailyJournal(next);
      return next;
    });
    setTimeout(() => setSaveStatus('saved'), 400);
  };

  // Date navigation
  const handlePrevDay = () => {
    const current = new Date(`${selectedDate}T12:00:00`);
    current.setDate(current.getDate() - 1);
    setSelectedDate(formatDate(current));
  };

  const handleNextDay = () => {
    const current = new Date(`${selectedDate}T12:00:00`);
    current.setDate(current.getDate() + 1);
    setSelectedDate(formatDate(current));
  };

  const handleToday = () => {
    setSelectedDate(getTodayDateString());
  };

  // Gratitude items
  const handleGratitudeChange = (index: number, val: string) => {
    updateJournal((prev) => {
      const g = [...(prev.gratitude || ['', '', ''])];
      g[index] = val;
      return { ...prev, gratitude: g };
    });
  };

  // Add / Toggle / Delete Todos
  const handleAddTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodoText.trim()) return;

    const newTodo: DailyTodo = {
      id: `todo-${Date.now()}`,
      text: newTodoText.trim(),
      completed: false,
      priority: newTodoPriority,
    };

    updateJournal((prev) => ({
      ...prev,
      todos: [...(prev.todos || []), newTodo],
    }));
    setNewTodoText('');
  };

  const handleToggleTodo = (id: string) => {
    updateJournal((prev) => ({
      ...prev,
      todos: (prev.todos || []).map((t) =>
        t.id === id ? { ...t, completed: !t.completed } : t
      ),
    }));
  };

  const handleDeleteTodo = (id: string) => {
    updateJournal((prev) => ({
      ...prev,
      todos: (prev.todos || []).filter((t) => t.id !== id),
    }));
  };

  // Habits for this day
  const dayHabitLogs = habitLogs[selectedDate] || {};
  const completedHabitsForDay = habits.filter((h) => dayHabitLogs[h.id]);

  // Practice sessions for this day
  const daySessions = sessions.filter((s) => s.date === selectedDate);
  const totalPracticeSeconds = daySessions.reduce((acc, curr) => acc + curr.durationSeconds, 0);

  // Formatted date string in Portuguese
  const parsedDate = new Date(`${selectedDate}T12:00:00`);
  const dateFormattedPT = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(parsedDate);

  const isToday = selectedDate === getTodayDateString();

  // Search through all daily journals
  const allJournals = getDailyJournals();
  const searchResults = searchQuery.trim()
    ? Object.values(allJournals).filter(
        (j) =>
          j.reflections?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          j.winOfDay?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          j.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          j.gratitude?.some((g) => g.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : [];

  const handleExportMarkdown = () => {
    const md = `# Diário de Desenvolvimento Pessoal - ${selectedDate}
${journal.title ? `## ${journal.title}\n` : ''}
${journal.mood ? `**Estado Mental:** ${journal.mood} | **Energia:** ${journal.energyLevel || 5}/5\n` : ''}
### 3 Gratidões de Hoje:
${(journal.gratitude || []).map((g, i) => `${i + 1}. ${g || '—'}`).join('\n')}

### Vitória do Dia (Maior Conquista):
${journal.winOfDay || '—'}

### Hábitos Concluídos (${completedHabitsForDay.length}/${habits.length}):
${completedHabitsForDay.map((h) => `✓ ${h.icon} ${h.name}`).join('\n')}

### Reflexões & Anotações:
${journal.reflections || '—'}

---
*Tempo de Prática Cronometrado: ${formatSecondsToHuman(totalPracticeSeconds)}*
`;

    navigator.clipboard.writeText(md);
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 2500);
  };

  return (
    <div className="w-full space-y-6">
      {/* Top Bar: Date Selector & Global Search */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-zinc-900/80 p-4 rounded-3xl border border-zinc-800">
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevDay}
            className="p-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 transition-colors border border-zinc-700/50"
            title="Dia anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-2 bg-zinc-950/60 px-3.5 py-1.5 rounded-2xl border border-zinc-800">
            <CalendarIcon className="h-4 w-4 text-amber-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                if (e.target.value) setSelectedDate(e.target.value);
              }}
              className="bg-transparent text-sm font-semibold text-zinc-100 focus:outline-none cursor-pointer"
            />
          </div>

          <button
            onClick={handleNextDay}
            className="p-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 transition-colors border border-zinc-700/50"
            title="Próximo dia"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          {!isToday && (
            <button
              onClick={handleToday}
              className="ml-2 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-semibold transition-colors"
            >
              Ir para Hoje
            </button>
          )}
        </div>

        {/* Global Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Buscar no diário de bordo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-2xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500 hover:text-zinc-300"
            >
              Limpar
            </button>
          )}
        </div>
      </div>

      {/* Search results banner */}
      {searchQuery && (
        <div className="rounded-3xl border border-amber-500/30 bg-amber-500/5 p-4">
          <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2">
            Resultados da busca para "{searchQuery}" ({searchResults.length} dias):
          </h4>
          <div className="flex flex-wrap gap-2">
            {searchResults.length === 0 ? (
              <p className="text-xs text-zinc-400">Nenhum registro encontrado.</p>
            ) : (
              searchResults.map((res) => (
                <button
                  key={res.date}
                  onClick={() => {
                    setSelectedDate(res.date);
                    setSearchQuery('');
                  }}
                  className="px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-700/60 hover:border-amber-400 text-xs text-zinc-200 transition-all text-left"
                >
                  <span className="font-bold text-amber-400">{res.date}</span>:{' '}
                  {res.title || res.winOfDay || 'Registro diário'}
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* Date Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/80 pb-4">
        <div>
          <h2 className="text-2xl font-black capitalize tracking-tight text-zinc-100">
            {dateFormattedPT}
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Diário de reflexão pessoal, gratidão e evolução diária
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-zinc-500 font-medium">
            {saveStatus === 'saving' ? 'Salvando...' : 'Salvo no perfil ✓'}
          </span>
          <button
            onClick={handleExportMarkdown}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-medium text-zinc-300 transition-colors"
            title="Copiar diário em Markdown"
          >
            {copiedToast ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            {copiedToast ? 'Copiado!' : 'Exportar Markdown'}
          </button>
        </div>
      </div>

      {/* 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Habits Status & Practice Sessions & Todos */}
        <div className="lg:col-span-5 space-y-6">
          {/* Day Habits Summary */}
          <div className="rounded-3xl border border-zinc-800/80 bg-gradient-to-b from-zinc-900/90 to-zinc-950 p-5 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs uppercase tracking-wider text-zinc-400 font-bold flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-emerald-400" />
                Hábitos Praticados no Dia
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-300 font-medium">
                {completedHabitsForDay.length} / {habits.length}
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5 pt-1 mb-4">
              {habits.map((h) => {
                const done = Boolean(dayHabitLogs[h.id]);
                return (
                  <span
                    key={h.id}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-medium border ${
                      done
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-500 line-through opacity-60'
                    }`}
                  >
                    <span>{h.icon}</span>
                    <span>{h.name}</span>
                  </span>
                );
              })}
            </div>

            {/* Practice time */}
            <div className="pt-3 border-t border-zinc-800/60 flex items-center justify-between text-xs">
              <span className="text-zinc-400">Tempo cronometrado:</span>
              <strong className="text-amber-400 font-mono text-sm">
                {formatSecondsToHuman(totalPracticeSeconds)}
              </strong>
            </div>
          </div>

          {/* Daily Tasks / Todos */}
          <div className="rounded-3xl border border-zinc-800/80 bg-zinc-900/60 p-5 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs uppercase tracking-wider text-zinc-400 font-bold flex items-center gap-1.5">
                <ListTodo className="h-4 w-4 text-emerald-400" />
                Ações & Metas do Dia
              </span>
              <span className="text-xs text-zinc-500 font-medium">
                {(journal.todos || []).filter((t) => t.completed).length}/{(journal.todos || []).length}
              </span>
            </div>

            <form onSubmit={handleAddTodo} className="flex gap-2 mb-4">
              <input
                type="text"
                placeholder="Ex: Agendar médico, revisar metas da semana..."
                value={newTodoText}
                onChange={(e) => setNewTodoText(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
              />
              <button
                type="submit"
                className="px-3 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 text-xs font-bold transition-colors flex items-center gap-1"
              >
                <Plus className="h-3.5 w-3.5" />
                Adicionar
              </button>
            </form>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {(!journal.todos || journal.todos.length === 0) ? (
                <p className="text-xs text-zinc-500 py-3 text-center">
                  Nenhuma meta adicionada para este dia.
                </p>
              ) : (
                journal.todos.map((todo) => (
                  <div
                    key={todo.id}
                    className={`flex items-center justify-between p-2.5 rounded-xl border transition-colors ${
                      todo.completed
                        ? 'bg-zinc-950/40 border-zinc-800/60 text-zinc-500 line-through'
                        : 'bg-zinc-850 border-zinc-800 text-zinc-200'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => handleToggleTodo(todo.id)}
                      className="flex items-center gap-2.5 text-left flex-1"
                    >
                      {todo.completed ? (
                        <CheckSquare className="h-4 w-4 text-emerald-400 shrink-0" />
                      ) : (
                        <Square className="h-4 w-4 text-zinc-500 shrink-0" />
                      )}
                      <span className="text-xs font-medium">{todo.text}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteTodo(todo.id)}
                      className="p-1 text-zinc-600 hover:text-rose-400 transition-colors"
                      title="Excluir"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Gratitude, Win of Day, Mood, Reflections */}
        <div className="lg:col-span-7 space-y-6">
          <div className="rounded-3xl border border-zinc-800/80 bg-zinc-900/60 p-6 shadow-xl space-y-6">
            {/* Title & State of Mind */}
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Tema ou foco de hoje (ex: Dia de alta clareza e presença)"
                value={journal.title || ''}
                onChange={(e) => updateJournal((prev) => ({ ...prev, title: e.target.value }))}
                className="w-full text-lg font-bold text-zinc-100 placeholder-zinc-600 bg-transparent border-b border-zinc-800 pb-2 focus:outline-none focus:border-amber-400 transition-colors"
              />

              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                {/* Mood */}
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-zinc-500 font-medium">Estado Mental:</span>
                  {[
                    { id: 'great', label: '🔥 Imparável' },
                    { id: 'good', label: '⚡ Produtivo' },
                    { id: 'neutral', label: '🧘 Sereno' },
                    { id: 'tired', label: '😴 Cansado' },
                    { id: 'stressed', label: '🧗 Desafiador' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() =>
                        updateJournal((prev) => ({
                          ...prev,
                          mood: prev.mood === m.id ? undefined : (m.id as DailyJournal['mood']),
                        }))
                      }
                      className={`px-2 py-0.5 rounded-lg text-xs transition-all ${
                        journal.mood === m.id
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold'
                          : 'bg-zinc-800/50 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>

                {/* Energy Level */}
                <div className="flex items-center gap-1.5">
                  <Zap className="h-3.5 w-3.5 text-amber-400" />
                  <span className="text-xs text-zinc-500 font-medium">Energia:</span>
                  {[1, 2, 3, 4, 5].map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() =>
                        updateJournal((prev) => ({
                          ...prev,
                          energyLevel: prev.energyLevel === level ? undefined : level,
                        }))
                      }
                      className={`h-6 w-6 rounded-md text-xs font-bold transition-all ${
                        journal.energyLevel === level
                          ? 'bg-amber-400 text-zinc-950 font-black'
                          : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Gratitude (3 items) */}
            <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800 space-y-3">
              <div className="flex items-center gap-2 text-rose-400 font-bold text-xs uppercase tracking-wider">
                <Heart className="h-4 w-4 fill-rose-500/20" />
                3 Coisas pelas quais sou grato hoje:
              </div>
              {[0, 1, 2].map((idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-xs font-bold text-zinc-500">{idx + 1}.</span>
                  <input
                    type="text"
                    placeholder={`Gratidão ${idx + 1}...`}
                    value={journal.gratitude?.[idx] || ''}
                    onChange={(e) => handleGratitudeChange(idx, e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl bg-zinc-900/90 border border-zinc-800 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-rose-500/40"
                  />
                </div>
              ))}
            </div>

            {/* Win of the Day */}
            <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800 space-y-2">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
                <Trophy className="h-4 w-4 fill-amber-500/20" />
                Vitória do Dia (Minha maior conquista de hoje):
              </div>
              <input
                type="text"
                placeholder="Ex: Concluí o capítulo difícil e mantive a calma diante do imprevisto..."
                value={journal.winOfDay || ''}
                onChange={(e) => updateJournal((prev) => ({ ...prev, winOfDay: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl bg-zinc-900/90 border border-zinc-800 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-amber-500/40"
              />
            </div>

            {/* Verse / Bible Passage of the Day */}
            <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800 space-y-2">
              <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider">
                <BookOpen className="h-4 w-4 text-indigo-400" />
                Leitura Bíblica & Versículo do Dia:
              </div>
              <input
                type="text"
                placeholder="Ex: 'O Senhor é o meu pastor; nada me faltará.' — Salmos 23:1"
                value={journal.verseOfDay || ''}
                onChange={(e) => updateJournal((prev) => ({ ...prev, verseOfDay: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl bg-zinc-900/90 border border-zinc-800 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-indigo-500/40"
              />
            </div>

            {/* Reflections & General Notes */}
            <div className="space-y-2">
              <label className="block text-xs uppercase tracking-wider font-bold text-zinc-400">
                Reflexões, Aprendizados & Diário de Bordo:
              </label>
              <textarea
                value={journal.reflections || ''}
                onChange={(e) => updateJournal((prev) => ({ ...prev, reflections: e.target.value }))}
                placeholder="Escreva livremente sobre suas percepções, o que funcionou bem hoje, o que pode ser aprimorado amanhã..."
                className="w-full h-56 rounded-2xl bg-zinc-950/80 border border-zinc-800 p-4 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-amber-500/40 font-mono leading-relaxed resize-none"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
