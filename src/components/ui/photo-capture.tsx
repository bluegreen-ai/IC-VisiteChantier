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

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Canvas toBlob failed'));
        },
        'image/jpeg',
        0.85,
      );
      URL.revokeObjectURL(img.src);
    };
    img.onerror = () => reject(new Error('Image load failed'));
    img.src = URL.createObjectURL(file);
  });
}

export function PhotoCapture({ photos, onChange }: PhotoCaptureProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    try {
      const compressed = await compressImage(file);
      const sizeMB = (compressed.size / 1024 / 1024).toFixed(1);
      const previewUrl = URL.createObjectURL(compressed);

      onChange([...photos, { blob: compressed, previewUrl, sizeMB }]);
    } catch (err) {
      console.error('Photo compression failed:', err);
    }

    // Reset input so the same file can be re-selected
    if (inputRef.current) inputRef.current.value = '';
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

      {/* Add photo button */}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        class="w-full min-h-[44px] border-2 border-dashed border-gray-300 rounded-lg text-gray-500 font-medium flex items-center justify-center gap-2 active:bg-gray-50 touch-manipulation"
      >
        📷 Ajouter une photo
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFile}
        class="hidden"
      />
    </div>
  );
}
