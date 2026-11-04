import { ReactNode, useMemo } from "react";
import { CustomDropdown, type DropdownOption } from "./CustomDropdown";

export function EntitySelect<T>({
  label,
  value,
  onChange,
  options,
  loading,
  error,
  placeholder = "Select record",
  disabled,
  name,
  required,
  getOptionLabel,
  getOptionValue,
  getOptionDescription,
  searchKeys = [],
  emptyMessage = "No records found.",
  emptyAction,
}: {
  label?: string;
  value?: string;
  onChange: (value: string | undefined, option?: T) => void;
  options: T[];
  loading?: boolean;
  error?: string;
  placeholder?: string;
  disabled?: boolean;
  name?: string;
  required?: boolean;
  getOptionLabel: (option: T) => string;
  getOptionValue: (option: T) => string;
  getOptionDescription?: (option: T) => string | undefined;
  searchKeys?: Array<(option: T) => string | undefined>;
  emptyMessage?: string;
  emptyAction?: ReactNode;
}) {
  const dropdownOptions = useMemo<DropdownOption[]>(
    () =>
      options.map((option) => {
        const value = getOptionValue(option);
        const searchText = searchKeys
          .map((getKey) => getKey(option))
          .filter(Boolean)
          .join(" ");
        return {
          value,
          label: getOptionLabel(option),
          description: getOptionDescription?.(option),
          keywords: searchText,
        };
      }),
    [getOptionDescription, getOptionLabel, getOptionValue, options, searchKeys],
  );

  return (
    <div>
      {name ? (
        <input
          type="hidden"
          name={name}
          value={value ?? ""}
          data-required={required ? "true" : undefined}
        />
      ) : null}
      <CustomDropdown
        label={label}
        value={value}
        options={dropdownOptions}
        placeholder={placeholder}
        loading={loading}
        disabled={disabled}
        error={error}
        emptyMessage={emptyMessage}
        emptyAction={emptyAction}
        onChange={(nextValue) =>
          onChange(
            nextValue,
            options.find((option) => getOptionValue(option) === nextValue),
          )
        }
      />
    </div>
  );
}
