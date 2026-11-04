import { CustomDropdown, type DropdownOption } from "./CustomDropdown";

export type { DropdownOption };

export function FilterDropdown({
  label,
  value,
  options,
  onChange,
  placeholder,
  className = "",
  loading = false,
}: {
  label?: string;
  value?: string;
  options: DropdownOption[];
  onChange: (value: string | undefined) => void;
  placeholder?: string;
  className?: string;
  loading?: boolean;
}) {
  return (
    <div className={className}>
      <CustomDropdown
        label={label}
        value={value}
        options={options}
        onChange={onChange}
        placeholder={placeholder}
        loading={loading}
        clearable={true}
      />
    </div>
  );
}
