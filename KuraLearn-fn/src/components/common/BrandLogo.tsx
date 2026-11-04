import kuraLogo from "@/assets/kuraLogo.png";

/** The logo has a white background, so it always sits on a white tile. */
export function BrandLogo({ className = "h-12 w-12" }: { className?: string }) {
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-xl bg-white p-1.5 shadow-md ring-1 ring-slate-200 ${className}`}
    >
      <img src={kuraLogo} alt="KuraLearn" className="h-full w-full object-contain" />
    </span>
  );
}
