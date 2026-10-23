import React, { useEffect, useId, useRef, useState } from 'react';
import { AlertTriangle, Check, Copy, Info, Link2, MessageCircle, Send, Share2, Users, X } from 'lucide-react';
import {
  SharePayload,
  buildFacebookUrl,
  buildTelegramUrl,
  buildWhatsAppUrl,
  buildXUrl,
  canUseWebShare,
  composeMessage,
  copyToClipboard,
  shareViaDevice,
} from '../../lib/share';

interface ShareDialogProps {
  open: boolean;
  title: string; // the dialog heading, for example "Share this memory"
  payload: SharePayload;
  onClose: () => void;
  children?: React.ReactNode; // extra options shown above the message (for example "Include my notes")
}

type Status = { tone: 'success' | 'error'; text: string } | null;

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

const FOCUS =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#087E83]';
const BTN =
  'inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-bold';
const PRIMARY = 'bg-[#087E83] text-white hover:bg-[#066468] cursor-pointer';
const SECONDARY = 'border border-[#087E83] bg-white text-[#0A2F25] hover:bg-[#E6F3ED] cursor-pointer';
const FIELD =
  'w-full rounded-xl border border-[#087E83]/40 bg-white px-3 py-2 text-sm text-[#0A2F25] focus:border-[#087E83]';

interface PlatformLinkProps {
  href: string | null; // null = not available right now
  label: string;
  icon: React.ReactNode;
  onOpen: () => void;
}

// A real link that opens in a new tab, so popup blockers do not get in the way.
const PlatformLink: React.FC<PlatformLinkProps> = ({ href, label, icon, onOpen }) =>
  href ? (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={onOpen}
      className={`${BTN} ${SECONDARY} ${FOCUS}`}
    >
      {icon}
      {label}
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  ) : (
    <span
      aria-disabled="true"
      className={`${BTN} cursor-not-allowed border border-[#087E83]/30 bg-white text-[#0A2F25]/50`}
    >
      {icon}
      {label}
      <span className="sr-only"> (unavailable)</span>
    </span>
  );

