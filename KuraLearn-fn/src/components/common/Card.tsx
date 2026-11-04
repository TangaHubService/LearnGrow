import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export function Card({ children, className = "", onClick }: CardProps) {
  const hasBg = className.includes("bg-");
  const hasText = className.includes("text-");
  const hasPadding = className.includes("p-");

  const Tag = onClick ? "button" : "section";

  return (
    <Tag
      onClick={onClick}
      className={`rounded-xl border border-slate-200 shadow-sm transition-all ${
        hasBg ? "" : "bg-white"
      } ${hasText ? "" : "text-slate-900"} ${
        hasPadding ? "" : "p-5"
      } ${onClick ? "text-left hover:shadow-md hover:border-slate-300 active:scale-[0.99]" : ""} ${className}`}
    >
      {children}
    </Tag>
  );
}
