"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { SiteShell } from "@/components/SiteShell";
import { useClub } from "@/lib/store";

export default function ClubLayout({ children }: { children: React.ReactNode }) {
  const { club: slug } = useParams<{ club: string }>();
  const club = useClub(slug);
  if (!club) {
    return (
      <div className="grid-glow flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <p className="eyebrow">Club not found</p>
        <h1 className="display mt-3 text-5xl">We don&apos;t know that club</h1>
        <p className="mt-3 text-white/60">The address may be mistyped, or the club is no longer on the platform.</p>
        <Link href="/venari" className="btn-primary mt-8">Go to Venari Esports</Link>
      </div>
    );
  }
  return <SiteShell club={club}>{children}</SiteShell>;
}
