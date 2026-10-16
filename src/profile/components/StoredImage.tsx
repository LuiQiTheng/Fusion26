import React, { useEffect, useState } from 'react';
import { Camera, ImageOff } from 'lucide-react';
import { loadPhotoBlob } from '../photoDb';

interface StoredImageProps {
  // Id of a photo stored in IndexedDB. When undefined, the "no photo" placeholder is shown.
  photoId: string | undefined;
  alt: string;
  className?: string; // sizing for the outer box, e.g. "h-36 w-full"
  imageClassName?: string; // classes for the <img>, defaults to cover-fit
}

type LoadState = 'idle' | 'loading' | 'ready' | 'missing';

// Loads one photo from IndexedDB and shows it. The temporary object URL is released
// when the photo changes or the component unmounts.
export const StoredImage: React.FC<StoredImageProps> = ({
  photoId,
  alt,
  className = '',
  imageClassName = 'h-full w-full object-cover',
}) => {
  const [url, setUrl] = useState<string | null>(null);
  const [state, setState] = useState<LoadState>(photoId ? 'loading' : 'idle');

  useEffect(() => {
    if (!photoId) {
      setUrl(null);
      setState('idle');
      return;
    }

    let cancelled = false;
    let objectUrl: string | null = null;
    setUrl(null);
    setState('loading');

    loadPhotoBlob(photoId).then((result) => {
      if (cancelled) return;
      if (result.ok && result.value) {
        objectUrl = URL.createObjectURL(result.value);
        setUrl(objectUrl);
        setState('ready');
      } else {
        setState('missing');
      }
    });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [photoId]);

  return (
    <div className={`flex items-center justify-center overflow-hidden bg-[#04100E] ${className}`}>
      {state === 'ready' && url ? (
        <img src={url} alt={alt} className={imageClassName} />
      ) : state === 'missing' ? (
        <span className="flex flex-col items-center gap-1 px-2 text-center text-xs text-[#F5F5F0]/50" role="img" aria-label="Photo unavailable">
          <ImageOff className="h-6 w-6" aria-hidden="true" />
          Photo unavailable
        </span>
      ) : state === 'loading' ? (
        <span className="text-xs text-[#F5F5F0]/40" role="status" aria-label="Loading photo">
          <Camera className="h-6 w-6 animate-pulse text-[#D4AF37]/40" aria-hidden="true" />
        </span>
      ) : (
        <Camera className="h-8 w-8 text-[#D4AF37]/40" role="img" aria-label="No photo" />
      )}
    </div>
  );
};