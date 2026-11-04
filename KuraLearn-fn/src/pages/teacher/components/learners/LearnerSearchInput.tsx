import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";

interface LearnerSearchInputProps {
  value: string;
  onChange: (search: string) => void;
  placeholder?: string;
}

export function LearnerSearchInput({
  value,
  onChange,
  placeholder = "Search learners...",
}: LearnerSearchInputProps) {
  const [localSearch, setLocalSearch] = useState(value);
  const debouncedSearch = useDebounce(localSearch, 400);

  useEffect(() => {
    setLocalSearch(value);
  }, [value]);

  useEffect(() => {
    onChange(debouncedSearch);
  }, [debouncedSearch, onChange]);

  return (
    <label className="flex h-11 items-center gap-2.5 rounded-xl border border-slate-200 px-3.5 bg-white shadow-sm transition-all duration-200 focus-within:border-purple-600 focus-within:ring-2 focus-within:ring-purple-600/10">
      <Search size={18} className="text-slate-500" />
      <input
        type="text"
        className="min-w-0 flex-1 text-sm font-semibold text-slate-800 bg-transparent outline-none placeholder:text-slate-400"
        value={localSearch}
        onChange={(e) => setLocalSearch(e.target.value)}
        placeholder={placeholder}
      />
    </label>
  );
}
