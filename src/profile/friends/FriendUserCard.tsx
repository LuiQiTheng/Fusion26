import React, { useId } from 'react';
import { Check, Clock, Plus, Trash2, User, X } from 'lucide-react';
import { ProfileAvatar } from '../components/ProfileAvatar';
import { isDemoUserId } from './demoUsers';
import { DemoUser, ME_ID, RelationshipStatus } from './friendsTypes';

// What the card needs to show a person. A DemoUser fits as it is. For the real Profile the parent
// builds one with id ME_ID and the profile's display name, username, bio, interests and avatar.
export type FriendCardUser = Pick<
  DemoUser,
  'id' | 'displayName' | 'username' | 'bio' | 'interests' | 'avatarId'
>;

// The action currently running, so its button can show a working label.
export type FriendCardAction = 'add' | 'cancel' | 'accept' | 'reject' | 'remove';

interface FriendUserCardProps {
  viewerId: string; // the identity being acted as
  user: FriendCardUser; // the person this card shows
  status: RelationshipStatus; // how that person relates to the viewer
  // A button is only shown when its callback is given, so no button is ever a dead end.
  // The card never changes any data itself: the parent calls the repository.
  onAddFriend?: () => void;
  onCancelRequest?: () => void;
  onAcceptRequest?: () => void;
  onRejectRequest?: () => void;
  onViewProfile?: () => void;
  // The parent should ask for confirmation before it removes the friend.
  onRemoveFriend?: () => void;
  pendingAction?: FriendCardAction | null; // disables all buttons and labels the running one
  disabled?: boolean;
}

const FOCUS =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#087E83]';

const WORKING_LABELS: Record<FriendCardAction, string> = {
  add: 'Sending...',
  cancel: 'Cancelling...',
  accept: 'Accepting...',
  reject: 'Rejecting...',
  remove: 'Removing...',
};

const VARIANT_CLASSES = {
  primary: 'bg-[#087E83] text-white hover:bg-[#066468]',
  secondary: 'border border-[#087E83] bg-white text-[#0A2F25] hover:bg-[#E6F3ED]',
  danger: 'border border-red-700/50 bg-white text-red-800 hover:bg-red-50',
} as const;

interface ActionButtonProps {
  variant: keyof typeof VARIANT_CLASSES;
  icon: React.ReactNode;
  label: string;
  workingLabel?: string;
  personName: string; // read out after the label, so each button names its person
  onClick: () => void;
  isWorking: boolean; // this button's own action is running
  disabled: boolean;
}

