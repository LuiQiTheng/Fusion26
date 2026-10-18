import React, { useId } from 'react';
import { Info, RotateCcw } from 'lucide-react';
import { DEMO_USERS, getDemoUser, isKnownUserId } from './demoUsers';
import { ME_ID } from './friendsTypes';

interface DemoIdentityBarProps {
  // The identity currently being acted as. The parent owns this value and must not save it.
  actingAsId: string;
  onChange: (identityId: string) => void;
  // Optional: the real Profile's display name, shown as "You (name)".
  meDisplayName?: string;
  disabled?: boolean;
}

const FOCUS =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#087E83]';

export const DemoIdentityBar: React.FC<DemoIdentityBarProps> = ({
  actingAsId,
  onChange,
  meDisplayName,
  disabled = false,
}) => {
  const ids = useId();
  const selectId = `${ids}-select`;
  const hintId = `${ids}-hint`;

  // An unknown id falls back to "You" instead of showing a blank selector.
  const currentId = isKnownUserId(actingAsId) ? actingAsId : ME_ID;
  const isMe = currentId === ME_ID;

  const trimmedName = meDisplayName?.trim();
  const meLabel = trimmedName ? `You (${trimmedName})` : 'You';
  const actingName = isMe ? meLabel : (getDemoUser(currentId)?.displayName ?? meLabel);

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const next = event.target.value;
    if (isKnownUserId(next)) onChange(next);
  };

  return (
    <section
      aria-label="Demo mode"
      className="rounded-2xl border border-[#087E83]/25 border-l-4 border-l-[#B88E18] bg-[#E6F3ED] p-4 sm:p-5"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[#087E83] px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">
              Demo Mode
            </span>
            <p className="text-sm font-semibold text-[#0A2F25]">Local demonstration, not a real login</p>
          </div>
          <p id={hintId} className="flex items-start gap-2 text-sm text-[#0A2F25]/80">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#087E83]" aria-hidden="true" />
            <span>
              Choose who you are acting as to see both sides of a friend request. Your own Profile, Memories and
              Wishlist always stay yours and are not affected.
            </span>
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="space-y-1.5">
            <label htmlFor={selectId} className="block text-sm font-semibold text-[#0A2F25]">
              Acting as
            </label>
            <select
              id={selectId}
              value={currentId}
              onChange={handleChange}
              disabled={disabled}
              aria-describedby={hintId}
              className={`min-h-[44px] w-full rounded-xl border border-[#087E83]/50 bg-white px-3 py-2 text-sm text-[#0A2F25] disabled:cursor-not-allowed disabled:opacity-60 sm:w-72 ${FOCUS}`}
            >
              <option value={ME_ID}>{meLabel}</option>
              <optgroup label="Demo users">
                {DEMO_USERS.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.displayName} (@{user.username})
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          {!isMe && (
            <button
              type="button"
              onClick={() => onChange(ME_ID)}
              disabled={disabled}
              className={`inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-[#087E83] bg-white px-4 py-2 text-sm font-bold text-[#0A2F25] hover:bg-[#E6F3ED] disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer ${FOCUS}`}
            >
              <RotateCcw className="h-4 w-4 text-[#087E83]" aria-hidden="true" />
              Switch back to You
            </button>
          )}
        </div>
      </div>

      <p role="status" className="mt-3 text-sm font-semibold text-[#0A2F25]">
        {isMe
          ? 'You are acting as yourself.'
          : `You are acting as ${actingName}, a demo user. This is not a real account.`}
      </p>
    </section>
  );
};