'use client';

import { cn } from '@/lib/utils';

interface DateTimePickerProps {
  label?: string;
  value?: string;
  onChange?: (value: string) => void;
  minValue?: Date;
  className?: string;
  required?: boolean;
}

export function DateTimePicker({
  label,
  value,
  onChange,
  minValue,
  className,
  required,
}: DateTimePickerProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onChange) {
      onChange(e.target.value);
    }
  };

  // Format min date for datetime-local input (YYYY-MM-DDTHH:MM)
  const formatDateTimeLocal = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const minDateTime = minValue ? formatDateTimeLocal(minValue) : formatDateTimeLocal(new Date());

  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <label className="block text-sm font-medium text-charcoal-dark">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <input
        type="datetime-local"
        value={value || ''}
        onChange={handleChange}
        min={minDateTime}
        required={required}
        className={cn(
          'flex h-10 w-full rounded-lg border border-ivory-200 bg-white px-3 py-2 text-sm text-charcoal-dark',
          'focus:outline-none focus:ring-2 focus:ring-slate-blue focus:border-slate-blue',
          'hover:border-charcoal-light transition-colors',
          'disabled:cursor-not-allowed disabled:opacity-50',
          '[&::-webkit-calendar-picker-indicator]:cursor-pointer',
          '[&::-webkit-calendar-picker-indicator]:opacity-60',
          '[&::-webkit-calendar-picker-indicator]:hover:opacity-100'
        )}
      />
    </div>
  );
}