const ActionButton: React.FC<ActionButtonProps> = ({
  variant,
  icon,
  label,
  workingLabel,
  personName,
  onClick,
  isWorking,
  disabled,
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    aria-busy={isWorking || undefined}
    className={`inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer ${VARIANT_CLASSES[variant]} ${FOCUS}`}
  >
    {icon}
    {isWorking && workingLabel ? workingLabel : label}
    <span className="sr-only">: {personName}</span>
  </button>
);

const STATUS_TEXT: Partial<Record<RelationshipStatus, string>> = {
  outgoing: 'Request Sent',
  incoming: 'Sent you a request',
  friends: 'Friends',
};

const STATUS_ICONS: Partial<Record<RelationshipStatus, React.ReactNode>> = {
  outgoing: <Clock className="h-3.5 w-3.5" aria-hidden="true" />,
  incoming: <User className="h-3.5 w-3.5" aria-hidden="true" />,
  friends: <Check className="h-3.5 w-3.5" aria-hidden="true" />,
};

export const FriendUserCard: React.FC<FriendUserCardProps> = ({
  viewerId,
  user,
  status,
  onAddFriend,
  onCancelRequest,
  onAcceptRequest,
  onRejectRequest,
  onViewProfile,
  onRemoveFriend,
  pendingAction = null,
  disabled = false,
}) => {
  const nameId = useId();

  // A card for the viewer themselves can never offer Add Friend, whatever status the parent passed.
  const effectiveStatus: RelationshipStatus = user.id === viewerId ? 'self' : status;

  const identityBadge =
    effectiveStatus === 'self'
      ? 'This is you'
      : isDemoUserId(user.id)
        ? 'Demo user'
        : user.id === ME_ID
          ? 'Your profile'
          : null;
  const statusText = STATUS_TEXT[effectiveStatus];

  const locked = disabled || pendingAction !== null;
  const name = user.displayName;

  return (
    <article
      aria-labelledby={nameId}
      className="flex h-full flex-col gap-4 rounded-2xl border border-[#087E83]/20 bg-white p-4 shadow-sm sm:p-5"
    >
      <div className="flex items-start gap-4">
        <ProfileAvatar avatarId={user.avatarId} size="md" label={`Avatar of ${name}`} />

        <div className="min-w-0 flex-1 space-y-2">
          <div className="space-y-0.5">
            <h3 id={nameId} className="break-words font-semibold text-[#0A2F25]">
              {name}
            </h3>
            <p className="break-all text-sm text-[#087E83]">@{user.username}</p>
          </div>

          {(identityBadge || statusText) && (
            <div className="flex flex-wrap items-center gap-2">
              {identityBadge && (
                <span className="rounded-full bg-[#E6F3ED] px-2.5 py-0.5 text-xs font-semibold text-[#0A2F25]">
                  {identityBadge}
                </span>
              )}
              {statusText && (
                <span className="inline-flex items-center gap-1 rounded-full border border-[#087E83]/40 bg-white px-2.5 py-0.5 text-xs font-semibold text-[#0A2F25]">
                  {STATUS_ICONS[effectiveStatus]}
                  {statusText}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {user.bio ? (
        <p className="line-clamp-3 break-words text-sm text-[#0A2F25]/85">{user.bio}</p>
      ) : (
        <p className="text-sm italic text-[#0A2F25]/60">No bio yet.</p>
      )}

      {user.interests.length > 0 && (
        <ul aria-label={`Interests of ${name}`} className="flex flex-wrap gap-2">
          {user.interests.map((interest) => (
            <li
              key={interest}
              className="rounded-full border border-[#087E83]/25 bg-[#E6F3ED] px-3 py-1 text-xs font-semibold text-[#0A2F25]"
            >
              {interest}
            </li>
          ))}
        </ul>
      )}

      {/* The actions row hides itself when no action applies (it is empty). */}
      <div className="mt-auto flex flex-wrap gap-2 empty:hidden">
        {effectiveStatus === 'none' && onAddFriend && (
          <ActionButton
            variant="primary"
            icon={<Plus className="h-4 w-4" aria-hidden="true" />}
            label="Add Friend"
            workingLabel={WORKING_LABELS.add}
            personName={name}
            onClick={onAddFriend}
            isWorking={pendingAction === 'add'}
            disabled={locked}
          />
        )}

        {effectiveStatus === 'outgoing' && onCancelRequest && (
          <ActionButton
            variant="secondary"
            icon={<X className="h-4 w-4 text-[#087E83]" aria-hidden="true" />}
            label="Cancel Request"
            workingLabel={WORKING_LABELS.cancel}
            personName={name}
            onClick={onCancelRequest}
            isWorking={pendingAction === 'cancel'}
            disabled={locked}
          />
        )}

        {effectiveStatus === 'incoming' && onAcceptRequest && (
          <ActionButton
            variant="primary"
            icon={<Check className="h-4 w-4" aria-hidden="true" />}
            label="Accept Request"
            workingLabel={WORKING_LABELS.accept}
            personName={name}
            onClick={onAcceptRequest}
            isWorking={pendingAction === 'accept'}
            disabled={locked}
          />
        )}
        {effectiveStatus === 'incoming' && onRejectRequest && (
          <ActionButton
            variant="danger"
            icon={<X className="h-4 w-4" aria-hidden="true" />}
            label="Reject"
            workingLabel={WORKING_LABELS.reject}
            personName={name}
            onClick={onRejectRequest}
            isWorking={pendingAction === 'reject'}
            disabled={locked}
          />
        )}

        {effectiveStatus === 'friends' && onViewProfile && (
          <ActionButton
            variant="primary"
            icon={<User className="h-4 w-4" aria-hidden="true" />}
            label="View Profile"
            personName={name}
            onClick={onViewProfile}
            isWorking={false}
            disabled={locked}
          />
        )}
        {effectiveStatus === 'friends' && onRemoveFriend && (
          <ActionButton
            variant="danger"
            icon={<Trash2 className="h-4 w-4" aria-hidden="true" />}
            label="Remove Friend"
            workingLabel={WORKING_LABELS.remove}
            personName={name}
            onClick={onRemoveFriend}
            isWorking={pendingAction === 'remove'}
            disabled={locked}
          />
        )}
      </div>
    </article>
  );
};