export const ShareDialog: React.FC<ShareDialogProps> = ({ open, title, payload, onClose, children }) => {
  const ids = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const linkRef = useRef<HTMLInputElement>(null);
  const onCloseRef = useRef(onClose);

  const [text, setText] = useState(payload.text);
  const [status, setStatus] = useState<Status>(null);
  const [busy, setBusy] = useState(false);
  const [deviceShare] = useState(() => canUseWebShare());

  useEffect(() => {
    onCloseRef.current = onClose;
  });

  // Each time the dialog opens, or the suggested text changes (for example a notes option was
  // switched), start again from the suggested text and clear old messages.
  useEffect(() => {
    if (open) {
      setText(payload.text);
      setStatus(null);
    }
  }, [open, payload.text]);

  // Focus handling: focus the close button, keep Tab inside, close on Escape, restore focus after.
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        // Capture phase plus stopImmediatePropagation keeps Escape from also closing a dialog behind this one.
        event.stopImmediatePropagation();
        onCloseRef.current();
        return;
      }
      if (event.key !== 'Tab' || !dialogRef.current) return;
      const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown, true);
    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
      previous?.focus?.();
    };
  }, [open]);

  if (!open) return null;

  const trimmed = text.trim();
  const hasText = trimmed.length > 0;
  const hasLink = payload.url !== '';
  const message = composeMessage(trimmed, payload.url);

  const opening = (platform: string) => () =>
    setStatus({ tone: 'success', text: `Opening ${platform} in a new tab. Finish sharing there.` });

  const handleDeviceShare = async () => {
    if (busy || !hasText) return;
    setBusy(true);
    const outcome = await shareViaDevice({ title: payload.title, text: trimmed, url: payload.url });
    setBusy(false);
    if (outcome === 'shared') setStatus({ tone: 'success', text: 'Shared.' });
    else if (outcome === 'failed') {
      setStatus({ tone: 'error', text: 'Sharing from this device did not work. Use one of the options below.' });
    }
  };

  const handleCopy = async (what: 'link' | 'message') => {
    const value = what === 'link' ? payload.url : message;
    if (value === '') return;
    const copied = await copyToClipboard(value);
    if (copied) {
      setStatus({
        tone: 'success',
        text: what === 'link' ? 'Link copied.' : 'Message copied. You can now paste it where you like.',
      });
    } else {
      setStatus({
        tone: 'error',
        text: `Copying did not work in this browser. Select the ${what === 'link' ? 'link' : 'message'} below and copy it yourself.`,
      });
      (what === 'link' ? linkRef : textRef).current?.select();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-[#0A2F25]/60 sm:items-center sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${ids}-title`}
        className="max-h-[92vh] w-full max-w-lg space-y-4 overflow-y-auto rounded-t-2xl bg-white p-5 text-[#0A2F25] shadow-2xl sm:rounded-2xl sm:p-6"
      >
        <div className="flex items-start justify-between gap-3">
          <h2 id={`${ids}-title`} className="font-serif text-xl font-bold">
            {title}
          </h2>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close share dialog"
            className={`-m-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-[#0A2F25]/70 hover:text-[#0A2F25] cursor-pointer ${FOCUS}`}
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {payload.warning && (
          <p className="flex items-start gap-2 rounded-xl border border-[#B88E18]/60 bg-white p-3 text-sm">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#B88E18]" aria-hidden="true" />
            <span>{payload.warning}</span>
          </p>
        )}

        {payload.note && (
          <p className="flex items-start gap-2 rounded-xl bg-[#E6F3ED] p-3 text-sm">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#087E83]" aria-hidden="true" />
            <span>{payload.note}</span>
          </p>
        )}

        {children}

        <div className="space-y-1.5">
          <label htmlFor={`${ids}-message`} className="block text-sm font-semibold">
            Message (you can edit it before sharing)
          </label>
          <textarea
            ref={textRef}
            id={`${ids}-message`}
            rows={6}
            value={text}
            onChange={(event) => setText(event.target.value)}
            className={`${FIELD} resize-y ${FOCUS}`}
          />
          {!hasText && <p className="text-xs text-red-800">Write a message first, then choose where to share it.</p>}
        </div>

        <div className="space-y-1.5">
          <label htmlFor={`${ids}-link`} className="block text-sm font-semibold">
            Link
          </label>
          <div className="flex gap-2">
            <input
              ref={linkRef}
              id={`${ids}-link`}
              readOnly
              value={hasLink ? payload.url : 'No link available'}
              onFocus={(event) => event.currentTarget.select()}
              className={`${FIELD} min-h-[44px] ${FOCUS}`}
            />
            <button
              type="button"
              onClick={() => void handleCopy('link')}
              disabled={!hasLink}
              className={`${BTN} shrink-0 ${SECONDARY} disabled:cursor-not-allowed disabled:opacity-50 ${FOCUS}`}
            >
              <Link2 className="h-4 w-4 text-[#087E83]" aria-hidden="true" />
              Copy Link
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-semibold">Share to</p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {deviceShare && (
              <button
                type="button"
                onClick={() => void handleDeviceShare()}
                disabled={!hasText || busy}
                className={`${BTN} ${PRIMARY} disabled:cursor-not-allowed disabled:opacity-50 sm:col-span-2 ${FOCUS}`}
              >
                <Share2 className="h-4 w-4" aria-hidden="true" />
                {busy ? 'Sharing...' : 'Share via this device'}
              </button>
            )}
            <PlatformLink
              href={hasText ? buildWhatsAppUrl(message) : null}
              label="WhatsApp"
              icon={<MessageCircle className="h-4 w-4 text-[#087E83]" aria-hidden="true" />}
              onOpen={opening('WhatsApp')}
            />
            <PlatformLink
              href={hasText && hasLink ? buildTelegramUrl(trimmed, payload.url) : null}
              label="Telegram"
              icon={<Send className="h-4 w-4 text-[#087E83]" aria-hidden="true" />}
              onOpen={opening('Telegram')}
            />
            <PlatformLink
              href={hasText ? buildXUrl(trimmed, payload.url) : null}
              label="X (Twitter)"
              icon={
                <span
                  aria-hidden="true"
                  className="flex h-4 w-4 items-center justify-center text-xs font-extrabold text-[#087E83]"
                >
                  X
                </span>
              }
              onOpen={opening('X')}
            />
            <PlatformLink
              href={hasLink ? buildFacebookUrl(payload.url) : null}
              label="Facebook (link only)"
              icon={<Users className="h-4 w-4 text-[#087E83]" aria-hidden="true" />}
              onOpen={opening('Facebook')}
            />
          </div>
        </div>

        <section aria-labelledby={`${ids}-other`} className="space-y-2 rounded-xl bg-[#E6F3ED] p-4 text-sm">
          <h3 id={`${ids}-other`} className="font-semibold">
            Instagram, TikTok and Facebook text
          </h3>
          <p>
            Websites cannot post to Instagram or TikTok for you, and Facebook only accepts the link. Copy the
            message, then paste it into a new post or caption in that app.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void handleCopy('message')}
              disabled={!hasText}
              className={`${BTN} ${PRIMARY} disabled:cursor-not-allowed disabled:opacity-50 ${FOCUS}`}
            >
              <Copy className="h-4 w-4" aria-hidden="true" />
              Copy message
            </button>
            <a
              href="https://www.instagram.com/"
              target="_blank"
              rel="noopener noreferrer"
              className={`${BTN} ${SECONDARY} ${FOCUS}`}
            >
              Open Instagram<span className="sr-only"> (opens in a new tab)</span>
            </a>
            <a
              href="https://www.tiktok.com/"
              target="_blank"
              rel="noopener noreferrer"
              className={`${BTN} ${SECONDARY} ${FOCUS}`}
            >
              Open TikTok<span className="sr-only"> (opens in a new tab)</span>
            </a>
          </div>
        </section>

        {status && (
          <p
            role={status.tone === 'error' ? 'alert' : 'status'}
            className={`flex items-start gap-2 rounded-xl p-3 text-sm ${
              status.tone === 'error' ? 'bg-red-50 text-red-900' : 'bg-[#E6F3ED] text-[#0A2F25]'
            }`}
          >
            {status.tone === 'error' ? (
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-700" aria-hidden="true" />
            ) : (
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#087E83]" aria-hidden="true" />
            )}
            <span>{status.text}</span>
          </p>
        )}
      </div>
    </div>
  );
};