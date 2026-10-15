import React from 'react';
import { AuthLayout } from '../components/auth/AuthLayout';
import { LoginForm } from '../components/auth/LoginForm';
import { SignUpForm } from '../components/auth/SignUpForm';

export type AuthView = 'login' | 'signup';

interface AuthPageProps {
  view: AuthView;
  onViewChange: (view: AuthView) => void;
  onBack: () => void;
}

/**
 * Frontend-only Login / Sign Up prototype. No authentication provider is connected;
 * forms validate on the client and show a demo-only message on submit.
 */
export const AuthPage: React.FC<AuthPageProps> = ({ view, onViewChange, onBack }) => (
  <AuthLayout onBack={onBack}>
    {/* key resets form state when switching between views */}
    {view === 'login' ? (
      <LoginForm key="login" onSwitchToSignUp={() => onViewChange('signup')} />
    ) : (
      <SignUpForm key="signup" onSwitchToLogin={() => onViewChange('login')} />
    )}
  </AuthLayout>
);

export default AuthPage;
