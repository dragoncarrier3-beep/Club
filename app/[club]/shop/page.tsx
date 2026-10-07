"use client";

import Link from "next/link";
import { useState } from "react";
import { ProductArt } from "@/components/art";
import { useCurrentClub } from "@/components/SiteShell";
import { Badge, Empty, PageHero } from "@/components/ui";
import { useStore } from "@/lib/store";
import { cx, money } from "@/lib/utils";

const CATS = ["All", "Jerseys", "Hoodies", "T-Shirts", "Accessories"];

export default function ShopPage() {
  const club = useCurrentClub();
  const { db } = useStore();
  const [cat, setCat] = useState("All");
  const all = db.products.filter((p) => p.clubId === club.id && p.active);
  const list = cat === "All" ? all : all.filter((p) => p.category === cat);
  return (
    <>
      <PageHero eyebrow="Official merchandise" title={`${club.name.split(" ")[0]} store`} sub="Every order is packed and posted by the club." />
      <div className="wrap py-10">
        <div className="mb-6 flex flex-wrap gap-2">
          {CATS.map((c) => <button key={c} onClick={() => setCat(c)} className={cx("chip transition", cat === c && "!border-accent/60 !bg-accent/10 !text-accent")}>{c}</button>)}
        </div>
        {list.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {list.map((p) => (
              <Link key={p.id} href={`/${club.slug}/shop/${p.id}`} className="card card-hover group overflow-hidden">
                <div className="relative">
                  <ProductArt product={p} className="h-56 w-full" />
                  <div className="absolute left-3 top-3 flex gap-1.5">
                    {p.stock <= 0 && <Badge tone="red">Out of stock</Badge>}
                    {p.salePrice != null && p.stock > 0 && <Badge tone="accent">Sale</Badge>}
                  </div>
                </div>
                <div className="border-t border-line p-4">
                  <p className="text-[11px] uppercase tracking-wider text-white/45">{p.category}</p>
                  <p className="display mt-1 text-xl group-hover:text-accent">{p.name}</p>
                  <p className="mt-2 font-display text-xl font-bold">
                    {p.salePrice != null ? <><span className="text-accent">{money(p.salePrice)}</span> <span className="text-sm text-white/40 line-through">{money(p.price)}</span></> : money(p.price)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <Empty title="No products in this category" hint="Check back soon — new items are added regularly." />
        )}
      </div>
    </>
  );
}
