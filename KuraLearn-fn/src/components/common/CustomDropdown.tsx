import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Loader2, Search, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export type DropdownOption = {
  value: string;
  label: string;
  description?: string;
  keywords?: string;
  disabled?: boolean;
};

export function CustomDropdown({
  label,
  value,
  options,
  onChange,
  placeholder = "Select an option",
  disabled,
  loading,
  clearable = true,
  error,
  name,
  emptyMessage = "No results found.",
  emptyAction,
  position = "bottom",
  className,
  multiple = false,
}: {
  label?: string;
  value?: string | string[];
  options: DropdownOption[];
  onChange: (value: any) => void;
  placeholder?: string;
  disabled?: boolean;
  loading?: boolean;
  clearable?: boolean;
  error?: string;
  name?: string;
  emptyMessage?: string;
  emptyAction?: ReactNode;
  position?: "top" | "bottom";
  className?: string;
  multiple?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Cast value to array for standard handling
  const selectedValues = useMemo(() => {
    if (!value) return [];
    return Array.isArray(value) ? value : [value];
  }, [value]);

  const selectedOptions = useMemo(() => {
    return options.filter((option) => selectedValues.includes(option.value));
  }, [options, selectedValues]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return options;
    return options.filter((option) =>
      `${option.label} ${option.description ?? ""} ${option.keywords ?? ""}`
        .toLowerCase()
        .includes(normalized),
    );
  }, [options, query]);

  useEffect(() => {
    if (!open) return;
    searchRef.current?.focus();
    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    window.addEventListener("mousedown", handlePointerDown);
    return () => window.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  function selectOption(option: DropdownOption) {
    if (option.disabled) return;
    if (multiple) {
      const isSelected = selectedValues.includes(option.value);
      const nextValues = isSelected
        ? selectedValues.filter((v) => v !== option.value)
        : [...selectedValues, option.value];
      onChange(nextValues);
    } else {
      onChange(option.value);
      setQuery("");
      setOpen(false);
    }
  }

  function handleClear(event: React.MouseEvent) {
    event.stopPropagation();
    onChange(multiple ? [] : undefined);
    setQuery("");
  }

  const positionClasses =
    position === "top"
      ? "bottom-[calc(100%+0.5rem)] origin-bottom"
      : "top-[calc(100%+0.5rem)] origin-top";

  return (
    <div ref={rootRef} className="relative w-full">
      {label ? (
        <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
          {label}
        </label>
      ) : null}
      {name ? (
        <input
          type="hidden"
          name={name}
          value={multiple ? selectedValues.join(",") : ((value as string) ?? "")}
        />
      ) : null}
      {/* A div, because a real button may not contain the "remove" and "clear" buttons inside it. */}
      <div
        role="combobox"
        aria-label={label ?? selectedOptions[0]?.label ?? placeholder}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-disabled={disabled || loading}
        tabIndex={disabled || loading ? -1 : 0}
        onClick={() => {
          if (!disabled && !loading) setOpen((next) => !next);
        }}
        onKeyDown={(event) => {
          if (disabled || loading || event.target !== event.currentTarget) return;
          if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setOpen(event.key === "ArrowDown" ? true : (next) => !next);
          }
        }}
        className={`flex min-h-11 w-full items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5 text-left text-sm font-semibold transition-all duration-200 ${
          error
            ? "border-red-300 bg-red-50/10 focus:ring-4 focus:ring-red-100"
            : open
              ? "border-[#6d3eeb] bg-white ring-4 ring-purple-100/50 shadow-sm"
              : className && className.includes("border-")
                ? ""
                : "border-slate-200 bg-white hover:border-slate-350 hover:shadow-sm"
        } aria-disabled:cursor-not-allowed aria-disabled:bg-slate-50 aria-disabled:text-slate-500 ${className ?? ""}`}
      >
        <span className="min-w-0 flex-1">
          {selectedOptions.length > 0 ? (
            multiple ? (
              <div className="flex flex-wrap gap-1.5">
                {selectedOptions.map((opt) => (
                  <span
                    key={opt.value}
                    className="inline-flex items-center gap-1 rounded-lg bg-purple-50 border border-purple-100 px-2 py-0.5 text-xs font-bold text-[#6d3eeb]"
                  >
                    <span>{opt.label}</span>
                    {!disabled && (
                      <span
                        role="button"
                        tabIndex={0}
                        aria-label={`Remove ${opt.label}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onChange(selectedValues.filter((v) => v !== opt.value));
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            e.stopPropagation();
                            onChange(selectedValues.filter((v) => v !== opt.value));
                          }
                        }}
                        className="grid h-3.5 w-3.5 place-items-center rounded-md hover:bg-purple-100 hover:text-purple-800"
                      >
                        <X size={10} className="stroke-[2.5]" />
                      </span>
                    )}
                  </span>
                ))}
              </div>
            ) : (
              <span className="block truncate text-slate-800 font-bold">
                {selectedOptions[0].label}
                {selectedOptions[0].description && (
                  <span className="ml-2 text-xs font-normal text-slate-500">
                    {selectedOptions[0].description}
                  </span>
                )}
              </span>
            )
          ) : (
            <span className="block truncate text-slate-500 font-medium">{placeholder}</span>
          )}
        </span>
        <span className="flex shrink-0 items-center gap-1.5">
          {loading ? <Loader2 size={16} className="animate-spin text-slate-500" /> : null}
          {clearable && selectedOptions.length > 0 && !disabled ? (
            <span
              role="button"
              tabIndex={0}
              aria-label="Clear selected values"
              onClick={handleClear}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  handleClear(event as unknown as React.MouseEvent);
                }
              }}
              className="grid h-6 w-6 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-650 transition-colors"
            >
              <X size={14} className="stroke-[2.5]" />
            </span>
          ) : null}
          <ChevronDown
            size={16}
            className={`text-slate-500 transition-transform duration-250 ease-out stroke-[2.5] ${
              open ? "rotate-180 text-slate-700" : ""
            }`}
          />
        </span>
      </div>
      {error ? <p className="mt-1.5 text-xs font-bold text-red-650">{error}</p> : null}

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: position === "top" ? 6 : -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: position === "top" ? 6 : -6 }}
            transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className={`absolute left-0 right-0 ${positionClasses} z-[80] overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-lg`}
          >
            <div className="border-b border-slate-100 p-2">
              <div className="flex h-10 items-center gap-2 rounded-xl bg-slate-50 px-3 border border-slate-100">
                <Search size={15} className="text-slate-500 stroke-[2.5]" />
                <input
                  ref={searchRef}
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value);
                    setActiveIndex(0);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Escape") setOpen(false);
                    if (event.key === "ArrowDown") {
                      event.preventDefault();
                      setActiveIndex((index) => Math.min(filtered.length - 1, index + 1));
                    }
                    if (event.key === "ArrowUp") {
                      event.preventDefault();
                      setActiveIndex((index) => Math.max(0, index - 1));
                    }
                    if (event.key === "Enter") {
                      event.preventDefault();
                      const option = filtered[activeIndex];
                      if (option) selectOption(option);
                    }
                  }}
                  placeholder="Search options..."
                  className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-slate-700 outline-none placeholder:text-slate-400 placeholder:font-medium"
                />
              </div>
            </div>
            <div className="max-h-64 overflow-y-auto p-1.5 space-y-0.5 custom-scrollbar">
              {loading ? (
                <div className="flex items-center gap-2 p-3 text-sm font-bold text-slate-500">
                  <Loader2 size={15} className="animate-spin text-[#6d3eeb]" />
                  <span>Loading options...</span>
                </div>
              ) : null}
              {!loading && filtered.length === 0 ? (
                <div className="p-3 text-sm font-semibold text-slate-500">
                  <p>{emptyMessage}</p>
                  {emptyAction ? <div className="mt-3">{emptyAction}</div> : null}
                </div>
              ) : null}
              {!loading &&
                filtered.map((option, index) => {
                  const isSelected = selectedValues.includes(option.value);
                  const isActive = index === activeIndex;
                  return (
                    <button
                      key={`${option.value}-${index}`}
                      type="button"
                      disabled={option.disabled}
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={() => selectOption(option)}
                      className={`flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-40 ${
                        isSelected
                          ? "bg-purple-50/70 text-[#6d3eeb] font-bold"
                          : isActive
                            ? "bg-slate-50 text-slate-900"
                            : "text-slate-650 hover:bg-slate-50/50"
                      }`}
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-bold">{option.label}</span>
                        {option.description ? (
                          <span
                            className={`mt-0.5 block text-xs font-medium ${
                              isSelected ? "text-purple-400" : "text-slate-500"
                            }`}
                          >
                            {option.description}
                          </span>
                        ) : null}
                      </span>
                      {isSelected ? (
                        <Check size={16} className="mt-0.5 shrink-0 stroke-[2.5]" />
                      ) : null}
                    </button>
                  );
                })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
