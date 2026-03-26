"use client";

import React, { useState, useRef, useEffect } from 'react';
import { ShieldCheck, Lock, KeyRound, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ElisLogo } from '@/components/ElisLogo';
import { showToast } from '@/hooks/useToast';

const PIN_HASH_KEY = '@elis-gestora:pin-hash';
const SESSION_KEY = '@elis-gestora:session';

async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export function GestoraAuth({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isFirstTime, setIsFirstTime] = useState(false);
  const [pin, setPin] = useState(['', '', '', '']);
  const [confirmPin, setConfirmPin] = useState(['', '', '', '']);
  const [step, setStep] = useState<'enter' | 'confirm'>('enter');
  const [isChecking, setIsChecking] = useState(true);
  const [showReset, setShowReset] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const confirmRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const session = sessionStorage.getItem(SESSION_KEY);
    if (session === 'active') {
      setIsAuthenticated(true);
      setIsChecking(false);
      return;
    }
    const storedHash = localStorage.getItem(PIN_HASH_KEY);
    setIsFirstTime(!storedHash);
    setIsChecking(false);
  }, []);

  const handlePinChange = (index: number, value: string, isConfirm = false) => {
    if (!/^\d*$/.test(value)) return;
    const digit = value.slice(-1);
    const newPin = isConfirm ? [...confirmPin] : [...pin];
    newPin[index] = digit;
    isConfirm ? setConfirmPin(newPin) : setPin(newPin);
    if (digit && index < 3) {
      const refs = isConfirm ? confirmRefs : inputRefs;
      refs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent, isConfirm = false) => {
    if (e.key === 'Backspace') {
      const currentPin = isConfirm ? confirmPin : pin;
      if (!currentPin[index] && index > 0) {
        const refs = isConfirm ? confirmRefs : inputRefs;
        refs.current[index - 1]?.focus();
      }
    }
  };

  const handleSubmit = async () => {
    const pinStr = pin.join('');
    if (pinStr.length !== 4) return;

    if (isFirstTime) {
      if (step === 'enter') {
        setStep('confirm');
        setTimeout(() => confirmRefs.current[0]?.focus(), 100);
        return;
      }
      const confirmStr = confirmPin.join('');
      if (pinStr !== confirmStr) {
        showToast('Os PINs não coincidem.', 'error');
        setConfirmPin(['', '', '', '']);
        setStep('enter');
        setPin(['', '', '', '']);
        setTimeout(() => inputRefs.current[0]?.focus(), 100);
        return;
      }
      const hash = await sha256(pinStr + ':ELIS-GESTORA-SALT');
      localStorage.setItem(PIN_HASH_KEY, hash);
      sessionStorage.setItem(SESSION_KEY, 'active');
      showToast('PIN cadastrado com sucesso!', 'success');
      setIsAuthenticated(true);
    } else {
      const hash = await sha256(pinStr + ':ELIS-GESTORA-SALT');
      const storedHash = localStorage.getItem(PIN_HASH_KEY);
      if (hash === storedHash) {
        sessionStorage.setItem(SESSION_KEY, 'active');
        showToast('Acesso autorizado.', 'success');
        setIsAuthenticated(true);
      } else {
        showToast('PIN incorreto.', 'error');
        setPin(['', '', '', '']);
        setTimeout(() => inputRefs.current[0]?.focus(), 100);
      }
    }
  };

  const handleResetPin = () => {
    localStorage.removeItem(PIN_HASH_KEY);
    sessionStorage.removeItem(SESSION_KEY);
    setIsFirstTime(true);
    setPin(['', '', '', '']);
    setConfirmPin(['', '', '', '']);
    setStep('enter');
    setShowReset(false);
    showToast('PIN resetado. Defina um novo.', 'info');
    setTimeout(() => inputRefs.current[0]?.focus(), 100);
  };

  useEffect(() => {
    const pinStr = pin.join('');
    if (pinStr.length === 4 && !isFirstTime) {
      handleSubmit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin]);

  if (isChecking) return <div className="p-8 text-center text-slate-500 animate-pulse-subtle">Verificando acesso...</div>;
  if (isAuthenticated) return <>{children}</>;

  const renderPinInputs = (values: string[], refs: React.MutableRefObject<(HTMLInputElement | null)[]>, isConfirm = false) => (
    <div className="flex gap-3 justify-center">
      {values.map((digit, i) => (
        <input key={i} ref={(el) => { refs.current[i] = el; }} type="password" inputMode="numeric" maxLength={1} value={digit}
          onChange={(e) => handlePinChange(i, e.target.value, isConfirm)}
          onKeyDown={(e) => handleKeyDown(i, e, isConfirm)}
          className="w-14 h-14 text-center text-2xl font-bold border-2 border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 dark:text-slate-100 focus:border-elis-teal focus:ring-2 focus:ring-elis-teal/20 outline-none transition-all"
        />
      ))}
    </div>
  );

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8">
      <div className="bg-white dark:bg-slate-800 rounded-2xl card-shadow border border-slate-200 dark:border-slate-700 p-10 max-w-sm w-full space-y-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-elis-blue to-elis-blue-dark rounded-t-2xl" />
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-elis-blue-light mb-2">
            {isFirstTime ? <KeyRound className="w-8 h-8 text-elis-blue" /> : <Lock className="w-8 h-8 text-elis-blue" />}
          </div>
          <h2 className="text-xl font-bold">{isFirstTime ? 'Criar PIN de Acesso' : 'Área Restrita'}</h2>
          <p className="text-sm text-slate-500">
            {isFirstTime ? (step === 'enter' ? 'Defina um PIN de 4 dígitos.' : 'Confirme seu PIN.') : 'Digite o PIN de 4 dígitos.'}
          </p>
        </div>
        {step === 'enter' && renderPinInputs(pin, inputRefs)}
        {step === 'confirm' && isFirstTime && (
          <div className="space-y-3">
            <p className="text-xs text-center text-elis-teal font-medium">Confirme o PIN:</p>
            {renderPinInputs(confirmPin, confirmRefs, true)}
          </div>
        )}
        {isFirstTime && (
          <Button onClick={handleSubmit} className="w-full gap-2" disabled={step === 'enter' ? pin.join('').length !== 4 : confirmPin.join('').length !== 4}>
            <ShieldCheck className="w-4 h-4" />{step === 'enter' ? 'Avançar' : 'Cadastrar PIN'}
          </Button>
        )}
        {!isFirstTime && (
          <div className="text-center">
            <button onClick={() => setShowReset(true)} className="text-xs text-slate-400 hover:text-elis-red transition-colors inline-flex items-center gap-1">
              <RotateCcw className="w-3 h-3" /> Redefinir PIN
            </button>
          </div>
        )}
        {showReset && (
          <div className="bg-elis-red-light dark:bg-slate-700 rounded-lg p-4 space-y-3 animate-in fade-in">
            <p className="text-sm text-slate-700 dark:text-slate-300">Isso irá apagar o PIN atual. Você precisará definir um novo.</p>
            <div className="flex gap-2">
              <Button variant="destructive" size="sm" className="flex-1" onClick={handleResetPin}><RotateCcw className="w-4 h-4 mr-1" />Confirmar Reset</Button>
              <Button variant="outline" size="sm" onClick={() => setShowReset(false)}>Cancelar</Button>
            </div>
          </div>
        )}
        <div className="flex justify-center"><ElisLogo size="sm" /></div>
      </div>
    </div>
  );
}
