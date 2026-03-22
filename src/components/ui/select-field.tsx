interface SelectFieldProps {
  label: string;
  value: string;
  options: readonly string[];
  labels?: readonly string[];
  onChange: (value: string) => void;
  placeholder?: string;
}

export function SelectField({ label, value, options, labels, onChange, placeholder }: SelectFieldProps) {
  return (
    <label class="block">
      <span class="text-sm font-medium text-gray-700">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange((e.target as HTMLSelectElement).value)}
        class="mt-1 block w-full min-h-[44px] rounded-lg border border-gray-300 bg-white px-3 py-2 text-base shadow-sm focus:border-betc-teal focus:ring-1 focus:ring-betc-teal touch-manipulation"
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((opt, i) => (
          <option key={opt} value={opt}>
            {labels?.[i] ?? opt}
          </option>
        ))}
      </select>
    </label>
  );
}
