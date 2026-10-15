import React, { useState } from 'react';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';

interface BaseFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string;
  hint?: string;
  placeholder?: string;
  autoComplete?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

const inputClasses = (hasError: boolean, hasIcon: boolean, extraRight: boolean) =>
  [
    'w-full rounded-xl border bg-white py-3 text-sm text-deep-teal placeholder:text-slate-400',
    'transition-colors outline-none disabled:opacity-60 disabled:cursor-not-allowed',
    'focus-visible:ring-2 focus-visible:ring-offset-1',
    hasIcon ? 'pl-11' : 'pl-4',
    extraRight ? 'pr-12' : 'pr-4',
    hasError
      ? 'border-red-600 focus-visible:ring-red-600/40'
      : 'border-slate-300 hover:border-tropical-teal/60 focus-visible:border-tropical-teal focus-visible:ring-tropical-teal/40',
  ].join(' ');

const FieldShell: React.FC<{
  id: string;
  label: string;
  error?: string;
  hint?: string;
  labelAside?: React.ReactNode;
  children: React.ReactNode;
}> = ({ id, label, error, hint, labelAside, children }) => (
  <div>
    <div className="flex items-center justify-between mb-1.5">
      <label htmlFor={id} className="block text-sm font-semibold text-deep-teal">
        {label}
      </label>
      {labelAside}
    </div>
    {children}
    {error ? (
      <p id={`${id}-error`} role="alert" className="mt-1.5 flex items-start gap-1.5 text-sm text-red-700">
        <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
        <span>{error}</span>
      </p>
    ) : hint ? (
      <p id={`${id}-hint`} className="mt-1.5 text-xs text-slate-500">
        {hint}
      </p>
    ) : null}
  </div>
);

const describedBy = (id: string, error?: string, hint?: string) =>
  error ? `${id}-error` : hint ? `${id}-hint` : undefined;

export const TextField: React.FC<BaseFieldProps & { type?: 'text' | 'email' }> = ({
  id,
  label,
  value,
  onChange,
  onBlur,
  error,
  hint,
  placeholder,
  autoComplete,
  icon,
  disabled,
  type = 'text',
}) => (
  <FieldShell id={id} label={label} error={error} hint={hint}>
    <div className="relative">
      {icon && (
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-tropical-teal" aria-hidden="true">
          {icon}
        </span>
      )}
      <input
        id={id}
        name={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        autoComplete={autoComplete}
        disabled={disabled}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, error, hint)}
        className={inputClasses(Boolean(error), Boolean(icon), false)}
      />
    </div>
  </FieldShell>
);

export const PasswordField: React.FC<BaseFieldProps & { labelAside?: React.ReactNode }> = ({
  id,
  label,
  value,
  onChange,
  onBlur,
  error,
  hint,
  placeholder,
  autoComplete,
  icon,
  disabled,
  labelAside,
}) => {
  const [visible, setVisible] = useState(false);
  return (
    <FieldShell id={id} label={label} error={error} hint={hint} labelAside={labelAside}>
      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-tropical-teal" aria-hidden="true">
            {icon}
          </span>
        )}
        <input
          id={id}
          name={id}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          placeholder={placeholder}
          autoComplete={autoComplete}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(id, error, hint)}
          className={inputClasses(Boolean(error), Boolean(icon), true)}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          disabled={disabled}
          aria-pressed={visible}
          aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg text-slate-500 hover:text-tropical-teal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tropical-teal/40 disabled:opacity-60"
        >
          {visible ? <EyeOff className="w-4 h-4" aria-hidden="true" /> : <Eye className="w-4 h-4" aria-hidden="true" />}
        </button>
      </div>
    </FieldShell>
  );
};

export const CheckboxField: React.FC<{
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  error?: string;
  disabled?: boolean;
  children: React.ReactNode;
}> = ({ id, checked, onChange, error, disabled, children }) => (
  <div>
    <div className="flex items-start gap-3">
      <input
        id={id}
        name={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 accent-tropical-teal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tropical-teal"
      />
      <label htmlFor={id} className="text-sm text-slate-600 leading-snug">
        {children}
      </label>
    </div>
    {error && (
      <p id={`${id}-error`} role="alert" className="mt-1.5 flex items-start gap-1.5 text-sm text-red-700">
        <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
        <span>{error}</span>
      </p>
    )}
  </div>
);
