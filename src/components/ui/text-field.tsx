interface TextFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
  rows?: number;
}

export function TextField({
  label,
  value,
  onChange,
  placeholder,
  multiline = false,
  rows = 3,
}: TextFieldProps) {
  const baseClass =
    'mt-1 block w-full min-h-[44px] rounded-lg border border-gray-300 px-3 py-2 text-base shadow-sm focus:border-ic-blue focus:ring-1 focus:ring-ic-blue touch-manipulation';

  return (
    <label class="block">
      <span class="text-sm font-medium text-gray-700">{label}</span>
      {multiline ? (
        <textarea
          value={value}
          onInput={(e) => onChange((e.target as HTMLTextAreaElement).value)}
          placeholder={placeholder}
          rows={rows}
          class={baseClass}
        />
      ) : (
        <input
          type="text"
          value={value}
          onInput={(e) => onChange((e.target as HTMLInputElement).value)}
          placeholder={placeholder}
          class={baseClass}
        />
      )}
    </label>
  );
}
