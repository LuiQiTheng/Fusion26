// Comments section for MemoryDetailPage.
// Permission enforcement is done in the UI layer (client-side demo, not real backend security):
//   - Viewing: only rendered when the caller already confirmed the viewer can see the memory.
//   - Adding: blocked unless canComment is true (mirrors the canCommentOnRecord rule).
//   - Deleting: blocked unless isOwner is true (memory owner can delete any comment).

import React, { useId, useRef, useState } from 'react';
import { AlertTriangle, MessageSquare, Send, Trash2 } from 'lucide-react';
import { LIMITS, MemoryComment } from '../types';
import { ProfileAvatar } from './ProfileAvatar';

interface MemoryCommentsProps {
  comments: MemoryComment[]; // comments already filtered to this record
  // The user identity currently acting (ME_ID or a demo user id).
  viewerId: string;
  viewerName: string;
  viewerAvatarId: string;
  // True when the current viewer is the memory owner (may delete any comment).
  isOwner: boolean;
  // True when the current viewer is allowed to post a new comment.
  canComment: boolean;
  // Resolver for displaying commenter names/avatars. Returns null for unknown ids.
  resolveUser: (authorId: string) => { displayName: string; avatarId: string } | null;
  onAdd: (text: string) => { ok: boolean; error?: string };
  onDelete: (commentId: string) => { ok: boolean; error?: string };
}

const FOCUS =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#087E83]';

