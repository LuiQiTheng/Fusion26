
import React, { useEffect, useId, useRef, useState } from 'react';
import { Plus, X, Save, RefreshCw, AlertTriangle } from 'lucide-react';
import { LIMITS, PRESET_AVATAR_IDS, PRESET_INTERESTS, UserProfile } from '../types';
import { ProfileInput, updateProfile, validateProfileInput } from '../profileRepository';
import { AVATAR_LABELS, ProfileAvatar } from '../components/ProfileAvatar';

interface EditProfilePageProps {
  profile: UserProfile;
  // Called after a successful save. The parent shows the success toast and returns to Overview.
  onSaved: (profile: UserProfile) => void;
  // Called when the user presses Cancel. The parent decides whether to ask about unsaved changes.
  onCancel: () => void;
  // Lets the parent guard navigation while the form has unsaved changes.
  onDirtyChange: (dirty: boolean) => void;
}

const FOCUS =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#087E83]';
const CARD = 'rounded-2xl border border-[#087E83]/20 bg-white p-5 shadow-sm sm:p-6';
const INPUT =
  'min-h-[44px] w-full rounded-xl border bg-white px-4 py-2 text-sm text-[#0A2F25] placeholder:text-[#0A2F25]/50';

type TextField = 'displayName' | 'username' | 'bio';

function sameList(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((item, index) => item === b[index]);
}

