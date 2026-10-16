
import React, { useRef, useState } from 'react';
import { AlertTriangle, Calendar, CheckCircle2, RotateCcw, Trash2, X } from 'lucide-react';
import { ProfileData, RecycledPhoto, RecycledRecord, TravelRecord } from '../types';
import {
  emptyRecycleBin,
  permanentlyDeleteRecycledPhoto,
  permanentlyDeleteRecycledRecord,
  resolvePlace,
  restoreAll,
  restorePhoto,
  restoreRecord,
} from '../profileRepository';
import { formatTimestampDate, formatVisitDate } from '../memoryUtils';
import { StoredImage } from '../components/StoredImage';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { ToastTone } from '../components/Toast';

interface RecycleBinPageProps {
  data: ProfileData;
  // Called after every operation so the parent reloads the data (and the statistics).
  onDataChanged: () => void;
  onNotify: (tone: ToastTone, text: string) => void;
}

const FOCUS =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#087E83]';
const CARD = 'rounded-2xl border border-[#087E83]/20 bg-white';
const BTN =
  'inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer';

interface Notice {
  tone: 'success' | 'warning' | 'error';
  title: string;
  details: string[];
}

type PendingDelete =
  | { kind: 'record'; id: string; label: string; extraPhotos: number }
  | { kind: 'photo'; id: string; label: string };

type PhotoHome = 'active' | 'recycled' | 'gone';

function recordPlaceName(data: ProfileData, record: TravelRecord): string {
  return resolvePlace(data, record.place)?.name ?? 'Unknown place';
}

// Where the memory that a deleted photo belonged to is right now.
function photoHome(data: ProfileData, photo: RecycledPhoto['photo']): PhotoHome {
  if (data.records.some((record) => record.id === photo.recordId)) return 'active';
  if (data.recycleBin.records.some((entry) => entry.record.id === photo.recordId)) return 'recycled';
  return 'gone';
}

function photoOwnerName(data: ProfileData, photo: RecycledPhoto['photo']): string {
  const active = data.records.find((record) => record.id === photo.recordId);
  if (active) return recordPlaceName(data, active);
  const recycled = data.recycleBin.records.find((entry) => entry.record.id === photo.recordId);
  return recycled ? recordPlaceName(data, recycled.record) : 'a memory that no longer exists';
}

const NOTICE_STYLES: Record<Notice['tone'], string> = {
  success: 'border-[#087E83]/30 bg-[#E6F3ED]',
  warning: 'border-[#087E83]/30 bg-[#E6F3ED]',
  error: 'border-red-300 bg-red-50',
};

