import React, { useState } from 'react';
import { Lock, Unlock, KeyRound, ShieldAlert } from 'lucide-react';
import { getUserProfile, saveUserProfile, setAppUnlocked } from '../../utils/storage';

interface LockScreenProps {
  onUnlock: () => void;
}

export const LockScreen: React.FC<LockScreenProps> = ({ onUnlock }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const profile = getUserProfile();

  const handleDigit = (digit: string) => {
    if (pin.length < 4) {
      const nextPin = pin + digit;
      setPin(nextPin);
      setError(false);

      if (nextPin.length === 4) {
        if (nextPin === profile.pinCode) {
          setAppUnlocked(true);
          onUnlock();
        } else {
          setError(true);
          setTimeout(() => {
            setPin('');
            setError(false);
          }, 800);
        }
      }
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
    setError(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/95 backdrop-blur-md px-4">
      <div className="w-full max-w-sm rounded-3xl border border-zinc-800 bg-zinc-900/90 p-8 text-center shadow-2xl">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
          <Lock className="h-8 w-8" />
        </div>

        <h2 className="text-xl font-bold text-zinc-100">Área Pessoal Bloqueada</h2>
        <p className="mt-1 text-sm text-zinc-400">
          Olá, <span className="text-amber-400 font-medium">{profile.name}</span>. Digite seu PIN de 4 dígitos para acessar suas anotações e cronômetro.
        </p>

        {/* PIN Dots Display */}
        <div className="my-6 flex justify-center gap-4">
          {[0, 1, 2, 3].map((idx) => {
            const isFilled = pin.length > idx;
            return (
              <div
                key={idx}
                className={`h-4 w-4 rounded-full transition-all duration-200 ${
                  error
                    ? 'bg-rose-500 scale-110 animate-bounce'
                    : isFilled
                    ? 'bg-amber-400 scale-110 shadow-lg shadow-amber-500/50'
                    : 'bg-zinc-800 border border-zinc-700'
                }`}
              />
            );
          })}
        </div>

        {error && (
          <p className="mb-4 text-xs font-medium text-rose-400 flex items-center justify-center gap-1.5 animate-pulse">
            <ShieldAlert className="h-3.5 w-3.5" />
            PIN incorreto. Tente novamente.
          </p>
        )}

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-3">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
            <button
              key={num}
              onClick={() => handleDigit(num)}
              className="h-14 rounded-2xl bg-zinc-800/70 hover:bg-zinc-700 text-xl font-semibold text-zinc-200 transition-all active:scale-95 border border-zinc-700/50"
            >
              {num}
            </button>
          ))}
          <button
            onClick={() => {
              if (window.confirm('Esqueceu o PIN? Ao redefinir, o bloqueio por PIN será desativado neste navegador.')) {
                const p = getUserProfile();
                p.pinEnabled = false;
                p.pinCode = '';
                saveUserProfile(p);
                setAppUnlocked(true);
                onUnlock();
              }
            }}
            className="flex items-center justify-center rounded-2xl text-xs text-zinc-500 hover:text-zinc-300 transition-colors p-2"
            title="Redefinir PIN"
          >
            <KeyRound className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleDigit('0')}
            className="h-14 rounded-2xl bg-zinc-800/70 hover:bg-zinc-700 text-xl font-semibold text-zinc-200 transition-all active:scale-95 border border-zinc-700/50"
          >
            0
          </button>
          <button
            onClick={handleDelete}
            className="flex items-center justify-center rounded-2xl bg-zinc-800/40 hover:bg-zinc-800 text-sm font-medium text-zinc-400 hover:text-zinc-200 transition-colors border border-zinc-700/30"
          >
            Apagar
          </button>
        </div>
      </div>
    </div>
  );
};