// ISO timestamp -> "14 Mar 2025, 3:45 PM"
function formatCommentDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('en-MY', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export const MemoryComments: React.FC<MemoryCommentsProps> = ({
  comments,
  viewerId,
  viewerName,
  viewerAvatarId,
  isOwner,
  canComment,
  resolveUser,
  onAdd,
  onDelete,
}) => {
  const ids = useId();
  const inputId = `${ids}-comment-input`;
  const [draft, setDraft] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteErrors, setDeleteErrors] = useState<Record<string, string>>({});
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const trimmed = draft.trim();
  const charsOver = trimmed.length > LIMITS.COMMENT_TEXT_MAX;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!trimmed || submitting || charsOver) return;
    setSubmitting(true);
    setSubmitError(null);
    const result = onAdd(trimmed);
    setSubmitting(false);
    if (result.ok) {
      setDraft('');
      textareaRef.current?.focus();
    } else {
      setSubmitError(result.error ?? 'Could not post your comment. Please try again.');
    }
  };

  const handleDelete = (commentId: string) => {
    if (deletingId === commentId) return;
    setDeletingId(commentId);
    setDeleteErrors((prev) => {
      const next = { ...prev };
      delete next[commentId];
      return next;
    });
    const result = onDelete(commentId);
    setDeletingId(null);
    if (!result.ok) {
      setDeleteErrors((prev) => ({
        ...prev,
        [commentId]: result.error ?? 'Could not delete this comment.',
      }));
    }
  };

  // Oldest first so the conversation reads naturally.
  const sorted = [...comments].sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  return (
    <section
      aria-labelledby="memory-comments-heading"
      className="rounded-2xl border border-[#087E83]/20 bg-white shadow-sm"
    >
      <div className="p-5 sm:p-6">
        <h2
          id="memory-comments-heading"
          className="flex items-center gap-2 font-serif text-lg font-bold text-[#0A2F25]"
        >
          <MessageSquare className="h-5 w-5 text-[#087E83]" aria-hidden="true" />
          Comments
          {comments.length > 0 && (
            <span className="text-sm font-normal text-[#0A2F25]/65">({comments.length})</span>
          )}
        </h2>

        {/* Comment list */}
        {sorted.length === 0 ? (
          <p className="mt-4 text-sm italic text-[#0A2F25]/60">
            {canComment ? 'No comments yet. Be the first to add one.' : 'No comments yet.'}
          </p>
        ) : (
          <ul className="mt-4 space-y-4" aria-label="Comments">
            {sorted.map((comment) => {
              const author = resolveUser(comment.authorId);
              const displayName = author?.displayName ?? comment.authorId;
              const avatarId = author?.avatarId ?? 'avatar-1';
              const isAuthor = comment.authorId === viewerId;
              const deleteError = deleteErrors[comment.id];

              return (
                <li key={comment.id} className="flex gap-3">
                  <ProfileAvatar
                    avatarId={avatarId}
                    size="sm"
                    className="mt-0.5 shrink-0"
                    label={displayName}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                      <span className="text-sm font-semibold text-[#0A2F25]">
                        {displayName}
                        {isAuthor && (
                          <span className="ml-1.5 text-xs font-normal text-[#087E83]">(you)</span>
                        )}
                      </span>
                      <span className="text-xs text-[#0A2F25]/50">
                        {formatCommentDate(comment.createdAt)}
                      </span>
                    </div>
                    <p className="mt-0.5 whitespace-pre-line break-words text-sm text-[#0A2F25]/85">
                      {comment.text}
                    </p>
                    {deleteError && (
                      <p
                        role="alert"
                        className="mt-1 flex items-start gap-1 text-xs text-red-600"
                      >
                        <AlertTriangle
                          className="mt-0.5 h-3 w-3 shrink-0"
                          aria-hidden="true"
                        />
                        {deleteError}
                      </p>
                    )}
                    {/* Only the memory owner may delete any comment */}
                    {isOwner && (
                      <button
                        type="button"
                        onClick={() => handleDelete(comment.id)}
                        disabled={deletingId === comment.id}
                        aria-label={`Delete comment by ${displayName}`}
                        className={`mt-1 inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer ${FOCUS}`}
                      >
                        <Trash2 className="h-3 w-3" aria-hidden="true" />
                        Delete
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {/* Add comment form — only shown when the viewer has permission */}
        {canComment ? (
          <form onSubmit={handleSubmit} className="mt-5 space-y-2" noValidate>
            <div className="flex gap-3">
              <ProfileAvatar
                avatarId={viewerAvatarId}
                size="sm"
                className="mt-1 shrink-0"
                label={viewerName}
              />
              <div className="flex-1 space-y-2">
                <label htmlFor={inputId} className="sr-only">
                  Add a comment
                </label>
                <textarea
                  ref={textareaRef}
                  id={inputId}
                  rows={2}
                  value={draft}
                  onChange={(e) => {
                    setDraft(e.target.value);
                    setSubmitError(null);
                  }}
                  disabled={submitting}
                  placeholder="Add a comment…"
                  aria-describedby={`${inputId}-count${submitError ? ` ${inputId}-error` : ''}`}
                  className={`w-full resize-none rounded-xl border border-[#087E83]/30 bg-white px-3 py-2 text-sm text-[#0A2F25] placeholder:text-[#0A2F25]/40 focus:border-[#087E83] disabled:opacity-60 ${FOCUS}`}
                />
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    {submitError && (
                      <p
                        id={`${inputId}-error`}
                        role="alert"
                        className="flex items-start gap-1 text-xs text-red-600"
                      >
                        <AlertTriangle
                          className="mt-0.5 h-3 w-3 shrink-0"
                          aria-hidden="true"
                        />
                        {submitError}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span
                      id={`${inputId}-count`}
                      className={`text-xs ${charsOver ? 'font-semibold text-red-600' : 'text-[#0A2F25]/50'}`}
                    >
                      {trimmed.length}/{LIMITS.COMMENT_TEXT_MAX}
                    </span>
                    <button
                      type="submit"
                      disabled={!trimmed || submitting || charsOver}
                      className={`inline-flex min-h-[36px] items-center gap-1.5 rounded-lg bg-[#087E83] px-4 py-1.5 text-sm font-bold text-white hover:bg-[#06676B] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer ${FOCUS}`}
                    >
                      <Send className="h-3.5 w-3.5" aria-hidden="true" />
                      Post
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </form>
        ) : (
          /* Viewer cannot comment on this memory — show why without exposing the full setting */
          <p className="mt-4 rounded-xl border border-[#087E83]/15 bg-[#E6F3ED] px-4 py-3 text-sm text-[#0A2F25]/70">
            You cannot comment on this memory based on its privacy setting.
          </p>
        )}
      </div>
    </section>
  );
};
