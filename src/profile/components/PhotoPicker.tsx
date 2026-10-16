import React, { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Camera, ChevronLeft, ChevronRight, ImageOff, ImagePlus, X } from 'lucide-react';
import { LIMITS, TravelPhoto } from '../types';
import { RejectedFile, validatePhotoFiles } from '../profileRepository';
import { loadPhotoBlob } from '../photoDb';

// A photo chosen in the form but not saved yet. The parent owns the list.
export interface PendingPhoto {
  key: string;
  file: File;
}

interface PhotoPickerProps {
  savedPhotos: TravelPhoto[]; // photos already stored for this memory, in upload order
  pendingPhotos: PendingPhoto[]; // newly chosen photos, shown after the saved ones
  onAddPhotos: (photos: PendingPhoto[]) => void;
  onRemoveSaved: (photoId: string) => void;
  onRemovePending: (key: string) => void;
  disabled?: boolean;
}

interface PickerItem {
  key: string;
  name: string;
  photoId?: string; // saved photo
  pendingKey?: string; // pending photo
  file?: File; // pending photo
}

const FOCUS =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00F0FF]';
const ACCEPT = 'image/jpeg,image/png,image/webp';

let pendingCounter = 0;
function createPendingKey(): string {
  pendingCounter += 1;
  return `${Date.now().toString(36)}-${pendingCounter}`;
}

// ---------- Preview URLs ----------