export const EditProfilePage: React.FC<EditProfilePageProps> = ({
  profile,
  onSaved,
  onCancel,
  onDirtyChange,
}) => {
  const [displayName, setDisplayName] = useState(profile.displayName);
  const [username, setUsername] = useState(profile.username);
  const [bio, setBio] = useState(profile.bio);
  const [interests, setInterests] = useState<string[]>(profile.interests);
  const [avatarId, setAvatarId] = useState(profile.avatarId);

  const [customInterest, setCustomInterest] = useState('');
  const [interestNote, setInterestNote] = useState<string | null>(null);
  const [touched, setTouched] = useState<Partial<Record<TextField, boolean>>>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const displayNameRef = useRef<HTMLInputElement>(null);
  const usernameRef = useRef<HTMLInputElement>(null);
  const bioRef = useRef<HTMLTextAreaElement>(null);

  const ids = useId();
  const displayNameId = `${ids}-display-name`;
  const usernameId = `${ids}-username`;
  const bioId = `${ids}-bio`;
  const interestInputId = `${ids}-interest`;

  const input: ProfileInput = { displayName, username, bio, interests, avatarId };
  const errors = validateProfileInput(input);

  // ---------- Unsaved-change tracking ----------

  const isDirty =
    displayName !== profile.displayName ||
    username !== profile.username ||
    bio !== profile.bio ||
    avatarId !== profile.avatarId ||
    !sameList(interests, profile.interests);

  const onDirtyChangeRef = useRef(onDirtyChange);
  useEffect(() => {
    onDirtyChangeRef.current = onDirtyChange;
  });

  useEffect(() => {
    onDirtyChangeRef.current(isDirty);
  }, [isDirty]);

  // When this page closes, the parent should no longer treat the form as dirty.
  useEffect(() => {
    return () => onDirtyChangeRef.current(false);
  }, []);

  // Browser-level warning for refresh or closing the tab while changes are unsaved.
  useEffect(() => {
    if (!isDirty) return;
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  // ---------- Interests ----------

  // Returns true when the interest was added.
  const addInterest = (raw: string): boolean => {
    const label = raw.trim();
    if (!label) {
      setInterestNote('Type an interest first.');
      return false;
    }
    if (label.length > LIMITS.INTEREST_LABEL_MAX) {
      setInterestNote(`Each interest can be at most ${LIMITS.INTEREST_LABEL_MAX} characters.`);
      return false;
    }
    if (interests.some((item) => item.toLowerCase() === label.toLowerCase())) {
      setInterestNote(`"${label}" is already in your interests.`);
      return false;
    }
    if (interests.length >= LIMITS.INTERESTS_MAX) {
      setInterestNote(`You can choose at most ${LIMITS.INTERESTS_MAX} interests. Remove one first.`);
      return false;
    }
    setInterests([...interests, label]);
    setInterestNote(null);
    return true;
  };

  const handleAddCustom = () => {
    if (addInterest(customInterest)) setCustomInterest('');
  };

  const removeInterest = (index: number) => {
    setInterests(interests.filter((_, position) => position !== index));
    setInterestNote(null);
  };

  const suggestions = PRESET_INTERESTS.filter(
    (preset) => !interests.some((item) => item.toLowerCase() === preset.toLowerCase()),
  );

  // ---------- Saving ----------

  const handleSave = () => {
    setSubmitAttempted(true);
    setSaveError(null);

    const found = validateProfileInput(input);
    if (Object.keys(found).length > 0) {
      if (found.displayName) displayNameRef.current?.focus();
      else if (found.username) usernameRef.current?.focus();
      else if (found.bio) bioRef.current?.focus();
      return;
    }

    const result = updateProfile(input);
    if (result.ok) {
      onSaved(result.value);
    } else {
      // Keep everything the user typed and offer Retry.
      setSaveError(result.error);
    }
  };

  const showError = (field: TextField): string | undefined =>
    submitAttempted || touched[field] ? errors[field] : undefined;

  const markTouched = (field: TextField) => setTouched((current) => ({ ...current, [field]: true }));

  const displayNameError = showError('displayName');
  const usernameError = showError('username');
  const bioError = showError('bio');
  const interestsMessage = interestNote ?? (submitAttempted ? errors.interests : undefined);
  const bioIsOver = bio.length > LIMITS.BIO_MAX;

  const fieldBorder = (hasError: boolean) =>
    hasError ? 'border-red-400' : 'border-[#087E83]/30 focus:border-[#087E83]';

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        handleSave();
      }}
      className="space-y-6"
    >
      <h1 className="font-serif text-2xl font-bold text-[#0A2F25] sm:text-3xl">Edit Profile</h1>

      {saveError && (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-[#0A2F25] sm:flex-row sm:items-center sm:justify-between"
        >
          <p className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-700" aria-hidden="true" />
            <span>Your changes were not saved. {saveError} Everything you typed is still here.</span>
          </p>
          <button
            type="button"
            onClick={handleSave}
            className={`inline-flex min-h-[44px] shrink-0 items-center justify-center gap-2 rounded-lg border border-red-300 px-4 py-2 font-semibold hover:bg-red-100 cursor-pointer ${FOCUS}`}
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Retry
          </button>
        </div>
      )}

      {/* Avatar */}
      <fieldset className={CARD}>
        <legend className="px-2 font-serif text-lg font-bold text-[#0A2F25]">Avatar</legend>
        <p className="mb-4 text-xs text-[#0A2F25]/65">Choose one of the preset avatars.</p>
        <div role="radiogroup" aria-label="Avatar" className="flex flex-wrap gap-3">
          {PRESET_AVATAR_IDS.map((id) => (
            <label key={id} className="relative cursor-pointer">
              <input
                type="radio"
                name={`${ids}-avatar`}
                value={id}
                checked={avatarId === id}
                onChange={() => setAvatarId(id)}
                className="peer sr-only"
              />
              <span className="block rounded-full border-2 border-transparent p-1 transition-all hover:border-[#087E83]/30 peer-checked:border-[#087E83] peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[#087E83]">
                <ProfileAvatar avatarId={id} size="lg" label={AVATAR_LABELS[id]} />
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {/* Basic details */}
      <section aria-label="Basic details" className={`${CARD} space-y-5`}>
        <div className="space-y-1.5">
          <label htmlFor={displayNameId} className="block text-sm font-semibold text-[#0A2F25]">
            Display name <span className="text-[#087E83]">*</span>
          </label>
          <input
            ref={displayNameRef}
            id={displayNameId}
            type="text"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            onBlur={() => markTouched('displayName')}
            aria-required="true"
            aria-invalid={displayNameError ? true : undefined}
            aria-describedby={displayNameError ? `${displayNameId}-error` : undefined}
            autoComplete="off"
            className={`${INPUT} ${fieldBorder(Boolean(displayNameError))} ${FOCUS}`}
          />
          {displayNameError && (
            <p id={`${displayNameId}-error`} className="text-xs text-red-700">
              {displayNameError}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <label htmlFor={usernameId} className="block text-sm font-semibold text-[#0A2F25]">
            Username
          </label>
          <div className="relative">
            <span
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-[#0A2F25]/60"
              aria-hidden="true"
            >
              @
            </span>
            <input
              ref={usernameRef}
              id={usernameId}
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              onBlur={() => markTouched('username')}
              aria-invalid={usernameError ? true : undefined}
              aria-describedby={`${usernameId}-hint${usernameError ? ` ${usernameId}-error` : ''}`}
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              className={`${INPUT} pl-8 ${fieldBorder(Boolean(usernameError))} ${FOCUS}`}
            />
          </div>
          <p id={`${usernameId}-hint`} className="text-xs text-[#0A2F25]/60">
            {LIMITS.USERNAME_MIN}-{LIMITS.USERNAME_MAX} characters: English letters, numbers or underscores.
          </p>
          {usernameError && (
            <p id={`${usernameId}-error`} className="text-xs text-red-700">
              {usernameError}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <label htmlFor={bioId} className="block text-sm font-semibold text-[#0A2F25]">
            Bio
          </label>
          <textarea
            ref={bioRef}
            id={bioId}
            rows={4}
            value={bio}
            onChange={(event) => setBio(event.target.value)}
            onBlur={() => markTouched('bio')}
            aria-invalid={bioError ? true : undefined}
            aria-describedby={`${bioId}-count${bioError ? ` ${bioId}-error` : ''}`}
            className={`${INPUT} resize-y ${fieldBorder(Boolean(bioError))} ${FOCUS}`}
          />
          <div className="flex items-start justify-between gap-3">
            <p id={`${bioId}-error`} className="text-xs text-red-700">
              {bioError}
            </p>
            <p
              id={`${bioId}-count`}
              className={`ml-auto shrink-0 text-xs ${bioIsOver ? 'font-semibold text-red-700' : 'text-[#0A2F25]/60'}`}
            >
              {bio.length}/{LIMITS.BIO_MAX}
            </p>
          </div>
        </div>
      </section>

      {/* Travel interests */}
      <section aria-labelledby={`${ids}-interests-heading`} className={`${CARD} space-y-4`}>
        <div className="flex items-baseline justify-between gap-3">
          <h2 id={`${ids}-interests-heading`} className="font-serif text-lg font-bold text-[#0A2F25]">
            Travel interests
          </h2>
          <p className="text-xs text-[#0A2F25]/65" aria-live="polite">
            {interests.length}/{LIMITS.INTERESTS_MAX} selected
          </p>
        </div>

        {interests.length === 0 ? (
          <p className="text-sm italic text-[#0A2F25]/60">No interests selected.</p>
        ) : (
          <ul aria-label="Your interests" className="flex flex-wrap gap-2">
            {interests.map((interest, index) => (
              <li
                key={interest.toLowerCase()}
                className="inline-flex items-center gap-1 rounded-full border border-[#087E83]/25 bg-[#E6F3ED] py-1 pl-3 pr-1 text-xs font-semibold text-[#0A2F25]"
              >
                {interest}
                <button
                  type="button"
                  onClick={() => removeInterest(index)}
                  aria-label={`Remove ${interest}`}
                  className={`flex h-8 w-8 items-center justify-center rounded-full hover:bg-[#E6F3ED] cursor-pointer ${FOCUS}`}
                >
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )}

        {suggestions.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-[#0A2F25]/65">Suggestions</p>
            <ul className="flex flex-wrap gap-2">
              {suggestions.map((preset) => (
                <li key={preset}>
                  <button
                    type="button"
                    onClick={() => addInterest(preset)}
                    className={`inline-flex min-h-[44px] items-center gap-1 rounded-full border border-[#087E83]/25 px-4 py-1 text-xs font-semibold text-[#0A2F25]/85 hover:border-[#087E83]/50 hover:text-[#0A2F25] cursor-pointer ${FOCUS}`}
                  >
                    <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                    {preset}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="space-y-1.5">
          <label htmlFor={interestInputId} className="block text-sm font-semibold text-[#0A2F25]">
            Add your own
          </label>
          <div className="flex gap-2">
            <input
              id={interestInputId}
              type="text"
              value={customInterest}
              onChange={(event) => {
                setCustomInterest(event.target.value);
                setInterestNote(null);
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  handleAddCustom();
                }
              }}
              aria-invalid={interestsMessage ? true : undefined}
              aria-describedby={interestsMessage ? `${interestInputId}-error` : undefined}
              autoComplete="off"
              className={`${INPUT} ${fieldBorder(Boolean(interestsMessage))} ${FOCUS}`}
            />
            <button
              type="button"
              onClick={handleAddCustom}
              className={`inline-flex min-h-[44px] shrink-0 items-center gap-1 rounded-xl border border-[#087E83]/30 px-4 text-sm font-bold text-[#0A2F25] hover:border-[#087E83] cursor-pointer ${FOCUS}`}
            >
              <Plus className="h-4 w-4 text-[#087E83]" aria-hidden="true" />
              Add
            </button>
          </div>
          {interestsMessage && (
            <p id={`${interestInputId}-error`} role="alert" className="text-xs text-red-700">
              {interestsMessage}
            </p>
          )}
        </div>
      </section>

      {/* Actions */}
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onCancel}
          className={`min-h-[44px] rounded-xl border border-[#087E83]/30 px-6 py-2 text-sm font-bold text-[#0A2F25] hover:border-[#087E83] cursor-pointer ${FOCUS}`}
        >
          Cancel
        </button>
        <button
          type="submit"
          className={`inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-[#087E83] px-6 py-2 text-sm font-bold text-white hover:bg-[#0A2F25] cursor-pointer ${FOCUS}`}
        >
          <Save className="h-4 w-4" aria-hidden="true" />
          Save Changes
        </button>
      </div>
    </form>
  );
};
