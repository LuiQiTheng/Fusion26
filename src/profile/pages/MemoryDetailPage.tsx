
import React, { useEffect, useState } from 'react';
import { AlertTriangle, Calendar, Camera, ImageOff, MapPin, Pencil, RefreshCw, Trash2 } from 'lucide-react';
import { HeritagePlace } from '../../types';
import { ProfileData } from '../types';
import { deleteRecord, resolvePlace } from '../profileRepository';
import { loadPhotoBlobs } from '../photoDb';
import { ConfirmDialog } from '../components/ConfirmDialog';

interface MemoryDetailPageProps {
  data: ProfileData;
  places: HeritagePlace[];
  recordId: string;
  onEdit: (recordId: string) => void;
  // Called after the memory has been moved to the Recycle Bin.
  onDeleted: () => void;
}

const FOCUS =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#087E83]';
const CARD = 'rounded-2xl border border-[#087E83]/20 bg-white shadow-sm';

// "2025-03-14" -> "14 Mar 2025". Built from the parts so time zones cannot shift the day.
function formatVisitDate(value: string | null): string {
  if (!value) return 'Date not set';
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  if (Number.isNaN(date.getTime())) return 'Date not set';
  return date.toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatAddedDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ---------- Photos ----------

interface PhotoState {
  status: 'loading' | 'ready' | 'error';
  urls: Record<string, string>; // photo id -> temporary object URL
  missingCount: number; // photos whose files could not be found
  error?: string;
}

// Loads all photo files for a memory from IndexedDB and exposes them as object URLs.
// The URLs are released when the photos change or the page closes.
function useRecordPhotos(photoIds: string[]) {
  const [state, setState] = useState<PhotoState>({ status: 'loading', urls: {}, missingCount: 0 });
  const [reloadKey, setReloadKey] = useState(0);
  const signature = photoIds.join('|');

  useEffect(() => {
    const ids = signature ? signature.split('|') : [];
    if (ids.length === 0) {
      setState({ status: 'ready', urls: {}, missingCount: 0 });
      return;
    }

    let cancelled = false;
    const created: string[] = [];
    setState({ status: 'loading', urls: {}, missingCount: 0 });

    loadPhotoBlobs(ids).then((result) => {
      if (cancelled) return;
      if (!result.ok) {
        setState({ status: 'error', urls: {}, missingCount: 0, error: result.error });
        return;
      }
      const urls: Record<string, string> = {};
      for (const id of ids) {
        const blob = result.value.get(id);
        if (blob) {
          const url = URL.createObjectURL(blob);
          created.push(url);
          urls[id] = url;
        }
      }
      setState({ status: 'ready', urls, missingCount: ids.length - created.length });
    });

    return () => {
      cancelled = true;
      created.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [signature, reloadKey]);

  return { state, reload: () => setReloadKey((key) => key + 1) };
}

// ---------- Page ----------

export const MemoryDetailPage: React.FC<MemoryDetailPageProps> = ({
  data,
  places,
  recordId,
  onEdit,
  onDeleted,
}) => {
  const record = data.records.find((item) => item.id === recordId);

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const { state: photoState, reload: reloadPhotos } = useRecordPhotos(record ? record.photoIds : []);

  if (!record) {
    return (
      <div role="alert" className={`${CARD} space-y-3 p-6 text-center`}>
        <AlertTriangle className="mx-auto h-8 w-8 text-[#B88E18]" aria-hidden="true" />
        <p className="font-semibold text-[#0A2F25]">This memory could not be found</p>
        <p className="text-sm text-[#0A2F25]/70">It may have been deleted. Use Back to Profile to continue.</p>
      </div>
    );
  }

  const resolved = resolvePlace(data, record.place);
  const placeName = resolved?.name ?? 'Unknown place';
  const existingPlace =
    record.place.kind === 'existing'
      ? places.find((item) => item.id === (record.place as { placeId: string }).placeId)
      : undefined;
  const placeDetail = existingPlace?.locality
    ? existingPlace.locality
    : resolved && resolved.isCustom
      ? `Custom place · ${resolved.lat.toFixed(4)}, ${resolved.lng.toFixed(4)}`
      : '';

  const photoIds = record.photoIds;
  const photoCount = photoIds.length;
  const activeIndex = Math.min(selectedIndex, Math.max(photoCount - 1, 0));
  const activeId = photoIds[activeIndex];
  const activeUrl = activeId ? photoState.urls[activeId] : undefined;
  const photoMeta = (id: string) => data.photos.find((photo) => photo.id === id);

  const handleDelete = () => {
    if (deleting) return;
    setDeleting(true);
    setDeleteError(null);
    const result = deleteRecord(record.id);
    setDeleting(false);
    if (result.ok) {
      setConfirmOpen(false);
      onDeleted();
    } else {
      setConfirmOpen(false);
      setDeleteError(result.error);
    }
  };

  return (
    <article className="space-y-6" aria-labelledby="memory-title">
      <header className="space-y-3">
        <h1
          id="memory-title"
          className="flex items-start gap-2 break-words font-serif text-2xl font-bold text-[#0A2F25] sm:text-3xl"
        >
          <MapPin className="mt-1.5 h-6 w-6 shrink-0 text-[#087E83]" aria-hidden="true" />
          {placeName}
        </h1>
        {placeDetail && <p className="text-sm text-[#0A2F25]/65">{placeDetail}</p>}
        <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[#0A2F25]/80">
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="h-4 w-4 text-[#087E83]" aria-hidden="true" />
            {formatVisitDate(record.visitDate)}
          </span>
          {formatAddedDate(record.createdAt) && (
            <span className="text-xs text-[#0A2F25]/60">Added {formatAddedDate(record.createdAt)}</span>
          )}
        </p>

        <div className="flex flex-wrap gap-3 pt-1">
          <button
            type="button"
            onClick={() => onEdit(record.id)}
            className={`inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#087E83] px-5 py-2 text-sm font-bold text-white hover:bg-[#0A2F25] cursor-pointer ${FOCUS}`}
          >
            <Pencil className="h-4 w-4" aria-hidden="true" />
            Edit Memory
          </button>
          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            className={`inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-red-300 px-5 py-2 text-sm font-bold text-red-700 hover:bg-red-50 cursor-pointer ${FOCUS}`}
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            Delete
          </button>
        </div>
      </header>

      {deleteError && (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-[#0A2F25] sm:flex-row sm:items-center sm:justify-between"
        >
          <p className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-700" aria-hidden="true" />
            <span>This memory was not deleted. {deleteError}</span>
          </p>
          <button
            type="button"
            onClick={handleDelete}
            className={`inline-flex min-h-[44px] shrink-0 items-center justify-center gap-2 rounded-lg border border-red-300 px-4 py-2 font-semibold hover:bg-red-100 cursor-pointer ${FOCUS}`}
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Retry
          </button>
        </div>
      )}

      {/* Photos */}
      <section aria-labelledby="memory-photos-heading" className={`${CARD} space-y-4 p-5 sm:p-6`}>
        <h2 id="memory-photos-heading" className="font-serif text-lg font-bold text-[#0A2F25]">
          Photos {photoCount > 0 && <span className="text-sm font-normal text-[#0A2F25]/65">({photoCount})</span>}
        </h2>

        {photoCount === 0 ? (
          <p className="flex items-center gap-2 text-sm text-[#0A2F25]/65">
            <Camera className="h-4 w-4 text-[#087E83]/70" aria-hidden="true" />
            No photos for this memory.
          </p>
        ) : photoState.status === 'error' ? (
          <div role="alert" className="flex flex-col gap-3 text-sm text-[#0A2F25] sm:flex-row sm:items-center sm:justify-between">
            <p className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-700" aria-hidden="true" />
              <span>Your photos could not be loaded. {photoState.error}</span>
            </p>
            <button
              type="button"
              onClick={reloadPhotos}
              className={`inline-flex min-h-[44px] shrink-0 items-center justify-center gap-2 rounded-lg border border-red-300 px-4 py-2 font-semibold hover:bg-red-50 cursor-pointer ${FOCUS}`}
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Retry
            </button>
          </div>
        ) : (
          <>
            <div className="flex min-h-[220px] items-center justify-center overflow-hidden rounded-xl border border-[#087E83]/20 bg-[#E6F3ED]">
              {activeUrl ? (
                <img
                  src={activeUrl}
                  alt={`Photo ${activeIndex + 1} of ${photoCount} from your visit to ${placeName}`}
                  className="max-h-[70vh] w-full object-contain"
                />
              ) : (
                <p className="flex items-center gap-2 px-4 text-sm text-[#0A2F25]/65">
                  <ImageOff className="h-5 w-5" aria-hidden="true" />
                  {photoState.status === 'loading' ? 'Loading photo...' : 'This photo could not be found.'}
                </p>
              )}
            </div>

            {photoCount > 1 && (
              <ul aria-label="Choose a photo" className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8">
                {photoIds.map((id, index) => {
                  const url = photoState.urls[id];
                  const isActive = index === activeIndex;
                  return (
                    <li key={id}>
                      <button
                        type="button"
                        onClick={() => setSelectedIndex(index)}
                        aria-label={`Show photo ${index + 1}${index === 0 ? ' (cover)' : ''}`}
                        aria-current={isActive ? 'true' : undefined}
                        className={`block aspect-square w-full overflow-hidden rounded-lg border-2 bg-[#E6F3ED] cursor-pointer ${
                          isActive ? 'border-[#087E83]' : 'border-[#087E83]/20 hover:border-[#087E83]/60'
                        } ${FOCUS}`}
                      >
                        {url ? (
                          <img
                            src={url}
                            alt={photoMeta(id)?.fileName ?? `Photo ${index + 1}`}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="flex h-full w-full items-center justify-center text-[#0A2F25]/50">
                            <ImageOff className="h-4 w-4" aria-hidden="true" />
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}

            {photoState.status === 'ready' && photoState.missingCount > 0 && (
              <p role="status" className="text-xs text-[#0A2F25]">
                {photoState.missingCount} {photoState.missingCount === 1 ? 'photo' : 'photos'} could not be
                found in browser storage.
              </p>
            )}
          </>
        )}
      </section>

      {/* Notes */}
      <section aria-labelledby="memory-notes-heading" className={`${CARD} space-y-3 p-5 sm:p-6`}>
        <h2 id="memory-notes-heading" className="font-serif text-lg font-bold text-[#0A2F25]">
          Notes
        </h2>
        {record.notes ? (
          <p className="whitespace-pre-line break-words text-sm text-[#0A2F25]/85">{record.notes}</p>
        ) : (
          <p className="text-sm italic text-[#0A2F25]/60">No notes for this memory.</p>
        )}
      </section>

      <ConfirmDialog
        open={confirmOpen}
        title="Delete this memory?"
        confirmLabel="Move to Recycle Bin"
        cancelLabel="Keep Memory"
        tone="danger"
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      >
        <p>
          "{placeName}" and its {photoCount === 1 ? 'photo' : 'photos'} will be moved to the Recycle Bin, so
          they can be restored later. Other memories at the same place are not affected.
        </p>
      </ConfirmDialog>
    </article>
  );
};
