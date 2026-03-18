interface SelectFieldProps {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
  placeholder?: string;
}

export function SelectField({ label, value, options, onChange, placeholder }: SelectFieldProps) {
  return (
    <label class="block">
      <span class="text-sm font-medium text-gray-700">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange((e.target as HTMLSelectElement).value)}
        class="mt-1 block w-full min-h-[44px] rounded-lg border border-gray-300 bg-white px-3 py-2 text-base shadow-sm focus:border-ic-blue focus:ring-1 focus:ring-ic-blue touch-manipulation"
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </label>
  );
}
