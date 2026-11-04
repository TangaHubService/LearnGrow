import { UserPlus } from "lucide-react";

export function RegistrationSuccess({ onReset }: { onReset: () => void }) {
  return (
    <div className="flex h-full items-center justify-center p-6">
      <div className="max-w-md w-full rounded-2xl bg-white p-8 text-center shadow-xl border border-slate-100 animate-in zoom-in-95 duration-300">
        <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-emerald-100 text-emerald-700">
          <UserPlus size={32} />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Student Registered!</h2>
        <p className="text-slate-500 mb-6">
          The student and their parent/guardian profiles have been successfully created.
        </p>
        <button
          onClick={onReset}
          className="w-full rounded-xl bg-[#6d3eeb] px-4 py-3 font-semibold text-white hover:bg-[#5b31cb] transition-colors"
        >
          Register Another Student
        </button>
      </div>
    </div>
  );
}
