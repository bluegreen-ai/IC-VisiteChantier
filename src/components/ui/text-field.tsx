import { type Ref } from 'preact';

interface TextFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
  rows?: number;
  error?: string;
  inputRef?: Ref<HTMLInputElement | HTMLTextAreaElement>;
}

export function TextField({
  label,
  value,
  onChange,
  placeholder,
  multiline = false,
  rows = 3,
  error,
  inputRef,
}: TextFieldProps) {
  const borderClass = error
    ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
    : 'border-gray-300 focus:border-betc-teal focus:ring-betc-teal';
  const baseClass =
    `mt-1 block w-full min-h-[44px] rounded-lg border px-3 py-2 text-base shadow-sm focus:ring-1 touch-manipulation ${borderClass}`;

  return (
    <label class="block">
      <span class={`text-sm font-medium ${error ? 'text-red-600' : 'text-gray-700'}`}>{label}</span>
      {multiline ? (
        <textarea
          ref={inputRef as Ref<HTMLTextAreaElement>}
          value={value}
          onInput={(e) => onChange((e.target as HTMLTextAreaElement).value)}
          placeholder={placeholder}
          rows={rows}
          class={baseClass}
        />
      ) : (
        <input
          ref={inputRef as Ref<HTMLInputElement>}
          type="text"
          value={value}
          onInput={(e) => onChange((e.target as HTMLInputElement).value)}
          placeholder={placeholder}
          class={baseClass}
        />
      )}
      {error && <p class="mt-1 text-sm text-red-600">{error}</p>}
    </label>
  );
}
