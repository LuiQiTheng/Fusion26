import React, { useEffect, useId, useRef, useState } from 'react';
import { AlertTriangle, RefreshCw, Save, X } from 'lucide-react';
import { HeritagePlace } from '../../types';
import { LIMITS, ProfileData, Result, TravelPhoto, TravelRecord, fail } from '../types';
import {
  PlaceInput,
  RecordInput,
  createRecord,
  updateRecord,
  validateRecordFields,
} from '../profileRepository';
import { PlaceSelector } from '../components/PlaceSelector';
import { PendingPhoto, PhotoPicker } from '../components/PhotoPicker';

interface RecordFormPageProps {
  places: HeritagePlace[]; // existing Fusion26 places
  data: ProfileData; // current profile data (custom places, and the record when editing)
  recordId?: string; // present when editing, absent when creating
  onSaved: (record: TravelRecord, mode: 'created' | 'updated') => void;
  onCancel: () => void;
  onDirtyChange: (dirty: boolean) => void;
}

const FOCUS =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00F0FF]';
const CARD = 'rounded-2xl border border-[#D4AF37]/25 bg-[#0A1F1C]/70 p-5 sm:p-6';
const INPUT =
  'w-full min-h-[44px] rounded-xl border bg-[#04100E] px-4 py-2 text-sm text-[#F5F5F0] placeholder:text-[#F5F5F0]/40';

