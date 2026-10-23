// Helpers for sharing to external platforms. Everything here builds plain text and links:
// nothing is uploaded, and no account or API key is needed.

import { HeritagePlace, Itinerary } from '../types';

export interface SharePayload {
  title: string; // short heading, also used as the Web Share title
  text: string; // the message without the link
  url: string; // the link added to the message; '' when no usable link exists
  note?: string; // plain explanation of a limitation, shown in the dialog
  warning?: string; // a privacy warning, shown prominently in the dialog
}

const APP_NAME = 'Fusion26 Malaysia Heritage Explorer';
const X_TEXT_MAX = 250; // X allows 280 characters and counts a link as 23
const DESCRIPTION_MAX = 160;
const MEMORY_NOTES_MAX = 400;
const MAX_LISTED_STOPS = 8;

// ---------- Text helpers ----------

// Shortens text with an ellipsis. collapse = true also turns line breaks into single spaces.
export function truncate(text: string, max: number, collapse = true): string {
  const clean = collapse ? text.replace(/\s+/g, ' ').trim() : text.trim();
  return clean.length <= max ? clean : `${clean.slice(0, max - 1).trimEnd()}…`;
}

function formatMinutes(total: number): string {
  const rounded = Math.round(total);
  if (rounded < 60) return `${rounded} min`;
  const hours = Math.floor(rounded / 60);
  const minutes = rounded % 60;
  return minutes === 0 ? `${hours} h` : `${hours} h ${minutes} min`;
}

// ---------- The link ----------

export interface AppLink {
  url: string; // '' when this page has no web address (for example a local file)
  reachableByOthers: boolean;
}

function isLocalHostname(hostname: string): boolean {
  const host = hostname.toLowerCase();
  if (host === 'localhost' || host.endsWith('.local') || host === '[::1]' || host === '::1') return true;
  if (host === '0.0.0.0' || /^127\./.test(host)) return true;
  if (/^10\./.test(host) || /^192\.168\./.test(host)) return true;
  return /^172\.(1[6-9]|2\d|3[01])\./.test(host);
}

// Fusion26 has no separate web address for each place, trip or memory, so every share links to
// the app itself. No query or hash is added, so nothing private can leak through the link.
export function getAppLink(): AppLink {
  const { protocol, origin, pathname, hostname } = window.location;
  if (protocol !== 'http:' && protocol !== 'https:') return { url: '', reachableByOthers: false };
  return { url: `${origin}${pathname}`, reachableByOthers: !isLocalHostname(hostname) };
}

const LOCAL_LINK_NOTE =
  'This copy of Fusion26 is running on your own device, so the link will not open for other people until the app is published online.';

function withLinkNote(note: string | undefined, link: AppLink): string | undefined {
  const parts: string[] = [];
  if (note) parts.push(note);
  if (link.url === '') parts.push('No web address is available for this page, so no link is included.');
  else if (!link.reachableByOthers) parts.push(LOCAL_LINK_NOTE);
  return parts.length > 0 ? parts.join(' ') : undefined;
}

// ---------- Platform links ----------

function query(params: [string, string][]): string {
  return params.map(([key, value]) => `${key}=${encodeURIComponent(value)}`).join('&');
}

// The message people actually send: the text, then the link on its own line.
export function composeMessage(text: string, url: string): string {
  return url ? `${text}\n${url}` : text;
}

export function buildWhatsAppUrl(message: string): string {
  return `https://wa.me/?${query([['text', message]])}`;
}

// Facebook only accepts a link; it does not allow pre-written text.
export function buildFacebookUrl(url: string): string {
  return `https://www.facebook.com/sharer/sharer.php?${query([['u', url]])}`;
}

export function buildXUrl(text: string, url: string): string {
  const params: [string, string][] = [['text', truncate(text, X_TEXT_MAX, false)]];
  if (url) params.push(['url', url]);
  return `https://x.com/intent/post?${query(params)}`;
}

// Telegram needs a link to share.
export function buildTelegramUrl(text: string, url: string): string {
  return `https://t.me/share/url?${query([['url', url], ['text', text]])}`;
}

// ---------- Device sharing and clipboard ----------

export function canUseWebShare(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.share === 'function';
}

export type DeviceShareOutcome = 'shared' | 'cancelled' | 'failed';

export async function shareViaDevice(content: {
  title: string;
  text: string;
  url: string;
}): Promise<DeviceShareOutcome> {
  const data: ShareData = { title: content.title, text: content.text };
  if (content.url) data.url = content.url;

  try {
    if (typeof navigator.canShare === 'function' && !navigator.canShare(data)) return 'failed';
    await navigator.share(data);
    return 'shared';
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') return 'cancelled';
    console.error('Web Share failed:', err);
    return 'failed';
  }
}

