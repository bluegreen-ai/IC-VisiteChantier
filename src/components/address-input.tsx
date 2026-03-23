import { useSignal } from '@preact/signals';
import { useRef, useEffect } from 'preact/hooks';
import { searchAddress } from '../lib/address-autocomplete';
import type { AddressSuggestion } from '../lib/address-autocomplete';

interface AddressInputProps {
  value: string;
  onSelect: (suggestion: AddressSuggestion) => void;
  onChange: (text: string) => void;
  placeholder?: string;
}

export function AddressInput({ value, onSelect, onChange, placeholder }: AddressInputProps) {
  const suggestions = useSignal<AddressSuggestion[]>([]);
  const showDropdown = useSignal(false);
  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  function handleInput(text: string) {
    onChange(text);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (text.length < 3) {
      suggestions.value = [];
      showDropdown.value = false;
      return;
    }

    debounceRef.current = setTimeout(async () => {
      abortRef.current?.abort();
      abortRef.current = new AbortController();
      const results = await searchAddress(text, abortRef.current.signal);
      suggestions.value = results;
      showDropdown.value = results.length > 0;
    }, 300);
  }

  function handleSelect(s: AddressSuggestion) {
    suggestions.value = [];
    showDropdown.value = false;
    onSelect(s);
  }

  function handleBlur() {
    // Delay to allow tap on suggestion to register
    setTimeout(() => {
      showDropdown.value = false;
    }, 200);
  }

  return (
    <div class="relative">
      <label class="block">
        <span class="text-sm font-medium text-gray-700">Adresse</span>
        <input
          type="text"
          value={value}
          onInput={(e) => handleInput((e.target as HTMLInputElement).value)}
          onFocus={() => { if (suggestions.value.length > 0) showDropdown.value = true; }}
          onBlur={handleBlur}
          placeholder={placeholder ?? "9 rue de l'Hôtel des Postes, Longjumeau..."}
          class="mt-1 block w-full min-h-[48px] rounded-lg border border-gray-300 px-3 py-2 text-base shadow-sm focus:border-betc-teal focus:ring-1 focus:ring-betc-teal touch-manipulation"
        />
      </label>

      {showDropdown.value && (
        <ul class="absolute z-20 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-[280px] overflow-y-auto">
          {suggestions.value.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                class="w-full text-left px-3 py-3 min-h-[48px] hover:bg-gray-50 active:bg-gray-100 touch-manipulation text-sm text-gray-800 border-b border-gray-100 last:border-b-0"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSelect(s)}
              >
                {s.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
