export const MIN_PASSWORD_LENGTH = 8;

// Pragmatic client-side format check only; a real backend must validate again.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validateFullName(value: string): string | undefined {
  if (!value.trim()) return 'Please tell us your name.';
  return undefined;
}

export function validateEmail(value: string): string | undefined {
  const email = value.trim();
  if (!email) return 'Please enter your email address.';
  if (!EMAIL_PATTERN.test(email)) return 'That email doesn’t look right. Try something like name@example.com.';
  return undefined;
}

export function validateLoginPassword(value: string): string | undefined {
  if (!value) return 'Please enter your password.';
  return undefined;
}

export function validateNewPassword(value: string): string | undefined {
  if (!value) return 'Please choose a password.';
  if (value.length < MIN_PASSWORD_LENGTH) {
    return `Use at least ${MIN_PASSWORD_LENGTH} characters for your password.`;
  }
  return undefined;
}

export function validateConfirmPassword(password: string, confirm: string): string | undefined {
  if (!confirm) return 'Please re-enter your password.';
  if (password !== confirm) return 'Passwords don’t match yet.';
  return undefined;
}

export function validateTerms(accepted: boolean): string | undefined {
  if (!accepted) return 'Please accept the Terms and Conditions to continue.';
  return undefined;
}

export const DEMO_MESSAGE = 'Demo only — authentication is not connected yet.';
