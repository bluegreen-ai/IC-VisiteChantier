import { useSignal } from '@preact/signals';
import { useRef } from 'preact/hooks';

const MAX_SIZE = 2 * 1024 * 1024; // 2MB
const MAX_DIMENSION = 1920;

export interface CapturedPhoto {
  blob: Blob;
  previewUrl: string;
  sizeMB: string;
}

interface PhotoCaptureProps {
  photos: CapturedPhoto[];
  onChange: (photos: CapturedPhoto[]) => void;
}

async function compressImage(file: File): Promise<Blob> {
  if (file.size <= MAX_SIZE) return file;

  const bitmap = await createImageBitmap(file);
  let { width, height } = bitmap;
  if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
    const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Canvas toBlob failed'));
      },
      'image/jpeg',
      0.85,
    );
  });
}

export function PhotoCapture({ photos, onChange }: PhotoCaptureProps) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const processing = useSignal(false);

  async function handleFiles(e: Event) {
    const input = e.target as HTMLInputElement;
    const files = input.files;
    if (!files || files.length === 0) return;

    processing.value = true;
    try {
      const newPhotos: CapturedPhoto[] = [];
      for (const file of Array.from(files)) {
        const compressed = await compressImage(file);
        const sizeMB = (compressed.size / 1024 / 1024).toFixed(1);
        const previewUrl = URL.createObjectURL(compressed);
        newPhotos.push({ blob: compressed, previewUrl, sizeMB });
      }
      onChange([...photos, ...newPhotos]);
    } catch (err) {
      console.error('Photo compression failed:', err);
    } finally {
      processing.value = false;
    }

    // Reset input so the same file can be re-selected
    input.value = '';
  }

  function removePhoto(index: number) {
    URL.revokeObjectURL(photos[index].previewUrl);
    onChange(photos.filter((_, i) => i !== index));
  }

  return (
    <div class="space-y-2">
      <span class="text-sm font-medium text-gray-700">
        Photos {photos.length > 0 && `(${photos.length})`}
      </span>

      {/* Thumbnails grid */}
      {photos.length > 0 && (
        <div class="flex gap-2 flex-wrap">
          {photos.map((photo, i) => (
            <div key={i} class="relative w-20 h-20">
              <img
                src={photo.previewUrl}
                alt={`Photo ${i + 1}`}
                class="w-full h-full object-cover rounded-lg"
              />
              <button
                type="button"
                onClick={() => removePhoto(i)}
                class="absolute -top-1.5 -right-1.5 w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center shadow touch-manipulation"
              >
                ✕
              </button>
              <span class="absolute bottom-0.5 right-0.5 bg-black/60 text-white text-[10px] px-1 rounded">
                {photo.sizeMB}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Dual photo buttons: camera + gallery */}
      <div class="flex gap-2">
        <button
          type="button"
          onClick={() => cameraRef.current?.click()}
          disabled={processing.value}
          class="flex-1 min-h-[44px] border-2 border-dashed border-gray-300 rounded-lg text-gray-500 font-medium flex items-center justify-center gap-1.5 active:bg-gray-50 touch-manipulation disabled:opacity-50"
        >
          📷 Appareil
        </button>
        <button
          type="button"
          onClick={() => galleryRef.current?.click()}
          disabled={processing.value}
          class="flex-1 min-h-[44px] border-2 border-dashed border-gray-300 rounded-lg text-gray-500 font-medium flex items-center justify-center gap-1.5 active:bg-gray-50 touch-manipulation disabled:opacity-50"
        >
          🖼️ Galerie
        </button>
      </div>
      {processing.value && (
        <p class="text-xs text-gray-400 text-center">Compression en cours…</p>
      )}

      {/* Camera input — opens camera directly */}
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFiles}
        class="hidden"
      />
      {/* Gallery input — opens photo picker, allows multiple */}
      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFiles}
        class="hidden"
      />
    </div>
  );
}
