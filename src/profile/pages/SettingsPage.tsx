import React, { useEffect, useRef, useState } from 'react';
import { AlertTriangle, HardDrive, Pencil, RefreshCw, Trash2 } from 'lucide-react';
import { ProfileData, Result, fail } from '../types';
import { resetProfile } from '../profileRepository';
import { StorageEstimate, getStorageEstimate } from '../photoDb';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { ProfileAvatar } from '../components/ProfileAvatar';

interface SettingsPageProps {
  data: ProfileData;
  recycleBinCount: number;
  onEditProfile: () => void;
  onOpenRecycleBin: () => void;
  // Called after every reset attempt, even a failed one, so the parent reloads the data.
  onDataChanged: () => void;
  // Called only when the reset finished completely.
  onResetDone: () => void;
}

const FOCUS =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00F0FF]';
const CARD = 'rounded-2xl border border-[#087E83]/20 bg-white p-5 sm:p-6';
const BTN =
  'inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl px-5 py-2 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer';

type EstimateState = { status: 'loading' } | { status: 'ready'; estimate: StorageEstimate | null };

const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB', 'TB'];
  let value = bytes / 1024;
  let index = 0;
  while (value >= 1024 && index < units.length - 1) {
    value /= 1024;
    index += 1;
  }
  return `${value.toFixed(value >= 100 ? 0 : 1)} ${units[index]}`;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  data,
  recycleBinCount,
  onEditProfile,
  onOpenRecycleBin,
  onDataChanged,
  onResetDone,
}) => {
  const [estimate, setEstimate] = useState<EstimateState>({ status: 'loading' });
  // Reset needs two confirmations: 0 = closed, 1 = first, 2 = final.
  const [resetStep, setResetStep] = useState<0 | 1 | 2>(0);
  const [resetting, setResetting] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    getStorageEstimate().then((result) => {
      if (!cancelled) setEstimate({ status: 'ready', estimate: result });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // ---------- Counts shown in the information and in the reset confirmation ----------

  const memoryCount = data.records.length;
  const recycledMemoryCount = data.recycleBin.records.length;
  const customPlaceCount = data.customPlaces.length;
  const photoCount =
    data.photos.length +
    data.recycleBin.records.reduce((sum, entry) => sum + entry.photos.length, 0) +
    data.recycleBin.photos.length;

  // ---------- Reset ----------

  const runReset = async () => {
    if (resetting) return;
    setResetting(true);
    setResetError(null);

    let result: Result<void>;
    try {
      result = await resetProfile();
    } catch (err) {
      console.error('Reset Profile failed unexpectedly:', err);
      result = fail('Something went wrong while resetting. Nothing was reported as done.');
    }

    // Reload either way: a partial reset may already have changed what is stored.
    onDataChanged();
    if (!mountedRef.current) return;
    setResetting(false);

    if (result.ok) onResetDone();
    else setResetError(result.error);
  };

  const handleConfirmReset = () => {
    setResetStep(0);
    void runReset();
  };

  return (
    <div className="space-y-8">
      <h1 className="font-serif text-2xl font-bold text-[#0A2F25] sm:text-3xl">Settings</h1>

      {/* Edit Profile */}
      <section aria-labelledby="settings-profile-heading" className={`${CARD} space-y-4`}>
        <h2 id="settings-profile-heading" className="font-serif text-lg font-bold text-[#0A2F25]">
          Profile
        </h2>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <ProfileAvatar
            avatarId={data.profile.avatarId}
            size="lg"
            label={`Avatar of ${data.profile.displayName}`}
          />
          <div className="min-w-0 flex-1">
            <p className="break-words font-semibold text-[#0A2F25]">{data.profile.displayName}</p>
            <p className="text-sm text-[#E5C05C]">@{data.profile.username}</p>
          </div>
          <button
            type="button"
            onClick={onEditProfile}
            className={`${BTN} bg-[#D4AF37] text-slate-950 hover:bg-[#E5C05C] ${FOCUS}`}
          >
            <Pencil className="h-4 w-4" aria-hidden="true" />
            Edit Profile
          </button>
        </div>
      </section>

      {/* Local data and storage */}
      <section aria-labelledby="settings-storage-heading" className={`${CARD} space-y-4`}>
        <h2
          id="settings-storage-heading"
          className="flex items-center gap-2 font-serif text-lg font-bold text-[#0A2F25]"
        >
          <HardDrive className="h-5 w-5 text-[#D4AF37]" aria-hidden="true" />
          Local Data &amp; Storage
        </h2>

        <ul className="list-disc space-y-2 pl-5 text-sm text-[#52665F]">
          <li>Your profile details, memories and custom places are stored in this browser on this device.</li>
          <li>Your travel photos are stored in this browser's IndexedDB storage.</li>
          <li>Clearing your browser data, or using a different device or browser, may permanently remove them.</li>
          <li>There is no cloud synchronization or backup in this version.</li>
          <li>
            This profile is not linked to an account. The Sign In page is a separate demo and does not save or
            sync it.
          </li>
        </ul>

        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'Memories', value: memoryCount },
            { label: 'Photos', value: photoCount },
            { label: 'Custom places', value: customPlaceCount },
            { label: 'In Recycle Bin', value: recycleBinCount },
          ].map((item) => (
            <div key={item.label} className="rounded-xl border border-[#087E83]/15 bg-[#E6F3ED] p-3 text-center">
              <dd className="font-serif text-xl font-bold text-[#0A2F25]">{item.value}</dd>
              <dt className="text-xs text-[#52665F]">{item.label}</dt>
            </div>
          ))}
        </dl>

        <p className="text-xs text-[#52665F]">
          {estimate.status === 'loading'
            ? 'Checking browser storage...'
            : estimate.estimate
              ? `Browser storage in use by this site: ${formatBytes(estimate.estimate.usageBytes)} of about ${formatBytes(
                  estimate.estimate.quotaBytes,
                )} available. This is the browser's estimate for the whole site, not only your profile.`
              : 'Your browser cannot report how much storage is in use.'}
        </p>
      </section>

      {/* Recycle Bin */}
      <section aria-labelledby="settings-bin-heading" className={`${CARD} space-y-3`}>
        <h2 id="settings-bin-heading" className="font-serif text-lg font-bold text-[#0A2F25]">
          Recycle Bin
        </h2>
        <p className="text-sm text-[#52665F]">
          {recycleBinCount === 0
            ? 'The Recycle Bin is empty.'
            : `${plural(recycleBinCount, 'item is', 'items are')} in the Recycle Bin. Nothing is removed automatically.`}
        </p>
        <button
          type="button"
          onClick={onOpenRecycleBin}
          className={`${BTN} border border-[#087E83]/30 bg-white text-[#0A2F25] hover:border-[#087E83] hover:bg-[#E6F3ED] ${FOCUS}`}
        >
          <Trash2 className="h-4 w-4 text-[#D4AF37]" aria-hidden="true" />
          Open Recycle Bin
        </button>
      </section>

      {/* Danger zone */}
      <section
        aria-labelledby="settings-danger-heading"
        className="space-y-4 rounded-2xl border border-red-200 bg-red-50 p-5 sm:p-6"
      >
        <h2
          id="settings-danger-heading"
          className="flex items-center gap-2 font-serif text-lg font-bold text-red-800"
        >
          <AlertTriangle className="h-5 w-5" aria-hidden="true" />
          Danger zone
        </h2>
        <p className="text-sm text-[#52665F]">
          Reset Profile permanently removes your profile details, memories, photos and Recycle Bin. Your Wishlist,
          saved trip and missions are not affected.
        </p>

        {resetting && (
          <p role="status" className="text-sm font-medium text-[#087E83]">
            Resetting your profile...
          </p>
        )}

        {resetError && (
          <div
            role="alert"
            className="flex flex-col gap-3 rounded-xl border border-red-200 bg-white p-4 text-sm text-red-800 sm:flex-row sm:items-center sm:justify-between"
          >
            <p className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" aria-hidden="true" />
              <span>The reset did not finish. {resetError}</span>
            </p>
            <button
              type="button"
              onClick={() => void runReset()}
              disabled={resetting}
              className={`${BTN} shrink-0 border border-red-300 bg-white text-red-700 hover:bg-red-100 ${FOCUS}`}
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Retry
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={() => setResetStep(1)}
          disabled={resetting}
          className={`${BTN} bg-red-600 text-white hover:bg-red-500 ${FOCUS}`}
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
          Reset Profile
        </button>
      </section>

      {/* Reset: first confirmation */}
      <ConfirmDialog
        open={resetStep === 1}
        title="Reset your profile?"
        confirmLabel="Continue"
        cancelLabel="Cancel"
        tone="danger"
        onConfirm={() => setResetStep(2)}
        onCancel={() => setResetStep(0)}
      >
        <div className="space-y-3">
          <p className="font-semibold text-[#0A2F25]">This will permanently remove:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Your profile details, which go back to the defaults</li>
            <li>{plural(memoryCount, 'memory', 'memories')}</li>
            <li>{plural(photoCount, 'photo', 'photos')}, including photos in the Recycle Bin</li>
            <li>{plural(customPlaceCount, 'custom place', 'custom places')}</li>
            <li>
              Everything in the Recycle Bin
              {recycledMemoryCount > 0 ? ` (${plural(recycledMemoryCount, 'memory', 'memories')})` : ''}
            </li>
          </ul>
          <p className="font-semibold text-[#0A2F25]">This will not change:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Your Wishlist and favorite places</li>
            <li>Your saved trip</li>
            <li>Missions, mission photos and badges</li>
            <li>Other saved preferences</li>
          </ul>
        </div>
      </ConfirmDialog>

      {/* Reset: final confirmation */}
      <ConfirmDialog
        open={resetStep === 2}
        title="This cannot be undone"
        confirmLabel="Yes, Reset Profile"
        cancelLabel="Keep My Profile"
        tone="danger"
        onConfirm={handleConfirmReset}
        onCancel={() => setResetStep(0)}
      >
        <p>Your profile data and photos will be gone for good. Are you sure?</p>
      </ConfirmDialog>
    </div>
  );
};