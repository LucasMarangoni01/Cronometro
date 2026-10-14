import React, { useState } from 'react';
import {
  User,
  Shield,
  Lock,
  Download,
  Upload,
  Settings2,
  Trash2,
  Plus,
  Check,
  X,
  Volume2,
  Clock,
  Sparkles,
  Palette,
  FileJson,
  Target
} from 'lucide-react';
import { Habit, HabitCategory, UserProfile } from '../../types';
import {
  saveUserProfile,
  saveHabits,
  exportAllDataJSON,
  importAllDataJSON,
  resetAllUserData,
  CATEGORY_LABELS
} from '../../utils/storage';

interface ProfileModalProps {
  profile: UserProfile;
  habits: Habit[];
  isOpen: boolean;
  onClose: () => void;
  onProfileUpdated: (updated: UserProfile) => void;
  onHabitsUpdated: (updated: Habit[]) => void;
  onLockApp: () => void;
  onResetData?: () => void;
}

const AVATAR_OPTIONS = [
  { id: 'target', label: 'Focado', icon: '🎯' },
  { id: 'brain', label: 'Estrategista', icon: '🧠' },
  { id: 'fire', label: 'Imparável', icon: '🔥' },
  { id: 'zen', label: 'Mindful', icon: '🧘' },
  { id: 'rocket', label: 'Alta Performance', icon: '🚀' },
  { id: 'book', label: 'Aprendiz', icon: '📚' },
  { id: 'trophy', label: 'Vencedor', icon: '🏆' },
  { id: 'sun', label: 'Luminoso', icon: '☀️' },
];

