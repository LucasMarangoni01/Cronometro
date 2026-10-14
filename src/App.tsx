import React, { useState } from 'react';
import { Navbar, NavTab } from './components/Navbar';
import { HabitsView } from './components/Habits/HabitsView';
import { StudyTimer } from './components/Timer/StudyTimer';
import { DailyNotesView } from './components/DailyNotes/DailyNotesView';
import { StatsView } from './components/Stats/StatsView';
import { ProfileModal } from './components/Profile/ProfileModal';
import { LockScreen } from './components/Security/LockScreen';
import {
  getUserProfile,
  getHabits,
  getHabitLogs,
  getPracticeSessions,
  calculatePersonalStats,
  isAppLocked,
  setAppUnlocked,
  HabitLogsMap
} from './utils/storage';
import { Habit, PracticeSession, UserProfile } from './types';

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavTab>('habits');
  const [profile, setProfile] = useState<UserProfile>(getUserProfile());
  const [habits, setHabits] = useState<Habit[]>(getHabits());
  const [habitLogs, setHabitLogs] = useState<HabitLogsMap>(getHabitLogs());
  const [sessions, setSessions] = useState<PracticeSession[]>(getPracticeSessions());
  const [selectedHabitForTimer, setSelectedHabitForTimer] = useState<Habit | null>(null);
  const [runningTimerInfo, setRunningTimerInfo] = useState<{
    isRunning: boolean;
    habitName: string;
    time: string;
  } | null>(null);

  const [isLocked, setIsLocked] = useState<boolean>(isAppLocked());
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // 100% Real stats calculated on user data
  const stats = calculatePersonalStats(sessions, habitLogs, profile.dailyHabitsGoal);

  const handleHabitLogsUpdated = (updatedLogs: HabitLogsMap) => {
    setHabitLogs({ ...updatedLogs });
  };

  const handleHabitsUpdated = (updatedHabits: Habit[]) => {
    setHabits([...updatedHabits]);
  };

  const handleSessionSaved = (newSession: PracticeSession) => {
    setSessions((prev) => [newSession, ...prev]);
  };

  const handleSessionsChange = (updated: PracticeSession[]) => {
    setSessions(updated);
  };

  const handleProfileUpdated = (updated: UserProfile) => {
    setProfile(updated);
  };

  const handleStartTimerForHabit = (habit: Habit) => {
    setSelectedHabitForTimer(habit);
    setCurrentTab('timer');
  };

  const handleLockApp = () => {
    setAppUnlocked(false);
    setIsLocked(true);
  };

  const handleUnlock = () => {
    setIsLocked(false);
  };

  const handleResetData = () => {
    setSessions([]);
    setHabitLogs({});
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Privacy PIN Lockscreen when locked */}
      {isLocked && <LockScreen onUnlock={handleUnlock} />}

      {/* Main Navbar */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        profile={profile}
        stats={stats}
        totalHabitsCount={habits.length}
        runningTimerInfo={runningTimerInfo}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        onLockApp={handleLockApp}
      />

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 md:py-8">
        {/* Tab 1: Habits Tracker */}
        {currentTab === 'habits' && (
          <HabitsView
            habits={habits}
            habitLogs={habitLogs}
            profile={profile}
            onHabitsUpdated={handleHabitsUpdated}
            onHabitLogsUpdated={handleHabitLogsUpdated}
            onStartTimerForHabit={handleStartTimerForHabit}
          />
        )}

        {/* Tab 2: Focus & Practice Timer (Permanently kept mounted so running timer is never stopped when navigating tabs) */}
        <div className={currentTab === 'timer' ? 'block' : 'hidden'}>
          <StudyTimer
            habits={habits}
            profile={profile}
            initialSelectedHabit={selectedHabitForTimer}
            onSessionSaved={handleSessionSaved}
            onHabitLogsUpdated={handleHabitLogsUpdated}
            onOpenProfile={() => setIsProfileModalOpen(true)}
            onTimerRunningChange={(running, habitName, time) => {
              setRunningTimerInfo(running ? { isRunning: true, habitName, time } : null);
            }}
          />
        </div>

        {/* Tab 3: Daily Personal Development Journal */}
        {currentTab === 'journal' && (
          <DailyNotesView
            habits={habits}
            habitLogs={habitLogs}
            sessions={sessions}
            onOpenTimerForToday={() => setCurrentTab('timer')}
          />
        )}

        {/* Tab 4: 100% Real Stats */}
        {currentTab === 'stats' && (
          <StatsView
            sessions={sessions}
            habits={habits}
            habitLogs={habitLogs}
            profile={profile}
            onSessionsChange={handleSessionsChange}
            onOpenHabits={() => setCurrentTab('habits')}
            onOpenTimer={() => setCurrentTab('timer')}
          />
        )}
      </main>

      {/* Profile & Settings Modal */}
      <ProfileModal
        profile={profile}
        habits={habits}
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onProfileUpdated={handleProfileUpdated}
        onHabitsUpdated={handleHabitsUpdated}
        onLockApp={() => {
          setIsProfileModalOpen(false);
          handleLockApp();
        }}
        onResetData={handleResetData}
      />
    </div>
  );
}
