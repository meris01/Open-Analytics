'use client';
export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="headline-lg">Something broke</h1>
      <p className="max-w-md text-[13px] text-fg-muted">{error.message}</p>
      <button className="btn btn-primary" onClick={reset}>Try again</button>
    </div>
  );
}
