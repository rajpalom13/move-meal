'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface InputOTPProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

export function InputOTP({
  length = 6,
  value,
  onChange,
  disabled = false,
  className,
}: InputOTPProps) {
  const inputRefs = React.useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;

    // Only allow single digits
    if (!/^\d*$/.test(val)) return;

    const newValue = value.split('');
    newValue[index] = val.slice(-1);
    const joined = newValue.join('');
    onChange(joined);

    // Move to next input if value entered
    if (val && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !value[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    onChange(pastedData);

    // Focus the appropriate input after paste
    const focusIndex = Math.min(pastedData.length, length - 1);
    inputRefs.current[focusIndex]?.focus();
  };

  return (
    <div className={cn('flex gap-2 justify-center', className)}>
      {Array.from({ length }).map((_, index) => (
        <input
          key={index}
          ref={(el) => { inputRefs.current[index] = el; }}
          type="text"
          inputMode="numeric"
          pattern="\d*"
          maxLength={1}
          value={value[index] || ''}
          onChange={(e) => handleChange(index, e)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          disabled={disabled}
          className={cn(
            'h-12 w-12 text-center text-xl font-semibold rounded-xl border-2 border-ivory-200',
            'focus:border-slate-blue focus:ring-2 focus:ring-slate-blue/20 focus:outline-none',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'transition-all duration-200',
            value[index] ? 'border-slate-blue bg-slate-blue-50' : 'bg-white'
          )}
        />
      ))}
    </div>
  );
}
