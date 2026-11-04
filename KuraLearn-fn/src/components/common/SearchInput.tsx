import { useEffect, useState, useRef } from "react";
import { Search, Loader2, X } from "lucide-react";

export function SearchInput({
  value,
  onChange,
  placeholder = "Search...",
  debounceDelay = 350,
  loading = false,
  className = "",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  debounceDelay?: number;
  loading?: boolean;
  className?: string;
}) {
  const [localValue, setLocalValue] = useState(value);
  const isFirstMount = useRef(true);

  // Sync external value changes to local state
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Debounced trigger
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    const handler = setTimeout(() => {
      onChange(localValue);
    }, debounceDelay);

    return () => clearTimeout(handler);
  }, [localValue, onChange, debounceDelay]);

  return (
    <div className={`relative flex items-center ${className}`}>
      <span className="absolute left-3.5 text-slate-500">
        {loading ? (
          <Loader2 size={18} className="animate-spin text-[#6d3eeb]" />
        ) : (
          <Search size={18} />
        )}
      </span>
      <input
        type="text"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        placeholder={placeholder}
        className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-10 text-sm font-medium text-slate-900 transition placeholder:text-slate-400 hover:border-slate-300 focus:border-[#6d3eeb] focus:outline-none focus:ring-4 focus:ring-purple-100"
      />
      {localValue && (
        <button
          type="button"
          onClick={() => {
            setLocalValue("");
            onChange("");
          }}
          className="absolute right-3 grid h-7 w-7 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition"
        >
          <X size={15} />
        </button>
      )}
    </div>
  );
}
