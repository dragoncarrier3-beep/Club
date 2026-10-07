import Link from "next/link";

export default function NotFound() {
  return (
    <div className="grid-glow flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <p className="eyebrow">404</p>
      <h1 className="display mt-3 text-5xl">Page not found</h1>
      <p className="mt-3 max-w-md text-white/60">That page has been moved or never existed. Head back to the club homepage.</p>
      <Link href="/venari" className="btn-primary mt-8">Back to Venari</Link>
    </div>
  );
}
