import React, { useState } from 'react';
import { Mail, Lock, User } from 'lucide-react';
import { TextField, PasswordField, CheckboxField } from './FormField';
import { DemoNotice } from './DemoNotice';
import { SubmitButton } from './SubmitButton';
import { useDemoSubmit, focusFirstInvalid } from './useDemoSubmit';
import {
  DEMO_MESSAGE,
  MIN_PASSWORD_LENGTH,
  validateConfirmPassword,
  validateEmail,
  validateFullName,
  validateNewPassword,
  validateTerms,
} from '../../lib/authValidation';

interface SignUpFormProps {
  onSwitchToLogin: () => void;
}

interface Values {
  name: string;
  email: string;
  password: string;
  confirm: string;
  terms: boolean;
}
type Errors = Partial<Record<keyof Values, string>>;

const validateAll = (v: Values): Errors => ({
  name: validateFullName(v.name),
  email: validateEmail(v.email),
  password: validateNewPassword(v.password),
  confirm: validateConfirmPassword(v.password, v.confirm),
  terms: validateTerms(v.terms),
});

const FIELD_IDS: Record<keyof Values, string> = {
  name: 'signup-name',
  email: 'signup-email',
  password: 'signup-password',
  confirm: 'signup-confirm',
  terms: 'signup-terms',
};

export const SignUpForm: React.FC<SignUpFormProps> = ({ onSwitchToLogin }) => {
  const [values, setValues] = useState<Values>({ name: '', email: '', password: '', confirm: '', terms: false });
  const [errors, setErrors] = useState<Errors>({});
  const [submitted, setSubmitted] = useState(false);
  const { submitting, notice, setNotice, run } = useDemoSubmit();

  // After the first submit attempt, re-validate everything live so messages clear as the user fixes them.
  const update = <K extends keyof Values>(key: K, value: Values[K]) => {
    const next = { ...values, [key]: value };
    setValues(next);
    if (submitted) setErrors(validateAll(next));
  };

  const handleSubmit = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (submitting) return;
    setSubmitted(true);
    const next = validateAll(values);
    setErrors(next);
    const invalid = (Object.keys(FIELD_IDS) as (keyof Values)[]).filter((k) => next[k]);
    if (invalid.length > 0) {
      setNotice(null);
      focusFirstInvalid(invalid.map((k) => FIELD_IDS[k]));
      return;
    }
    run(DEMO_MESSAGE, () => setValues((v) => ({ ...v, password: '', confirm: '' })));
  };

  return (
    <div>
      <h1 className="font-serif text-2xl sm:text-3xl font-bold text-deep-teal">
        Start Your Malaysian Heritage Journey
      </h1>
      <p className="mt-2 text-sm text-slate-600 leading-relaxed">
        Create an account to keep your trips, favourite places and mission progress together.
      </p>

      <form onSubmit={handleSubmit} noValidate className="mt-7 space-y-5">
        <TextField
          id={FIELD_IDS.name}
          label="Full name"
          value={values.name}
          onChange={(v) => update('name', v)}
          error={errors.name}
          placeholder="e.g. Aisyah Rahman"
          autoComplete="name"
          icon={<User className="w-4 h-4" />}
          disabled={submitting}
        />

        <TextField
          id={FIELD_IDS.email}
          label="Email"
          type="email"
          value={values.email}
          onChange={(v) => update('email', v)}
          error={errors.email}
          placeholder="you@example.com"
          autoComplete="email"
          icon={<Mail className="w-4 h-4" />}
          disabled={submitting}
        />

        <PasswordField
          id={FIELD_IDS.password}
          label="Password"
          value={values.password}
          onChange={(v) => update('password', v)}
          error={errors.password}
          hint={`At least ${MIN_PASSWORD_LENGTH} characters.`}
          placeholder="Create a password"
          autoComplete="new-password"
          icon={<Lock className="w-4 h-4" />}
          disabled={submitting}
        />

        <PasswordField
          id={FIELD_IDS.confirm}
          label="Confirm password"
          value={values.confirm}
          onChange={(v) => update('confirm', v)}
          error={errors.confirm}
          placeholder="Re-enter your password"
          autoComplete="new-password"
          icon={<Lock className="w-4 h-4" />}
          disabled={submitting}
        />

        <CheckboxField
          id={FIELD_IDS.terms}
          checked={values.terms}
          onChange={(c) => update('terms', c)}
          error={errors.terms}
          disabled={submitting}
        >
          I agree to the <span className="font-semibold text-deep-teal">Terms and Conditions</span>
        </CheckboxField>

        <DemoNotice message={notice} />

        <SubmitButton loading={submitting} label="Create Account" loadingLabel="Creating account…" />
      </form>

      <p className="mt-6 text-center text-sm text-slate-600">
        Already have an account?{' '}
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="rounded font-bold text-tropical-teal hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tropical-teal/40"
        >
          Back to Sign In
        </button>
      </p>
    </div>
  );
};