export const RecycleBinPage: React.FC<RecycleBinPageProps> = ({ data, onDataChanged, onNotify }) => {
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null);
  // Emptying the whole bin needs two confirmations: 0 = closed, 1 = first, 2 = final.
  const [emptyStep, setEmptyStep] = useState<0 | 1 | 2>(0);

  const headingRef = useRef<HTMLHeadingElement>(null);

  const records = [...data.recycleBin.records].sort((a, b) => b.deletedAt.localeCompare(a.deletedAt));
  const photos = [...data.recycleBin.photos].sort((a, b) => b.deletedAt.localeCompare(a.deletedAt));
  const total = records.length + photos.length;

  // Runs one operation at a time. The clicked item usually disappears afterwards,
  // so focus moves to the page heading instead of being lost.
  const run = async (task: () => Promise<void>) => {
    if (busy) return;
    setBusy(true);
    try {
      await task();
    } catch (err) {
      console.error('Recycle Bin operation failed unexpectedly:', err);
      setNotice({
        tone: 'error',
        title: 'Something went wrong',
        details: ['An unexpected error occurred. Nothing was reported as done. Please try again.'],
      });
    } finally {
      setBusy(false);
      headingRef.current?.focus();
    }
  };

  // ---------- Restore ----------

  const handleRestoreRecord = (entry: RecycledRecord) =>
    run(async () => {
      const name = recordPlaceName(data, entry.record);
      const result = await restoreRecord(entry.record.id);
      onDataChanged();
      if (!result.ok) {
        setNotice({ tone: 'error', title: `"${name}" could not be restored`, details: [result.error] });
        return;
      }
      const missing = result.value.missingPhotoNames;
      if (missing.length > 0) {
        setNotice({
          tone: 'warning',
          title: `"${name}" was restored, but some photos could not be`,
          details: [
            'These photos could not be restored because their files are missing or unreadable:',
            ...missing,
          ],
        });
      } else {
        setNotice(null);
        onNotify('success', `"${name}" restored.`);
      }
    });

  const handleRestorePhoto = (entry: RecycledPhoto) =>
    run(async () => {
      const result = await restorePhoto(entry.photo.id);
      onDataChanged();
      if (!result.ok) {
        setNotice({
          tone: 'error',
          title: `"${entry.photo.fileName}" could not be restored`,
          details: [result.error],
        });
        return;
      }
      setNotice(null);
      onNotify('success', 'Photo restored.');
    });

  const handleRestoreAll = () =>
    run(async () => {
      const result = await restoreAll();
      onDataChanged();
      if (!result.ok) {
        setNotice({ tone: 'error', title: 'Nothing could be restored', details: [result.error] });
        return;
      }
      const summary = result.value;
      const restoredText = `Restored ${summary.restoredRecords} ${
        summary.restoredRecords === 1 ? 'memory' : 'memories'
      } and ${summary.restoredPhotos} ${summary.restoredPhotos === 1 ? 'photo' : 'photos'}.`;

      if (summary.problems.length === 0 && summary.missingPhotoNames.length === 0) {
        setNotice(null);
        onNotify('success', restoredText);
        return;
      }

      const details = [restoredText];
      if (summary.missingPhotoNames.length > 0) {
        details.push('These photos could not be restored because their files are missing or unreadable:');
        details.push(...summary.missingPhotoNames);
      }
      if (summary.problems.length > 0) {
        details.push('These items could not be restored:');
        details.push(...summary.problems);
      }
      const nothingRestored = summary.restoredRecords === 0 && summary.restoredPhotos === 0;
      setNotice({
        tone: nothingRestored ? 'error' : 'warning',
        title: nothingRestored ? 'Nothing could be restored' : 'Restored, with some problems',
        details,
      });
    });

  // ---------- Permanent deletion ----------

  const handleConfirmDelete = () => {
    const target = pendingDelete;
    if (!target) return;
    setPendingDelete(null);
    void run(async () => {
      const result =
        target.kind === 'record'
          ? await permanentlyDeleteRecycledRecord(target.id)
          : await permanentlyDeleteRecycledPhoto(target.id);
      onDataChanged();
      if (!result.ok) {
        setNotice({ tone: 'error', title: `"${target.label}" was not deleted`, details: [result.error] });
        return;
      }
      if (result.value.warning) {
        setNotice({
          tone: 'warning',
          title: `"${target.label}" was deleted, with a warning`,
          details: [result.value.warning],
        });
      } else {
        setNotice(null);
        onNotify('success', `"${target.label}" permanently deleted.`);
      }
    });
  };

  const handleConfirmEmpty = () => {
    setEmptyStep(0);
    void run(async () => {
      const result = await emptyRecycleBin();
      onDataChanged();
      if (!result.ok) {
        setNotice({ tone: 'error', title: 'The Recycle Bin was not emptied', details: [result.error] });
        return;
      }
      if (result.value.warning) {
        setNotice({
          tone: 'warning',
          title: 'The Recycle Bin was emptied, with a warning',
          details: [result.value.warning],
        });
      } else {
        setNotice(null);
        onNotify('success', 'Recycle Bin emptied.');
      }
    });
  };

  const openDeleteRecord = (entry: RecycledRecord) => {
    const extraPhotos = data.recycleBin.photos.filter((item) => item.photo.recordId === entry.record.id).length;
    setPendingDelete({
      kind: 'record',
      id: entry.record.id,
      label: recordPlaceName(data, entry.record),
      extraPhotos,
    });
  };

  const openDeletePhoto = (entry: RecycledPhoto) => {
    setPendingDelete({ kind: 'photo', id: entry.photo.id, label: entry.photo.fileName });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1
          ref={headingRef}
          tabIndex={-1}
          className="font-serif text-2xl font-bold text-[#0A2F25] focus:outline-none sm:text-3xl"
        >
          Recycle Bin
        </h1>
        {total > 0 && (
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => void handleRestoreAll()}
              disabled={busy}
              className={`${BTN} bg-[#087E83] text-white hover:bg-[#06676B] ${FOCUS}`}
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              Restore All
            </button>
            <button
              type="button"
              onClick={() => setEmptyStep(1)}
              disabled={busy}
              className={`${BTN} border border-red-300 text-red-700 hover:bg-red-50 ${FOCUS}`}
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              Empty Recycle Bin
            </button>
          </div>
        )}
      </div>

      <p className="text-sm text-[#0A2F25]/70">
        Deleted memories and photos stay here until you delete them permanently. Nothing is removed
        automatically.
      </p>

      <p role="status" className="sr-only">
        {busy ? 'Working...' : ''}
      </p>
      {busy && (
        <p aria-hidden="true" className="text-sm text-[#087E83]">
          Working...
        </p>
      )}

      {notice && (
        <div
          role={notice.tone === 'error' ? 'alert' : 'status'}
          className={`flex items-start gap-3 rounded-xl border p-4 text-sm text-[#0A2F25] ${NOTICE_STYLES[notice.tone]}`}
        >
          {notice.tone === 'success' ? (
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#087E83]" aria-hidden="true" />
          ) : (
            <AlertTriangle
              className={`mt-0.5 h-5 w-5 shrink-0 ${notice.tone === 'error' ? 'text-red-600' : 'text-[#087E83]'}`}
              aria-hidden="true"
            />
          )}
          <div className="min-w-0 flex-1 space-y-2">
            <p className="font-semibold">{notice.title}</p>
            {notice.details.length > 0 && (
              <ul className="list-disc space-y-1 pl-5">
                {notice.details.map((line, index) => (
                  <li key={`${line}-${index}`} className="break-words">
                    {line}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <button
            type="button"
            onClick={() => setNotice(null)}
            aria-label="Dismiss message"
            className={`-m-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-[#0A2F25]/70 hover:text-[#087E83] cursor-pointer ${FOCUS}`}
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      )}

      {total === 0 ? (
        <div className={`${CARD} flex flex-col items-center gap-3 px-6 py-12 text-center`}>
          <Trash2 className="h-10 w-10 text-[#087E83]/50" aria-hidden="true" />
          <p className="font-semibold text-[#0A2F25]">The Recycle Bin is empty</p>
          <p className="text-sm text-[#0A2F25]/60">Memories and photos you delete will appear here.</p>
        </div>
      ) : (
        <>
          {records.length > 0 && (
            <section aria-labelledby="bin-records-heading" className="space-y-3">
              <h2 id="bin-records-heading" className="font-serif text-lg font-bold text-[#0A2F25]">
                Memories <span className="text-sm font-normal text-[#0A2F25]/60">({records.length})</span>
              </h2>
              <ul className="space-y-3">
                {records.map((entry) => {
                  const placeName = recordPlaceName(data, entry.record);
                  const deleted = formatTimestampDate(entry.deletedAt);
                  const photoCount = entry.record.photoIds.length;
                  return (
                    <li key={entry.record.id} className={`${CARD} flex flex-col gap-4 p-4 sm:flex-row sm:items-center`}>
                      <StoredImage
                        photoId={entry.record.photoIds[0]}
                        alt={`Cover photo of your deleted memory at ${placeName}`}
                        className="h-28 w-full shrink-0 rounded-xl sm:w-36"
                      />
                      <div className="min-w-0 flex-1 space-y-1">
                        <h3 className="break-words font-semibold text-[#0A2F25]">{placeName}</h3>
                        <p className="flex flex-wrap items-center gap-x-1 text-xs text-[#0A2F25]/60">
                          <Calendar className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                          {formatVisitDate(entry.record.visitDate)}
                          {photoCount > 0 && (
                            <span>
                              {' '}
                              · {photoCount} {photoCount === 1 ? 'photo' : 'photos'}
                            </span>
                          )}
                          {deleted && <span> · Deleted {deleted}</span>}
                        </p>
                        {entry.record.notes && (
                          <p className="line-clamp-2 text-sm text-[#0A2F25]/75">{entry.record.notes}</p>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2 sm:flex-col">
                        <button
                          type="button"
                          onClick={() => void handleRestoreRecord(entry)}
                          disabled={busy}
                          aria-label={`Restore memory at ${placeName}`}
                          className={`${BTN} border border-[#087E83]/40 text-[#0A2F25] hover:border-[#087E83] ${FOCUS}`}
                        >
                          <RotateCcw className="h-4 w-4 text-[#087E83]" aria-hidden="true" />
                          Restore
                        </button>
                        <button
                          type="button"
                          onClick={() => openDeleteRecord(entry)}
                          disabled={busy}
                          aria-label={`Permanently delete memory at ${placeName}`}
                          className={`${BTN} border border-red-300 text-red-700 hover:bg-red-50 ${FOCUS}`}
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                          Delete
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          {photos.length > 0 && (
            <section aria-labelledby="bin-photos-heading" className="space-y-3">
              <h2 id="bin-photos-heading" className="font-serif text-lg font-bold text-[#0A2F25]">
                Photos <span className="text-sm font-normal text-[#0A2F25]/60">({photos.length})</span>
              </h2>
              <ul className="space-y-3">
                {photos.map((entry) => {
                  const home = photoHome(data, entry.photo);
                  const ownerName = photoOwnerName(data, entry.photo);
                  const deleted = formatTimestampDate(entry.deletedAt);
                  return (
                    <li key={entry.photo.id} className={`${CARD} flex flex-col gap-4 p-4 sm:flex-row sm:items-center`}>
                      <StoredImage
                        photoId={entry.photo.id}
                        alt={`Deleted photo ${entry.photo.fileName}`}
                        className="h-28 w-full shrink-0 rounded-xl sm:w-36"
                      />
                      <div className="min-w-0 flex-1 space-y-1">
                        <h3 className="break-all font-semibold text-[#0A2F25]">{entry.photo.fileName}</h3>
                        <p className="text-xs text-[#0A2F25]/60">
                          From your memory at {ownerName} · was photo {entry.originalIndex + 1}
                          {deleted && ` · Deleted ${deleted}`}
                        </p>
                        {home === 'recycled' && (
                          <p className="text-xs text-[#087E83]">
                            Restore the memory it belonged to first, then restore this photo.
                          </p>
                        )}
                        {home === 'gone' && (
                          <p className="text-xs text-[#087E83]">
                            Its memory no longer exists, so this photo can only be deleted permanently.
                          </p>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2 sm:flex-col">
                        <button
                          type="button"
                          onClick={() => void handleRestorePhoto(entry)}
                          disabled={busy || home !== 'active'}
                          aria-label={`Restore photo ${entry.photo.fileName}`}
                          className={`${BTN} border border-[#087E83]/40 text-[#0A2F25] hover:border-[#087E83] ${FOCUS}`}
                        >
                          <RotateCcw className="h-4 w-4 text-[#087E83]" aria-hidden="true" />
                          Restore
                        </button>
                        <button
                          type="button"
                          onClick={() => openDeletePhoto(entry)}
                          disabled={busy}
                          aria-label={`Permanently delete photo ${entry.photo.fileName}`}
                          className={`${BTN} border border-red-300 text-red-700 hover:bg-red-50 ${FOCUS}`}
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                          Delete
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
        </>
      )}

      {/* Permanent deletion of one item */}
      <ConfirmDialog
        open={pendingDelete !== null}
        title={pendingDelete?.kind === 'photo' ? 'Delete this photo forever?' : 'Delete this memory forever?'}
        confirmLabel="Delete Permanently"
        cancelLabel="Keep in Recycle Bin"
        tone="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setPendingDelete(null)}
      >
        {pendingDelete?.kind === 'photo' ? (
          <p>
            "{pendingDelete.label}" will be permanently deleted from this browser. This cannot be undone.
          </p>
        ) : (
          <p>
            "{pendingDelete?.label}" and its photos will be permanently deleted from this browser
            {pendingDelete && pendingDelete.kind === 'record' && pendingDelete.extraPhotos > 0
              ? `, including ${pendingDelete.extraPhotos} ${
                  pendingDelete.extraPhotos === 1 ? 'photo' : 'photos'
                } deleted earlier from this memory`
              : ''}
            . This cannot be undone.
          </p>
        )}
      </ConfirmDialog>

      {/* Emptying the Recycle Bin: two-step confirmation */}
      <ConfirmDialog
        open={emptyStep === 1}
        title="Empty the Recycle Bin?"
        confirmLabel="Continue"
        cancelLabel="Cancel"
        tone="danger"
        onConfirm={() => setEmptyStep(2)}
        onCancel={() => setEmptyStep(0)}
      >
        <p>
          This will permanently delete {records.length} {records.length === 1 ? 'memory' : 'memories'} and{' '}
          {photos.length} {photos.length === 1 ? 'photo' : 'photos'} that are in the Recycle Bin. Your active
          memories are not affected.
        </p>
      </ConfirmDialog>

      <ConfirmDialog
        open={emptyStep === 2}
        title="This cannot be undone"
        confirmLabel="Yes, Delete Everything"
        cancelLabel="Keep Everything"
        tone="danger"
        onConfirm={handleConfirmEmpty}
        onCancel={() => setEmptyStep(0)}
      >
        <p>Everything in the Recycle Bin will be gone for good. Are you sure?</p>
      </ConfirmDialog>
    </div>
  );
};