export const ProfileModal: React.FC<ProfileModalProps> = ({
  profile,
  habits,
  isOpen,
  onClose,
  onProfileUpdated,
  onHabitsUpdated,
  onLockApp,
  onResetData,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'habits' | 'pomodoro' | 'backup'>('profile');

  // Local Form state
  const [formData, setFormData] = useState<UserProfile>({ ...profile });
  const [currentHabits, setCurrentHabits] = useState<Habit[]>([...habits]);

  // Security PIN states
  const [pinInput, setPinInput] = useState(profile.pinCode || '');
  const [pinEnabled, setPinEnabled] = useState(profile.pinEnabled);

  // New Habit inputs
  const [newHabitName, setNewHabitName] = useState('');
  const [newHabitCategory, setNewHabitCategory] = useState<HabitCategory>('mind');
  const [newHabitIcon, setNewHabitIcon] = useState('🧘');
  const [newHabitColor, setNewHabitColor] = useState('#10b981');
  const [newHabitTarget, setNewHabitTarget] = useState<number | undefined>(20);

  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const showNotification = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  const handleSaveProfile = () => {
    const updated: UserProfile = {
      ...formData,
      pinCode: pinInput,
      pinEnabled: pinEnabled && pinInput.length === 4,
    };
    saveUserProfile(updated);
    onProfileUpdated(updated);
    showNotification('Perfil e metas salvos com sucesso!');
  };

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

    const nextHabits = [...currentHabits, newHabit];
    setCurrentHabits(nextHabits);
    saveHabits(nextHabits);
    onHabitsUpdated(nextHabits);
    setNewHabitName('');
    showNotification('Novo hábito adicionado à sua rotina!');
  };

  const handleDeleteHabit = (id: string) => {
    if (currentHabits.length <= 1) {
      alert('Você deve manter pelo menos um hábito cadastrado.');
      return;
    }
    const next = currentHabits.filter((h) => h.id !== id);
    setCurrentHabits(next);
    saveHabits(next);
    onHabitsUpdated(next);
  };

  const handleExportBackup = () => {
    const jsonStr = exportAllDataJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `evolua-habitos-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showNotification('Backup completo exportado com sucesso!');
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content && importAllDataJSON(content)) {
        showNotification('Backup restaurado! Recarregando aplicação...');
        setTimeout(() => window.location.reload(), 1000);
      } else {
        alert('Erro ao importar arquivo. Verifique se é um backup válido do Evolua.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 backdrop-blur-md p-4">
      <div className="w-full max-w-2xl rounded-3xl border border-zinc-800 bg-zinc-900 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center text-xl">
              {AVATAR_OPTIONS.find((a) => a.id === formData.avatar)?.icon || '🎯'}
            </div>
            <div>
              <h3 className="font-bold text-lg text-zinc-100">Meu Perfil de Desenvolvimento Pessoal</h3>
              <p className="text-xs text-zinc-400">Metas, rotina de hábitos, privacidade e backup</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Feedback Alert */}
        {feedbackMsg && (
          <div className="bg-emerald-500/10 border-b border-emerald-500/20 text-emerald-400 px-6 py-2 text-xs font-semibold flex items-center gap-2">
            <Check className="h-4 w-4" />
            {feedbackMsg}
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex border-b border-zinc-800 px-6 overflow-x-auto gap-2 pt-2">
          {[
            { id: 'profile', label: 'Perfil & Metas', icon: User },
            { id: 'security', label: 'Privacidade & PIN', icon: Shield },
            { id: 'habits', label: 'Hábitos Cadastrados', icon: Target },
            { id: 'pomodoro', label: 'Cronômetro & Sons', icon: Settings2 },
            { id: 'backup', label: 'Backup & Dados', icon: FileJson },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center gap-2 pb-3 pt-1 px-3 text-xs font-semibold border-b-2 whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? 'border-amber-400 text-amber-400'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* TAB 1: Profile & Goals */}
          {activeTab === 'profile' && (
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-semibold uppercase text-zinc-400 mb-2">
                  Avatar Pessoal:
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                  {AVATAR_OPTIONS.map((av) => (
                    <button
                      key={av.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, avatar: av.id })}
                      className={`h-12 flex flex-col items-center justify-center rounded-2xl text-xl transition-all border ${
                        formData.avatar === av.id
                          ? 'bg-amber-500/20 border-amber-400 scale-105'
                          : 'bg-zinc-800/60 border-zinc-700 hover:bg-zinc-800'
                      }`}
                      title={av.label}
                    >
                      {av.icon}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Seu Nome ou Apelido:
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-2xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Meu Manifesto Pessoal (Visão de Vida):
                </label>
                <input
                  type="text"
                  value={formData.manifesto}
                  onChange={(e) => setFormData({ ...formData, manifesto: e.target.value })}
                  placeholder="Ex: Construindo disciplina e evolução constante a cada dia."
                  className="w-full px-4 py-2.5 rounded-2xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    Meta de Hábitos por Dia:
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      max="15"
                      value={formData.dailyHabitsGoal}
                      onChange={(e) =>
                        setFormData({ ...formData, dailyHabitsGoal: parseInt(e.target.value) || 5 })
                      }
                      className="w-full px-4 py-2 rounded-2xl bg-zinc-950 border border-zinc-800 text-sm font-mono text-zinc-100"
                    />
                    <span className="text-xs text-zinc-500">hábitos</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    Meta de Prática / Foco Diário:
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="15"
                      max="360"
                      step="15"
                      value={formData.dailyFocusMinutesGoal}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          dailyFocusMinutesGoal: parseInt(e.target.value) || 60,
                        })
                      }
                      className="w-full px-4 py-2 rounded-2xl bg-zinc-950 border border-zinc-800 text-sm font-mono text-zinc-100"
                    />
                    <span className="text-xs text-zinc-500">minutos</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Privacy & PIN */}
          {activeTab === 'security' && (
            <div className="space-y-5">
              <div className="rounded-2xl bg-amber-500/10 border border-amber-500/20 p-4">
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-amber-300">
                      Uso Pessoal & Privacidade Absoluta
                    </h4>
                    <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
                      Seu diário de reflexão pessoal, vitórias e rastreamento de hábitos ficam salvos
                      exclusivamente no seu dispositivo. Você pode ativar um PIN para bloquear a
                      tela contra curiosos.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 rounded-2xl bg-zinc-950 border border-zinc-800">
                <div>
                  <span className="text-sm font-bold text-zinc-200 block">
                    Bloqueio com Código PIN de 4 Dígitos
                  </span>
                  <span className="text-xs text-zinc-400">
                    Exigir PIN toda vez que abrir o app ou ao clicar em bloquear
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={pinEnabled}
                  onChange={(e) => setPinEnabled(e.target.checked)}
                  className="h-5 w-5 rounded border-zinc-700 bg-zinc-900 text-amber-500 accent-amber-500 cursor-pointer"
                />
              </div>

              {pinEnabled && (
                <div className="space-y-3 p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800">
                  <label className="block text-xs font-semibold text-zinc-300">
                    Definir PIN de 4 números:
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••"
                    className="w-32 px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-center text-xl tracking-widest font-mono text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                  />
                  <p className="text-[11px] text-zinc-500">
                    Guarde seu PIN com segurança. Você pode alterá-lo a qualquer momento.
                  </p>
                </div>
              )}

              {profile.pinEnabled && (
                <button
                  type="button"
                  onClick={onLockApp}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-zinc-800 hover:bg-zinc-750 text-amber-400 border border-zinc-700 text-xs font-bold transition-all"
                >
                  <Lock className="h-4 w-4" />
                  Bloquear Tela Agora com PIN
                </button>
              )}
            </div>
          )}

          {/* TAB 3: Habits Management */}
          {activeTab === 'habits' && (
            <div className="space-y-5">
              <div>
                <h4 className="text-xs font-semibold uppercase text-zinc-400 mb-3">
                  Seus Hábitos Ativos:
                </h4>
                <div className="space-y-2">
                  {currentHabits.map((h) => (
                    <div
                      key={h.id}
                      className="flex items-center justify-between p-3 rounded-2xl bg-zinc-950 border border-zinc-800"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{h.icon}</span>
                        <div>
                          <span className="text-sm font-semibold text-zinc-200 block">{h.name}</span>
                          <span className="text-[11px] text-zinc-500">
                            {CATEGORY_LABELS[h.category]?.label || h.category}{' '}
                            {h.targetMinutes ? `• ${h.targetMinutes}m` : ''}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteHabit(h.id)}
                        className="p-1 text-zinc-600 hover:text-rose-400 transition-colors"
                        title="Remover hábito"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Add form */}
              <form onSubmit={handleCreateHabit} className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800 space-y-3">
                <span className="text-xs font-bold text-zinc-300 block">Cadastrar Novo Hábito:</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Nome do hábito (ex: Meditar 15m)"
                    value={newHabitName}
                    onChange={(e) => setNewHabitName(e.target.value)}
                    className="px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-xs text-zinc-100"
                  />
                  <select
                    value={newHabitCategory}
                    onChange={(e) => setNewHabitCategory(e.target.value as HabitCategory)}
                    className="px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-xs text-zinc-200"
                  >
                    {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v.icon} {v.label}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="submit"
                  className="w-full py-2 rounded-xl bg-amber-500 text-zinc-950 font-bold text-xs hover:brightness-110 flex items-center justify-center gap-1.5"
                >
                  <Plus className="h-4 w-4" />
                  Salvar Novo Hábito
                </button>
              </form>
            </div>
          )}

          {/* TAB 4: Timer & Sound */}
          {activeTab === 'pomodoro' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">
                    Foco Pomodoro:
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="5"
                      max="120"
                      value={formData.pomodoroWorkMinutes}
                      onChange={(e) =>
                        setFormData({ ...formData, pomodoroWorkMinutes: parseInt(e.target.value) || 25 })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-100 font-mono"
                    />
                    <span className="text-xs text-zinc-500">min</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">
                    Descanso Curto:
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      max="30"
                      value={formData.pomodoroShortBreakMinutes}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          pomodoroShortBreakMinutes: parseInt(e.target.value) || 5,
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-100 font-mono"
                    />
                    <span className="text-xs text-zinc-500">min</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">
                    Descanso Longo:
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="5"
                      max="60"
                      value={formData.pomodoroLongBreakMinutes}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          pomodoroLongBreakMinutes: parseInt(e.target.value) || 15,
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-100 font-mono"
                    />
                    <span className="text-xs text-zinc-500">min</span>
                  </div>
                </div>
              </div>

              {/* Sound */}
              <div className="pt-4 border-t border-zinc-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-zinc-200">
                    Sino ao Final da Sessão
                  </span>
                  <input
                    type="checkbox"
                    checked={formData.soundEnabled}
                    onChange={(e) => setFormData({ ...formData, soundEnabled: e.target.checked })}
                    className="h-5 w-5 rounded border-zinc-700 bg-zinc-900 text-amber-500 accent-amber-500"
                  />
                </div>

                {formData.soundEnabled && (
                  <div className="flex items-center gap-3">
                    <Volume2 className="h-4 w-4 text-zinc-400" />
                    <input
                      type="range"
                      min="0.1"
                      max="1"
                      step="0.05"
                      value={formData.soundVolume}
                      onChange={(e) =>
                        setFormData({ ...formData, soundVolume: parseFloat(e.target.value) })
                      }
                      className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                    />
                    <span className="text-xs text-zinc-400 font-mono">
                      {Math.round(formData.soundVolume * 100)}%
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: Backup & Clean */}
          {activeTab === 'backup' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2">
                <h4 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                  <Download className="h-4 w-4 text-amber-400" />
                  Exportar Backup Completo (JSON)
                </h4>
                <p className="text-xs text-zinc-400">
                  Baixe todos os seus hábitos, histórico de práticas, diários de bordo e estatísticas.
                </p>
                <button
                  type="button"
                  onClick={handleExportBackup}
                  className="mt-2 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-xs font-semibold flex items-center gap-2 transition-colors border border-zinc-700"
                >
                  <Download className="h-4 w-4 text-amber-400" />
                  Fazer Download do Backup
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2">
                <h4 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                  <Upload className="h-4 w-4 text-emerald-400" />
                  Restaurar Backup
                </h4>
                <p className="text-xs text-zinc-400">
                  Restaure seu histórico a partir de um backup .json exportado anteriormente.
                </p>
                <label className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-xs font-semibold cursor-pointer transition-colors border border-zinc-700">
                  <Upload className="h-4 w-4 text-emerald-400" />
                  Selecionar Arquivo JSON
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportBackup}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Reset Option */}
              <div className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/20 space-y-2">
                <h4 className="text-sm font-bold text-rose-300 flex items-center gap-2">
                  <Trash2 className="h-4 w-4 text-rose-400" />
                  Zerar Todos os Dados (Começar do Zero 100% Real)
                </h4>
                <p className="text-xs text-zinc-400">
                  Deseja apagar todos os hábitos marcados, diários e sessões para iniciar uma contagem
                  completamente limpa?
                </p>
                <button
                  type="button"
                  onClick={() => {
                    if (
                      window.confirm(
                        'Tem certeza de que deseja apagar todo o histórico de hábitos e diários para começar do zero absoluto?'
                      )
                    ) {
                      resetAllUserData();
                      if (onResetData) onResetData();
                      showNotification('Histórico zerado com sucesso!');
                    }
                  }}
                  className="mt-2 px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-semibold flex items-center gap-2 transition-colors border border-rose-500/30"
                >
                  <Trash2 className="h-4 w-4" />
                  Zerar Todos os Registros
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-zinc-800 bg-zinc-950/60">
          <span className="text-[11px] text-zinc-500">
            Evolua • Seus dados ficam salvos de forma 100% privada e local
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              Fechar
            </button>
            <button
              onClick={() => {
                handleSaveProfile();
                onClose();
              }}
              className="px-5 py-2.5 rounded-xl bg-amber-500 text-zinc-950 font-bold text-xs hover:brightness-110 transition-all shadow-lg shadow-amber-500/20"
            >
              Salvar Alterações
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