// Saved photos are read from IndexedDB; pending photos come straight from the File.
// Every object URL is revoked when its photo disappears or the component unmounts.
function usePhotoUrls(items: PickerItem[]) {
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [missing, setMissing] = useState<Record<string, boolean>>({});
  const created = useRef(new Map<string, string>());
  const requested = useRef(new Set<string>());
  const unmounted = useRef(false);
  const itemsRef = useRef(items);
  itemsRef.current = items;

  const publish = () => setUrls(Object.fromEntries(created.current));

  useEffect(() => {
    unmounted.current = false;
    const map = created.current;
    const asked = requested.current;
    return () => {
      unmounted.current = true;
      map.forEach((url) => URL.revokeObjectURL(url));
      map.clear();
      asked.clear();
    };
  }, []);

  const signature = items.map((item) => item.key).join('|');

  useEffect(() => {
    const live = new Set(itemsRef.current.map((item) => item.key));

    created.current.forEach((url, key) => {
      if (!live.has(key)) {
        URL.revokeObjectURL(url);
        created.current.delete(key);
      }
    });
    requested.current.forEach((key) => {
      if (!live.has(key)) requested.current.delete(key);
    });

    for (const item of itemsRef.current) {
      if (created.current.has(item.key) || requested.current.has(item.key)) continue;
      requested.current.add(item.key);

      if (item.file) {
        created.current.set(item.key, URL.createObjectURL(item.file));
      } else if (item.photoId) {
        const key = item.key;
        loadPhotoBlob(item.photoId).then((result) => {
          if (unmounted.current) return;
          if (!itemsRef.current.some((current) => current.key === key)) return;
          if (created.current.has(key)) return;
          if (result.ok && result.value) {
            created.current.set(key, URL.createObjectURL(result.value));
            publish();
          } else {
            setMissing((current) => ({ ...current, [key]: true }));
          }
        });
      }
    }
    publish();
    // Re-run only when the set of photos changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature]);

  return { urls, missing };
}

// ---------- Larger preview ----------

interface LightboxProps {
  items: PickerItem[];
  urls: Record<string, string>;
  missing: Record<string, boolean>;
  index: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
}

const PhotoLightbox: React.FC<LightboxProps> = ({ items, urls, missing, index, onIndexChange, onClose }) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const item = items[index];
  const total = items.length;

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    return () => previous?.focus?.();
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose();
      } else if (event.key === 'ArrowLeft' && index > 0) {
        onIndexChange(index - 1);
      } else if (event.key === 'ArrowRight' && index < total - 1) {
        onIndexChange(index + 1);
      } else if (event.key === 'Tab' && dialogRef.current) {
        const buttons = dialogRef.current.querySelectorAll<HTMLElement>('button:not([disabled])');
        if (buttons.length === 0) return;
        const first = buttons[0];
        const last = buttons[buttons.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [index, total, onClose, onIndexChange]);

  if (!item) return null;
  const url = urls[item.key];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={`Photo ${index + 1} of ${total}`}
        className="flex max-h-full w-full max-w-3xl flex-col gap-3"
      >
        <div className="flex items-center justify-between gap-3 text-sm text-[#F5F5F0]">
          <p className="min-w-0 truncate">
            {index === 0 && <span className="mr-2 font-semibold text-[#E5C05C]">Cover</span>}
            {item.name}
          </p>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close preview"
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white hover:bg-white/20 cursor-pointer ${FOCUS}`}
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onIndexChange(index - 1)}
            disabled={index === 0}
            aria-label="Previous photo"
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white hover:bg-white/20 disabled:opacity-30 cursor-pointer disabled:cursor-default ${FOCUS}`}
          >
            <ChevronLeft className="h-5 w-5" aria-hidden="true" />
          </button>

          <div className="flex min-h-[200px] min-w-0 flex-1 items-center justify-center">
            {url ? (
              <img
                src={url}
                alt={`Photo ${index + 1} of ${total}: ${item.name}`}
                className="max-h-[70vh] max-w-full rounded-lg object-contain"
              />
            ) : (
              <p className="flex items-center gap-2 text-sm text-[#F5F5F0]/70">
                <ImageOff className="h-5 w-5" aria-hidden="true" />
                {missing[item.key] ? 'This photo could not be loaded.' : 'Loading photo...'}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={() => onIndexChange(index + 1)}
            disabled={index === total - 1}
            aria-label="Next photo"
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white hover:bg-white/20 disabled:opacity-30 cursor-pointer disabled:cursor-default ${FOCUS}`}
          >
            <ChevronRight className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <p className="text-center text-xs text-[#F5F5F0]/60">
          {index + 1} / {total}
        </p>
      </div>
    </div>
  );
};

// ---------- Picker ----------

export const PhotoPicker: React.FC<PhotoPickerProps> = ({
  savedPhotos,
  pendingPhotos,
  onAddPhotos,
  onRemoveSaved,
  onRemovePending,
  disabled = false,
}) => {
  const [rejected, setRejected] = useState<RejectedFile[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const chooseButtonRef = useRef<HTMLButtonElement>(null);

  // The camera button is only useful on touch devices; elsewhere it would just open a file chooser.
  const [showCamera] = useState(
    () =>
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(pointer: coarse)').matches,
  );

  const items: PickerItem[] = [
    ...savedPhotos.map((photo) => ({
      key: `saved:${photo.id}`,
      name: photo.fileName,
      photoId: photo.id,
    })),
    ...pendingPhotos.map((photo) => ({
      key: `new:${photo.key}`,
      name: photo.file.name,
      pendingKey: photo.key,
      file: photo.file,
    })),
  ];

  const { urls, missing } = usePhotoUrls(items);
  const total = items.length;
  const atLimit = total >= LIMITS.PHOTOS_PER_RECORD;
  const addDisabled = disabled || atLimit;

  const handleFiles = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    // Reset so choosing the same file again still triggers a change.
    event.target.value = '';
    if (files.length === 0) return;

    const result = validatePhotoFiles(files, total);
    setRejected(result.rejected);

    if (result.accepted.length > 0) {
      onAddPhotos(result.accepted.map((file) => ({ key: createPendingKey(), file })));
      setNotice(`${result.accepted.length} ${result.accepted.length === 1 ? 'photo' : 'photos'} added.`);
    } else {
      setNotice(null);
    }
  };

  const handleRemove = (item: PickerItem) => {
    if (item.photoId) onRemoveSaved(item.photoId);
    else if (item.pendingKey) onRemovePending(item.pendingKey);
    setNotice(null);
    // The removed thumbnail held focus, so move it somewhere sensible.
    chooseButtonRef.current?.focus();
  };

  return (
    <section aria-labelledby="photo-picker-heading" className="space-y-4">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="photo-picker-heading" className="font-serif text-lg font-bold text-[#F5F5F0]">
          Photos <span className="text-sm font-normal text-[#F5F5F0]/60">(optional)</span>
        </h2>
        <p className="text-xs text-[#F5F5F0]/60">
          {total}/{LIMITS.PHOTOS_PER_RECORD}
        </p>
      </div>

      <p className="text-xs text-[#F5F5F0]/60">
        JPG, JPEG, PNG or WebP, up to 10 MB each. The first photo is the cover.
      </p>

      <div className="flex flex-wrap gap-3">
        <button
          ref={chooseButtonRef}
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={addDisabled}
          className={`inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-[#D4AF37]/40 px-4 py-2 text-sm font-bold text-[#F5F5F0] hover:border-[#00F0FF] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer ${FOCUS}`}
        >
          <ImagePlus className="h-4 w-4 text-[#D4AF37]" aria-hidden="true" />
          Choose photos
        </button>
        {showCamera && (
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            disabled={addDisabled}
            className={`inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-[#D4AF37]/40 px-4 py-2 text-sm font-bold text-[#F5F5F0] hover:border-[#00F0FF] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer ${FOCUS}`}
          >
            <Camera className="h-4 w-4 text-[#D4AF37]" aria-hidden="true" />
            Take photo
          </button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPT}
          multiple
          onChange={handleFiles}
          tabIndex={-1}
          aria-hidden="true"
          className="sr-only"
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept={ACCEPT}
          capture="environment"
          onChange={handleFiles}
          tabIndex={-1}
          aria-hidden="true"
          className="sr-only"
        />
      </div>

      {atLimit && (
        <p className="text-xs text-[#E5C05C]">
          You have reached the limit of {LIMITS.PHOTOS_PER_RECORD} photos. Remove one to add another.
        </p>
      )}

      {notice && (
        <p role="status" className="text-xs text-[#E5C05C]">
          {notice}
        </p>
      )}

      {rejected.length > 0 && (
        <div role="alert" className="rounded-xl border border-red-400/50 bg-red-950/40 p-4 text-sm text-[#F5F5F0]">
          <div className="flex items-start justify-between gap-3">
            <p className="flex items-start gap-2 font-semibold">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-300" aria-hidden="true" />
              {rejected.length === 1 ? '1 file was not added:' : `${rejected.length} files were not added:`}
            </p>
            <button
              type="button"
              onClick={() => setRejected([])}
              aria-label="Dismiss file errors"
              className={`-m-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-[#F5F5F0]/70 hover:text-white cursor-pointer ${FOCUS}`}
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
          <ul className="mt-2 list-disc space-y-1 pl-9">
            {rejected.map((file, index) => (
              <li key={`${file.fileName}-${index}`}>
                <span className="break-all font-semibold">{file.fileName}</span>: {file.reason}
              </li>
            ))}
          </ul>
        </div>
      )}

      {items.length > 0 && (
        <ul aria-label="Selected photos" className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
          {items.map((item, index) => {
            const url = urls[item.key];
            return (
              <li key={item.key} className="relative">
                <button
                  type="button"
                  onClick={() => setPreviewIndex(index)}
                  aria-label={`Preview photo ${index + 1}: ${item.name}`}
                  className={`block aspect-square w-full overflow-hidden rounded-xl border border-[#D4AF37]/30 bg-[#04100E] hover:border-[#D4AF37]/70 cursor-pointer ${FOCUS}`}
                >
                  {url ? (
                    <img
                      src={url}
                      alt={`Photo ${index + 1}: ${item.name}`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="flex h-full w-full flex-col items-center justify-center gap-1 px-2 text-center text-xs text-[#F5F5F0]/60">
                      <ImageOff className="h-5 w-5" aria-hidden="true" />
                      {missing[item.key] ? 'Photo unavailable' : 'Loading...'}
                    </span>
                  )}
                </button>

                {index === 0 && (
                  <span className="pointer-events-none absolute left-2 top-2 rounded-full bg-[#D4AF37] px-2 py-0.5 text-[10px] font-bold text-slate-950">
                    Cover
                  </span>
                )}
                {item.file && (
                  <span className="pointer-events-none absolute bottom-2 left-2 rounded-full bg-[#04100E]/85 px-2 py-0.5 text-[10px] font-semibold text-[#E5C05C]">
                    Not saved yet
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => handleRemove(item)}
                  disabled={disabled}
                  aria-label={`Remove photo ${index + 1}: ${item.name}`}
                  className={`absolute right-0 top-0 flex h-11 w-11 items-center justify-center cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${FOCUS}`}
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full border border-[#D4AF37]/50 bg-[#04100E]/85 text-[#F5F5F0] hover:bg-red-700">
                    <X className="h-4 w-4" aria-hidden="true" />
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {previewIndex !== null && items[previewIndex] && (
        <PhotoLightbox
          items={items}
          urls={urls}
          missing={missing}
          index={previewIndex}
          onIndexChange={setPreviewIndex}
          onClose={() => setPreviewIndex(null)}
        />
      )}
    </section>
  );
};