import React, { useState } from 'react';
import { Mail, Lock } from 'lucide-react';
import { TextField, PasswordField, CheckboxField } from './FormField';
import { DemoNotice } from './DemoNotice';
import { SubmitButton } from './SubmitButton';
import { useDemoSubmit, focusFirstInvalid } from './useDemoSubmit';
import { DEMO_MESSAGE, validateEmail, validateLoginPassword } from '../../lib/authValidation';

interface LoginFormProps {
  onSwitchToSignUp: () => void;
}

type Errors = { email?: string; password?: string };

export const LoginForm: React.FC<LoginFormProps> = ({ onSwitchToSignUp }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false); // UI only: never persisted
  const [errors, setErrors] = useState<Errors>({});
  const { submitting, notice, setNotice, run } = useDemoSubmit();

  const check = (field: keyof Errors, e = email, p = password) => {
    const msg = field === 'email' ? validateEmail(e) : validateLoginPassword(p);
    setErrors((prev) => ({ ...prev, [field]: msg }));
    return msg;
  };

  const handleSubmit = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (submitting) return;
    const next: Errors = { email: validateEmail(email), password: validateLoginPassword(password) };
    setErrors(next);
    if (next.email || next.password) {
      setNotice(null);
      focusFirstInvalid([next.email ? 'login-email' : '', next.password ? 'login-password' : '']);
      return;
    }
    run(DEMO_MESSAGE, () => setPassword(''));
  };

  return (
    <div>
      <h1 className="font-serif text-2xl sm:text-3xl font-bold text-deep-teal">Welcome Back, Explorer</h1>
      <p className="mt-2 text-sm text-slate-600 leading-relaxed">
        Sign in to pick up your saved trips, favourite places and cultural missions.
      </p>

      <form onSubmit={handleSubmit} noValidate className="mt-7 space-y-5">
        <TextField
          id="login-email"
          label="Email"
          type="email"
          value={email}
          onChange={(v) => {
            setEmail(v);
            if (errors.email) check('email', v);
          }}
          onBlur={() => email && check('email')}
          error={errors.email}
          placeholder="you@example.com"
          autoComplete="email"
          icon={<Mail className="w-4 h-4" />}
          disabled={submitting}
        />

        <PasswordField
          id="login-password"
          label="Password"
          value={password}
          onChange={(v) => {
            setPassword(v);
            if (errors.password) check('password', email, v);
          }}
          error={errors.password}
          placeholder="Enter your password"
          autoComplete="current-password"
          icon={<Lock className="w-4 h-4" />}
          disabled={submitting}
          labelAside={
            <button
              type="button"
              onClick={() => setNotice('Demo only — password reset is not connected yet. No email has been sent.')}
              className="rounded text-sm font-semibold text-tropical-teal hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tropical-teal/40"
            >
              Forgot password?
            </button>
          }
        />

        <CheckboxField id="login-remember" checked={remember} onChange={setRemember} disabled={submitting}>
          Remember me
        </CheckboxField>

        <DemoNotice message={notice} />

        <SubmitButton loading={submitting} label="Sign In" loadingLabel="Signing in…" />
      </form>

      <p className="mt-6 text-center text-sm text-slate-600">
        New to Malaysia Heritage Explorer?{' '}
        <button
          type="button"
          onClick={onSwitchToSignUp}
          className="rounded font-bold text-tropical-teal hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tropical-teal/40"
        >
          Create an account
        </button>
      </p>
    </div>
  );
};
