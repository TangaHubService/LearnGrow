interface RetryErrorProps {
  message?: string;
  onRetry: () => void;
}

export function RetryError({ message = "Something went wrong", onRetry }: RetryErrorProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center" role="alert">
      <div className="mb-3 rounded-full bg-red-100 p-3">
        <svg
          className="h-6 w-6 text-red-600"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
          />
        </svg>
      </div>
      <h3 className="text-base font-semibold text-slate-800">Error</h3>
      <p className="mt-1 text-sm text-slate-500">{message}</p>
      <button
        onClick={onRetry}
        className="mt-4 rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
      >
        Try Again
      </button>
    </div>
  );
}
