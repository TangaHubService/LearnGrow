import { ReactNode } from "react";

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "danger" | "ghost" | "outline";
  type?: "button" | "submit";
  disabled?: boolean;
  form?: string;
  className?: string;
  size?: "xs" | "sm" | "md" | "lg";
  fullWidth?: boolean;
  "aria-label"?: string;
}

export function Button({
  children,
  onClick,
  variant = "primary",
  type = "button",
  disabled,
  form,
  className = "",
  size = "md",
  fullWidth = false,
  "aria-label": ariaLabel,
}: ButtonProps) {
  const hasBg = className.includes("bg-");
  const hasText = className.includes("text-");
  const hasBorder = className.includes("border");

  const variantClasses =
    variant === "primary"
      ? `${hasBg ? "" : "bg-[#6d3eeb]"} ${hasText ? "" : "text-white"} hover:bg-[#5b31cb]`
      : variant === "danger"
        ? `${hasBg ? "" : "bg-red-600"} ${hasText ? "" : "text-white"} hover:bg-red-700`
        : variant === "ghost"
          ? "bg-transparent text-slate-600 hover:bg-slate-100"
          : variant === "outline"
            ? "border border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50"
            : `${hasBorder ? "" : "border border-slate-200"} ${hasBg ? "" : "bg-white"} ${hasText ? "" : "text-slate-700"} hover:bg-slate-50`;

  const sizeClasses =
    size === "xs"
      ? "h-7 px-2 text-[10px]"
      : size === "sm"
        ? "h-8 px-3 text-xs"
        : size === "lg"
          ? "h-11 px-6 text-base"
          : "h-9 px-4 text-sm";

  return (
    <button
      type={type}
      form={form}
      disabled={disabled}
      onClick={onClick}
      aria-label={ariaLabel}
      className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-lg font-bold transition focus:outline-none focus:ring-4 focus:ring-purple-100 disabled:cursor-not-allowed disabled:opacity-60 ${variantClasses} ${sizeClasses} ${fullWidth ? "w-full" : ""} ${className}`}
    >
      {children}
    </button>
  );
}
