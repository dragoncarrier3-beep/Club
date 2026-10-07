"use client";

import { useCurrentClub } from "@/components/SiteShell";
import { PageHero, RichText } from "@/components/ui";

export default function CopyrightPage() {
  const club = useCurrentClub();
  return (
    <>
      <PageHero eyebrow="Legal" title="Copyright & content use" sub={`How ${club.name} branding, images and video may be used.`} />
      <div className="wrap max-w-3xl py-10">
        {club.copyright ? <RichText html={club.copyright} /> : <p className="text-white/60">The club has not published a content-use statement yet.</p>}
      </div>
    </>
  );
}
