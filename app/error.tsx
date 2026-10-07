"use client";

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="grid-glow flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <p className="eyebrow">Something went wrong</p>
      <h1 className="display mt-3 text-4xl">We couldn&apos;t load this page</h1>
      <p className="mt-3 max-w-md text-white/60">Please try again. If the problem continues, return to the homepage.</p>
      <div className="mt-8 flex gap-3">
        <button onClick={reset} className="btn-primary">Try again</button>
        <a href="/venari" className="btn-ghost">Homepage</a>
      </div>
    </div>
  );
}
