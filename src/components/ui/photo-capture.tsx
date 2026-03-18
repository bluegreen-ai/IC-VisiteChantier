import { useSignal } from '@preact/signals';

const MAX_SIZE = 2 * 1024 * 1024; // 2MB
const MAX_DIMENSION = 1920;

interface PhotoCaptureProps {
  onCapture: (blob: Blob) => void;
  currentPhotoUrl?: string;
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
    };
    img.onerror = () => reject(new Error('Image load failed'));
    img.src = URL.createObjectURL(file);
  });
}

export function PhotoCapture({ onCapture, currentPhotoUrl }: PhotoCaptureProps) {
  const previewUrl = useSignal(currentPhotoUrl ?? '');
  const sizeLabel = useSignal('');

  async function handleFile(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    try {
      const compressed = await compressImage(file);
      const sizeMB = (compressed.size / 1024 / 1024).toFixed(1);
      sizeLabel.value = `${sizeMB} MB`;

      if (previewUrl.value) URL.revokeObjectURL(previewUrl.value);
      previewUrl.value = URL.createObjectURL(compressed);

      onCapture(compressed);
    } catch (err) {
      console.error('Photo compression failed:', err);
    }
  }

  return (
    <div class="space-y-2">
      <span class="text-sm font-medium text-gray-700">Photo</span>
      <label class="block w-full cursor-pointer">
        <input
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFile}
          class="block w-full text-sm text-gray-500
            file:mr-3 file:py-2 file:px-4
            file:rounded-lg file:border-0
            file:text-sm file:font-medium
            file:bg-ic-blue file:text-white
            file:min-h-[44px]
            active:file:scale-95
            touch-manipulation"
        />
      </label>
      {previewUrl.value && (
        <div class="relative">
          <img
            src={previewUrl.value}
            alt="Preview"
            class="w-full max-h-48 object-cover rounded-lg"
          />
          {sizeLabel.value && (
            <span class="absolute bottom-1 right-1 bg-black/60 text-white text-xs px-2 py-0.5 rounded">
              {sizeLabel.value}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
