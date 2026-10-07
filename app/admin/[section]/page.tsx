"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { EventsAdmin, HistoryAdmin, ManagementAdmin, NewsAdmin, ShopAdmin, SquadAdmin } from "@/components/admin/content";
import { useAdminClub } from "@/components/admin/Crud";
import { DonationsAdmin, LogsAdmin, OrdersAdmin, TrialsAdmin, UsersAdmin } from "@/components/admin/ops";
import { ClubsAdmin, ContentAdmin, SettingsAdmin, SocialsAdmin, StatisticsAdmin } from "@/components/admin/settings";
import { TacticsAdmin } from "@/components/admin/TacticsAdmin";
import { Empty } from "@/components/ui";

const SECTIONS: Record<string, React.ComponentType> = {
  news: NewsAdmin, events: EventsAdmin, squad: SquadAdmin, management: ManagementAdmin, history: HistoryAdmin, trials: TrialsAdmin, donations: DonationsAdmin,
  shop: ShopAdmin, orders: OrdersAdmin, tactics: TacticsAdmin, users: UsersAdmin, clubs: ClubsAdmin, socials: SocialsAdmin, content: ContentAdmin,
  statistics: StatisticsAdmin, logs: LogsAdmin, settings: SettingsAdmin,
};

export default function AdminSection() {
  const { section } = useParams<{ section: string }>();
  const club = useAdminClub();
  const Section = SECTIONS[section];
  if (!Section) {
    return <Empty title="Section not found" hint="That admin page does not exist."><Link href="/admin" className="btn-primary">Back to dashboard</Link></Empty>;
  }
  // Keyed by club so switching clubs never leaves another club's draft on screen.
  return <Section key={club.id} />;
}