// Today in the user's own time zone, as "YYYY-MM-DD" (used as the latest allowed visit date).
function todayString(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

function placeSignature(place: PlaceInput | null): string {
  return JSON.stringify(place);
}

export const RecordFormPage: React.FC<RecordFormPageProps> = ({
  places,
  data,
  recordId,
  onSaved,
  onCancel,
  onDirtyChange,
}) => {
  const record = recordId ? data.records.find((item) => item.id === recordId) : undefined;
  const isEditing = recordId !== undefined;

  const initialPlace: PlaceInput | null = record
    ? record.place.kind === 'existing'
      ? { kind: 'existing', placeId: record.place.placeId }
      : { kind: 'custom', customPlaceId: record.place.customPlaceId }
    : null;
  const initialDate = record?.visitDate ?? '';
  const initialNotes = record?.notes ?? '';

  const [place, setPlace] = useState<PlaceInput | null>(initialPlace);
  const [visitDate, setVisitDate] = useState(initialDate);
  const [notes, setNotes] = useState(initialNotes);
  const [pendingPhotos, setPendingPhotos] = useState<PendingPhoto[]>([]);
  // Saved photos the user removed. They move to the Recycle Bin only when the form is saved.
  const [removedPhotoIds, setRemovedPhotoIds] = useState<string[]>([]);

  const [touched, setTouched] = useState<{ date?: boolean; notes?: boolean }>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const placeWrapperRef = useRef<HTMLDivElement>(null);
  const dateRef = useRef<HTMLInputElement>(null);
  const notesRef = useRef<HTMLTextAreaElement>(null);
  const mountedRef = useRef(true);

  const ids = useId();
  const dateId = `${ids}-date`;
  const notesId = `${ids}-notes`;

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // ---------- Unsaved-change tracking ----------

  const isDirty = isEditing
    ? placeSignature(place) !== placeSignature(initialPlace) ||
      visitDate !== initialDate ||
      notes !== initialNotes ||
      pendingPhotos.length > 0 ||
      removedPhotoIds.length > 0
    : place !== null || visitDate !== '' || notes !== '' || pendingPhotos.length > 0;

  const onDirtyChangeRef = useRef(onDirtyChange);
  useEffect(() => {
    onDirtyChangeRef.current = onDirtyChange;
  });

  useEffect(() => {
    onDirtyChangeRef.current(isDirty);
  }, [isDirty]);

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

  // ---------- Validation (the rules live in the repository) ----------

  const placeError = place === null ? 'Please choose a place for this memory.' : null;
  const dateError = validateRecordFields({ visitDate: visitDate || null, notes: '' });
  const notesError = validateRecordFields({ visitDate: null, notes });

  const showPlaceError = submitAttempted ? placeError : null;
  const showDateError = submitAttempted || touched.date ? dateError : null;
  const showNotesError = submitAttempted || touched.notes ? notesError : null;

  const notesOver = notes.length > LIMITS.NOTES_MAX;

  // ---------- Photos ----------

  const savedPhotos: TravelPhoto[] = record
    ? record.photoIds
        .filter((id) => !removedPhotoIds.includes(id))
        .map((id) => data.photos.find((photo) => photo.id === id))
        .filter((photo): photo is TravelPhoto => photo !== undefined)
    : [];

  // ---------- Saving ----------

  const handleSave = async () => {
    if (submitting) return;
    setSubmitAttempted(true);
    setSaveError(null);

    if (placeError || dateError || notesError || place === null) {
      if (placeError) {
        placeWrapperRef.current?.querySelector<HTMLElement>('input, button')?.focus();
      } else if (dateError) {
        dateRef.current?.focus();
      } else {
        notesRef.current?.focus();
      }
      return;
    }

    const input: RecordInput = { place, visitDate: visitDate || null, notes };
    const files = pendingPhotos.map((photo) => photo.file);

    setSubmitting(true);
    let result: Result<TravelRecord>;
    try {
      result = recordId
        ? await updateRecord(recordId, input, { addFiles: files, removePhotoIds: removedPhotoIds })
        : await createRecord(input, files);
    } catch (err) {
      console.error('Saving the memory failed unexpectedly:', err);
      result = fail('Something went wrong while saving. Please try again.');
    }
    if (!mountedRef.current) return;
    setSubmitting(false);

    if (result.ok) {
      onSaved(result.value, isEditing ? 'updated' : 'created');
    } else {
      // Keep everything the user entered, including chosen photos, and offer Retry.
      setSaveError(result.error);
    }
  };

  // ---------- Missing record (editing) ----------

  if (isEditing && !record) {
    return (
      <div role="alert" className="space-y-4 rounded-2xl border border-red-400/40 bg-red-950/30 p-6 text-center">
        <AlertTriangle className="mx-auto h-8 w-8 text-red-300" aria-hidden="true" />
        <p className="font-semibold text-[#F5F5F0]">This memory could not be found</p>
        <p className="text-sm text-[#F5F5F0]/75">It may have been deleted. Use Back to Profile to continue.</p>
      </div>
    );
  }

  const fieldBorder = (hasError: boolean) =>
    hasError ? 'border-red-400' : 'border-[#D4AF37]/30 focus:border-[#00F0FF]';

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        void handleSave();
      }}
      className="space-y-6"
    >
      <h1 className="font-serif text-2xl font-bold text-[#F5F5F0] sm:text-3xl">
        {isEditing ? 'Edit Memory' : 'Add Memory'}
      </h1>

      {saveError && (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-xl border border-red-400/50 bg-red-950/40 p-4 text-sm text-[#F5F5F0] sm:flex-row sm:items-center sm:justify-between"
        >
          <p className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-300" aria-hidden="true" />
            <span>Your memory was not saved. {saveError} Everything you entered is still here.</span>
          </p>
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={submitting}
            className={`inline-flex min-h-[44px] shrink-0 items-center justify-center gap-2 rounded-lg border border-red-300/60 px-4 py-2 font-semibold hover:bg-red-900/40 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer ${FOCUS}`}
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Retry
          </button>
        </div>
      )}

      {/* Place */}
      <section aria-label="Place" className={CARD}>
        <div ref={placeWrapperRef}>
          <PlaceSelector
            places={places}
            customPlaces={data.customPlaces}
            value={place}
            onChange={setPlace}
            error={showPlaceError}
            disabled={submitting}
          />
        </div>
      </section>

      {/* Date and notes */}
      <section aria-label="Visit details" className={`${CARD} space-y-5`}>
        <div className="space-y-1.5">
          <label htmlFor={dateId} className="block text-sm font-semibold text-[#F5F5F0]">
            Visit date <span className="text-sm font-normal text-[#F5F5F0]/60">(optional)</span>
          </label>
          <div className="flex flex-wrap items-center gap-3">
            <input
              ref={dateRef}
              id={dateId}
              type="date"
              value={visitDate}
              max={todayString()}
              onChange={(event) => setVisitDate(event.target.value)}
              onBlur={() => setTouched((current) => ({ ...current, date: true }))}
              disabled={submitting}
              aria-invalid={showDateError ? true : undefined}
              aria-describedby={showDateError ? `${dateId}-error` : undefined}
              className={`${INPUT} w-auto ${fieldBorder(Boolean(showDateError))} ${FOCUS}`}
            />
            {visitDate !== '' && (
              <button
                type="button"
                onClick={() => setVisitDate('')}
                disabled={submitting}
                className={`inline-flex min-h-[44px] items-center gap-1 rounded-lg px-3 text-sm font-semibold text-[#E5C05C] hover:text-[#D4AF37] disabled:opacity-50 cursor-pointer ${FOCUS}`}
              >
                <X className="h-4 w-4" aria-hidden="true" />
                Clear date
              </button>
            )}
          </div>
          {showDateError && (
            <p id={`${dateId}-error`} className="text-xs text-red-300">
              {showDateError}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <label htmlFor={notesId} className="block text-sm font-semibold text-[#F5F5F0]">
            Notes <span className="text-sm font-normal text-[#F5F5F0]/60">(optional)</span>
          </label>
          <textarea
            ref={notesRef}
            id={notesId}
            rows={6}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            onBlur={() => setTouched((current) => ({ ...current, notes: true }))}
            disabled={submitting}
            aria-invalid={showNotesError ? true : undefined}
            aria-describedby={`${notesId}-count${showNotesError ? ` ${notesId}-error` : ''}`}
            className={`${INPUT} resize-y ${fieldBorder(Boolean(showNotesError))} ${FOCUS}`}
          />
          <div className="flex items-start justify-between gap-3">
            <p id={`${notesId}-error`} className="text-xs text-red-300">
              {showNotesError}
            </p>
            <p
              id={`${notesId}-count`}
              className={`ml-auto shrink-0 text-xs ${notesOver ? 'font-semibold text-red-300' : 'text-[#F5F5F0]/50'}`}
            >
              {notes.length}/{LIMITS.NOTES_MAX}
            </p>
          </div>
        </div>
      </section>

      {/* Photos */}
      <div className={CARD}>
        <PhotoPicker
          savedPhotos={savedPhotos}
          pendingPhotos={pendingPhotos}
          onAddPhotos={(added) => setPendingPhotos((current) => [...current, ...added])}
          onRemoveSaved={(photoId) => setRemovedPhotoIds((current) => [...current, photoId])}
          onRemovePending={(key) => setPendingPhotos((current) => current.filter((photo) => photo.key !== key))}
          disabled={submitting}
        />
        {removedPhotoIds.length > 0 && (
          <p role="status" className="mt-3 text-xs text-[#E5C05C]">
            {removedPhotoIds.length} {removedPhotoIds.length === 1 ? 'photo' : 'photos'} will move to the
            Recycle Bin when you save. Cancel to keep {removedPhotoIds.length === 1 ? 'it' : 'them'}.
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className={`min-h-[44px] rounded-xl border border-[#D4AF37]/40 px-6 py-2 text-sm font-bold text-[#F5F5F0] hover:border-[#00F0FF] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer ${FOCUS}`}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className={`inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-[#D4AF37] px-6 py-2 text-sm font-bold text-slate-950 hover:bg-[#E5C05C] disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer ${FOCUS}`}
        >
          <Save className="h-4 w-4" aria-hidden="true" />
          {submitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Save Memory'}
        </button>
      </div>
    </form>
  );
};