// Copies text. Returns false if neither the clipboard API nor the older fallback worked,
// so the caller can ask the person to copy it by hand.
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (err) {
    console.warn('The clipboard API failed, trying the fallback:', err);
  }

  const previous = document.activeElement as HTMLElement | null;
  const area = document.createElement('textarea');
  area.value = text;
  area.setAttribute('readonly', '');
  area.style.position = 'fixed';
  area.style.top = '0';
  area.style.left = '-9999px';
  document.body.appendChild(area);
  try {
    area.select();
    area.setSelectionRange(0, text.length);
    return document.execCommand('copy');
  } catch (err) {
    console.error('The copy fallback failed:', err);
    return false;
  } finally {
    document.body.removeChild(area);
    previous?.focus?.();
  }
}

// ---------- Message builders ----------

export function buildDestinationShare(
  place: Pick<HeritagePlace, 'name' | 'locality' | 'shortDescription'>,
): SharePayload {
  const link = getAppLink();
  const lines = [place.locality ? `${place.name} (${place.locality})` : place.name];
  const description = place.shortDescription ? truncate(place.shortDescription, DESCRIPTION_MAX) : '';
  if (description) lines.push(description);
  lines.push(`Explore it on ${APP_NAME}:`);

  return {
    title: place.name,
    text: lines.join('\n'),
    url: link.url,
    note: withLinkNote('The link opens Fusion26, not this specific place.', link),
  };
}

export function buildItineraryShare(itinerary: Itinerary, places: HeritagePlace[]): SharePayload {
  const link = getAppLink();
  const names = new Map(places.map((place) => [place.id, place.name]));

  const stops = (Array.isArray(itinerary.stops) ? [...itinerary.stops] : [])
    .sort((a, b) => a.order - b.order)
    .map((stop) => names.get(stop.placeId))
    .filter((name): name is string => typeof name === 'string' && name !== '');

  const title =
    typeof itinerary.title === 'string' && itinerary.title.trim() !== '' ? itinerary.title.trim() : 'My Fusion26 trip';

  const lines = [title];
  if (stops.length > 0) lines.push(`Starts at ${stops[0]}`);
  if (stops.length > 0) {
    lines.push(`${stops.length} ${stops.length === 1 ? 'stop' : 'stops'}:`);
    stops.slice(0, MAX_LISTED_STOPS).forEach((name, index) => lines.push(`${index + 1}. ${name}`));
    if (stops.length > MAX_LISTED_STOPS) lines.push(`+ ${stops.length - MAX_LISTED_STOPS} more`);
  }
  if (typeof itinerary.totalPlannedMinutes === 'number' && itinerary.totalPlannedMinutes > 0) {
    lines.push(`About ${formatMinutes(itinerary.totalPlannedMinutes)} planned`);
  }
  lines.push(`Plan your own on ${APP_NAME}:`);

  return {
    title,
    text: lines.join('\n'),
    url: link.url,
    note: withLinkNote(
      'Your trip is saved only in this browser, so other people cannot open it from a link. This shares a text summary instead.',
      link,
    ),
  };
}

export interface MemoryShareInput {
  visibility: string;
  placeName: string;
  visitDateLabel: string | null; // already formatted, or null when no visit date is set
  notes: string;
  includeNotes: boolean;
}

// Returns null when the memory must not be shared. Only Public and Friends Only memories can be
// turned into text, and only the text below is ever produced: no photos, ids or coordinates.
// Private, and any visibility that is not recognised, is refused.
export function buildMemoryShare(input: MemoryShareInput): SharePayload | null {
  if (input.visibility !== 'public' && input.visibility !== 'friends') return null;

  const link = getAppLink();
  const heading = `My memory at ${input.placeName}`;
  const lines = [heading];
  if (input.visitDateLabel) lines.push(`Visited: ${input.visitDateLabel}`);
  const notes = input.notes.trim();
  if (input.includeNotes && notes) lines.push(`"${truncate(notes, MEMORY_NOTES_MAX, false)}"`);
  lines.push(`Shared from ${APP_NAME}:`);

  return {
    title: heading,
    text: lines.join('\n'),
    url: link.url,
    note: withLinkNote(
      'Only this text is shared. Photos are never included. The link opens Fusion26, not this memory, because memories are stored only in your browser.',
      link,
    ),
    warning:
      input.visibility === 'friends'
        ? 'This memory is set to Friends Only in Fusion26. Anything you send outside the app can be seen by whoever receives it. Your notes are left out unless you choose to include them.'
        : undefined,
  };
}