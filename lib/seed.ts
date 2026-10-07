import type { Club, ClubEvent, DB, Era, Marker, Match, Player, Product, Tactic, Trial, User, Order, News } from "./types";
import { DAY, HOUR, rng, slugify } from "./utils";

export const DB_VERSION = 3;
export const DEMO_PASSWORD = "demo1234";

const p = (s: string) => `<p>${s}</p>`;

function nextFriday(now: number) {
  const d = new Date(now);
  d.setHours(20, 30, 0, 0);
  let add = (5 - d.getDay() + 7) % 7;
  if (add === 0 && d.getTime() < now) add = 7;
  return d.getTime() + add * DAY;
}

const at = (base: number, days: number, h: number, m: number) => {
  const d = new Date(base + days * DAY);
  d.setHours(h, m, 0, 0);
  return d.getTime();
};

const socials = (handle: string) => ({
  twitch: "https://www.twitch.tv/",
  discord: "https://discord.com/",
  x: "https://x.com/",
  youtube: "https://www.youtube.com/",
  tiktok: "",
  instagram: "",
});

const copyrightText = (name: string, email: string) =>
  [
    `<h2>Club branding</h2>`,
    p(`The ${name} name, crest, kit designs and visual identity belong to the club. They may not be used to suggest endorsement or affiliation without written permission.`),
    `<h2>Logos and images</h2>`,
    p(`Please do not copy, edit or redistribute our logos, player graphics or match imagery. Sharing an unedited post with a clear credit to ${name} is welcome.`),
    `<h2>Video and stream content</h2>`,
    p(`Match broadcasts, highlights and clips published on our channels remain the property of the club and the players involved.`),
    `<h2>Reproduction</h2>`,
    p(`Content from this website may not be reproduced commercially. Short quotations for news or community coverage are fine when credited.`),
    `<h2>Permission requests</h2>`,
    p(`To request permission, contact <strong>${email}</strong> and tell us what you would like to use and where.`),
    p(`<em>This page is a plain-language statement of the club's wishes. It is not legal advice.</em>`),
  ].join("");

function clubs(now: number): Club[] {
  return [
    {
      id: "venari", slug: "venari", name: "Venari Esports", short: "VEN", tagline: "Compete. Evolve. Dominate.",
      accent: "198 255 46", founded: 2017, league: "VPG Premier League",
      about: {
        heading: "About Venari",
        body:
          p("Venari Esports is a competitive EA FC club built around teamwork, consistency and long-term development. Our goal is to compete at the highest possible level while building a strong community around the club.") +
          p("Founded in 2017 by a small group of friends playing Pro Clubs after work, Venari has grown into an organised squad with a full management team, structured training nights and a place in the VPG Premier League.") +
          p("We recruit for attitude first. Every player who wears the badge is expected to communicate, to turn up, and to play for the eleven."),
        values: ["Teamwork", "Consistency", "Development", "Respect"],
      },
      copyright: copyrightText("Venari Esports", "contact@venari.demo"),
      contact: { general: "contact@venari.demo", recruitment: "trials@venari.demo" },
      socials: socials("venari"), lastActivityAt: now - 7 * 60000, donationGoal: 1000,
    },
    {
      id: "goytre", slug: "goytre", name: "Goytre Esports", short: "GOY", tagline: "Built in the valleys.",
      accent: "56 189 248", founded: 2019, league: "VPG Championship",
      about: {
        heading: "About Goytre",
        body:
          p("Goytre Esports is the virtual home of a proud community club. We play organised 11-a-side EA FC and give local players a route into competitive Pro Clubs.") +
          p("The squad trains twice a week and competes in the VPG Championship, with promotion the clear target this season."),
        values: ["Community", "Work rate", "Honesty"],
      },
      copyright: copyrightText("Goytre Esports", "contact@goytre.demo"),
      contact: { general: "contact@goytre.demo", recruitment: "trials@goytre.demo" },
      socials: socials("goytre"), lastActivityAt: now - 2 * HOUR, donationGoal: 600,
    },
    {
      id: "aeternum", slug: "aeternum", name: "Aeternum FC", short: "AET", tagline: "Forever forward.",
      accent: "196 167 255", founded: 2021, league: "VPG League One",
      about: {
        heading: "About Aeternum",
        body:
          p("Aeternum FC is a young club with a simple idea: play brave, possession-first football and enjoy it.") +
          p("Formed in 2021, the club has climbed a division in each of its first two seasons and is building a squad to keep going."),
        values: ["Ambition", "Style", "Togetherness"],
      },
      copyright: copyrightText("Aeternum FC", "contact@aeternum.demo"),
      contact: { general: "contact@aeternum.demo", recruitment: "trials@aeternum.demo" },
      socials: socials("aeternum"), lastActivityAt: now - 26 * HOUR, donationGoal: 500,
    },
  ];
}

type PRow = [number, string, string, string, string, string, number, number, number, number, number, number, number];
// kit, first, tag, last, pos, nationality, apps, goals, assists, cleanSheets, rating, motm, yellow
const VENARI_PLAYERS: PRow[] = [
  [1, "Aaron", "LOCK", "Davies", "GK", "Wales", 28, 0, 0, 11, 7.6, 3, 1],
  [2, "Ryan", "AXIS", "Moore", "RB", "England", 26, 2, 7, 0, 7.3, 1, 3],
  [4, "Ethan", "RIFT", "Cole", "CB", "England", 32, 3, 1, 0, 7.5, 2, 4],
  [5, "Daniel", "WALL", "Hughes", "CB", "Wales", 29, 2, 0, 0, 7.4, 1, 5],
  [3, "Lewis", "FROST", "Evans", "LB", "Wales", 24, 0, 6, 0, 7.2, 0, 2],
  [6, "Noah", "CORE", "Bennett", "CDM", "Scotland", 30, 4, 8, 0, 7.7, 2, 6],
  [8, "Oliver", "PULSE", "Reed", "CM", "England", 27, 7, 9, 0, 7.8, 3, 2],
  [10, "Liam", "NOVA", "Price", "CAM", "Ireland", 31, 12, 14, 0, 8.2, 6, 1],
  [7, "Mason", "FLASH", "Clarke", "RW", "England", 25, 11, 8, 0, 7.9, 3, 1],
  [11, "Jacob", "ECHO", "Lewis", "LW", "Wales", 29, 13, 10, 0, 8.0, 4, 2],
  [9, "Jay", "VEX", "Morgan", "ST", "England", 31, 18, 6, 0, 8.4, 7, 2],
  [14, "Luke", "STRIKE", "Harris", "ST", "Scotland", 18, 9, 3, 0, 7.5, 2, 1],
];

const BIOS: Record<string, string> = {
  GK: "Commanding shot-stopper who organises the back line and starts attacks with quick distribution.",
  DEF: "Reliable defender who reads the game early and is comfortable playing out from the back.",
  MID: "Keeps the side ticking in midfield, always available for the pass and quick to press when possession is lost.",
  FWD: "Direct, sharp in the box and always looking to run in behind. A constant threat in the final third.",
};

export function lineOf(pos: string): "GK" | "DEF" | "MID" | "FWD" {
  if (pos === "GK") return "GK";
  if (["CB", "LB", "RB", "LWB", "RWB"].includes(pos)) return "DEF";
  if (["CDM", "CM", "CAM", "LM", "RM"].includes(pos)) return "MID";
  return "FWD";
}

function mkPlayer(clubId: string, r: PRow, now: number, i: number): Player {
  const [kit, first, tag, last, pos, nat, apps, goals, assists, cs, rating, motm, yellow] = r;
  return {
    id: `${clubId}-p${kit}`, clubId, gamerTag: tag, firstName: first, lastName: last,
    eaId: `${tag.toLowerCase()}_${clubId.slice(0, 3)}`, position: pos, kitNumber: kit, nationality: nat,
    status: "active", joinedAt: now - (900 - i * 55) * DAY, bio: BIOS[lineOf(pos)],
    stats: { apps, goals, assists, cleanSheets: cs, rating, motm, yellow, red: 0 },
  };
}

function genPlayers(clubId: string, names: [string, string, string][], now: number): Player[] {
  const shape: [number, string][] = [[1, "GK"], [2, "RB"], [5, "CB"], [6, "CB"], [3, "LB"], [4, "CDM"], [8, "CM"], [10, "CAM"], [7, "RW"], [11, "LW"], [9, "ST"]];
  const r = rng(clubId);
  return names.map(([first, tag, last], i) => {
    const [kit, pos] = shape[i];
    const line = lineOf(pos);
    const apps = 16 + Math.floor(r() * 12);
    const goals = line === "FWD" ? 6 + Math.floor(r() * 9) : line === "MID" ? 2 + Math.floor(r() * 6) : line === "DEF" ? Math.floor(r() * 3) : 0;
    const assists = line === "GK" ? 0 : 1 + Math.floor(r() * 8);
    return mkPlayer(clubId, [kit, first, tag, last, pos, ["Wales", "England", "Scotland"][i % 3], apps, goals, assists, line === "GK" ? 4 + Math.floor(r() * 5) : 0, Math.round((6.9 + r() * 1.2) * 10) / 10, Math.floor(r() * 4), Math.floor(r() * 4)], now, i);
  });
}

type MRow = [string, boolean, number, number, string, number, string[], string];
// opponent, home, gf, ga, competition, days ago, scorers, motm
const VENARI_MATCHES: MRow[] = [
  ["Titan FC", true, 3, 2, "VPG Premier League", 2, ["VEX 14'", "NOVA 52'", "VEX 88'"], "VEX"],
  ["Apex FC", false, 2, 2, "VPG Premier League", 5, ["ECHO 31'", "PULSE 70'"], "PULSE"],
  ["Legacy FC", true, 4, 1, "VPG Premier League", 9, ["VEX 8'", "FLASH 27'", "NOVA 61'", "STRIKE 83'"], "NOVA"],
  ["Phoenix United", false, 0, 1, "VPG Premier League", 12, [], "LOCK"],
  ["Royal XI", true, 2, 0, "VPG Premier League", 16, ["ECHO 40'", "VEX 77'"], "LOCK"],
  ["Nova Athletic", true, 3, 1, "VPG Premier League", 19, ["FLASH 12'", "VEX 45'", "CORE 68'"], "FLASH"],
  ["Storm City", false, 2, 0, "VPG Premier League", 23, ["NOVA 33'", "ECHO 59'"], "RIFT"],
  ["Titan FC", true, 1, 1, "VPG Cup", 26, ["PULSE 81'"], "CORE"],
  ["Legacy FC", false, 3, 2, "VPG Premier League", 30, ["VEX 20'", "VEX 49'", "ECHO 90'"], "VEX"],
  ["Dynamo eSC", true, 5, 0, "VPG Cup", 33, ["VEX 5'", "FLASH 22'", "NOVA 38'", "STRIKE 66'", "STRIKE 79'"], "NOVA"],
  ["Apex FC", false, 1, 3, "VPG Premier League", 37, ["FLASH 55'"], "FLASH"],
  ["Phoenix United", true, 2, 1, "VPG Premier League", 40, ["NOVA 17'", "RIFT 74'"], "RIFT"],
];

function mkMatches(clubId: string, rows: MRow[], now: number): Match[] {
  return rows.map(([opponent, home, gf, ga, competition, days, scorers, motm], i) => ({
    id: `${clubId}-m${i + 1}`, clubId, opponent, home, gf, ga, competition, playedAt: at(now, -days, 20, 30), scorers, motm,
  }));
}

function genMatches(clubId: string, opponents: string[], league: string, tags: string[], now: number): Match[] {
  const r = rng(clubId + "m");
  return mkMatches(
    clubId,
    opponents.map((o, i) => {
      const gf = Math.floor(r() * 4);
      const ga = Math.floor(r() * 3);
      const scorers = Array.from({ length: gf }, (_, k) => `${tags[7 + Math.floor(r() * 4)]} ${10 + k * 23 + Math.floor(r() * 9)}'`);
      return [o, i % 2 === 0, gf, ga, league, 3 + i * 4, scorers, tags[Math.floor(r() * tags.length)]] as MRow;
    }),
    now
  );
}

const ERAS: [string, string, number, number, number, string, string, string[], string][] = [
  ["FIFA 17", "The Beginning", 2017, 64, 38, "3rd", "Raven — 27 Goals", ["First competitive season", "First cup final", "10-match unbeaten run"], "Venari started as six friends and a group chat. By the end of the first season the club had a full eleven, a fixed training night and a third-place finish nobody expected."],
  ["FIFA 18", "Finding Our Feet", 2018, 72, 41, "4th", "Raven — 31 Goals", ["First away kit released", "Squad grows to 18 players", "Reached cup semi-final"], "A longer season and a deeper squad. Results dipped mid-year, but the club learned how to rotate and how to win ugly."],
  ["FIFA 19", "First Silverware", 2019, 80, 52, "1st", "Hex — 34 Goals", ["Division champions", "Promotion secured", "Best defensive record in the league"], "The season everything clicked. A new back four conceded less than a goal a game and the title was sealed with two matches to spare."],
  ["FIFA 20", "Stepping Up", 2020, 76, 39, "6th", "Hex — 22 Goals", ["Survived first top-flight season", "Launched club Discord", "Record home win: 7–0"], "Life in the higher division was a shock. Venari stayed up comfortably and built the community that still surrounds the club today."],
  ["FIFA 21", "The Rebuild", 2021, 70, 36, "5th", "Nova — 19 Goals", ["New management team appointed", "Academy trials introduced", "Liam “NOVA” Price debut season"], "Several founding players stepped back, and a new management team rebuilt the squad around younger players and a clearer style."],
  ["FIFA 22", "Cup Run", 2022, 84, 55, "2nd", "Vex — 29 Goals", ["VPG Cup finalists", "14 clean sheets", "Jay “VEX” Morgan signs"], "A memorable cup run ended one match short, but a second-place league finish confirmed Venari as a genuine contender."],
  ["FIFA 23", "Consistency", 2023, 88, 57, "3rd", "Vex — 33 Goals", ["Third consecutive top-five finish", "First live-streamed season", "Supporter donations launched"], "Every match was streamed for the first time, the supporter base grew, and the squad proved it could deliver week after week."],
  ["EA SPORTS FC 24", "A New Era", 2024, 90, 61, "2nd", "Vex — 36 Goals", ["Highest points total in club history", "Unbeaten at home", "First merchandise range"], "A new game, the same standards. Venari went the whole season unbeaten at home and missed the title on goal difference."],
  ["EA SPORTS FC 25", "100 Wins", 2025, 86, 58, "3rd", "Echo — 24 Goals", ["100th competitive league win", "Two players in Team of the Season", "Cup quarter-finalists"], "A landmark year. The hundredth competitive win arrived in spring and two Venari players were named in the league's Team of the Season."],
  ["EA SPORTS FC 26", "The Chase", 2026, 32, 20, "3rd (in progress)", "Vex — 18 Goals", ["Season in progress", "Longest winning run: 6 matches", "Cup quarter-final reached"], "The current campaign. Venari sit third in the VPG Premier League with the title race still wide open."],
];

function mkTactic(clubId: string, i: number, name: string, formation: string, published: boolean, markers: Marker[], notes: string[], now: number): Tactic {
  const titles = ["Formation", "Build-up", "Defensive Shape", "Attacking Patterns", "Set Pieces", "Match Notes"];
  return { id: `${clubId}-t${i}`, clubId, name, formation, published, markers, images: [], updatedAt: now - i * 3 * DAY, sections: titles.map((title, k) => ({ title, body: notes[k] })) };
}

const M = (s: string): Marker[] =>
  s.split(" ").map((t) => {
    const [label, x, y] = t.split(":");
    return { label, x: +x, y: +y };
  });

export const FORMATIONS: Record<string, Marker[]> = {
  "4-2-3-1": M("GK:50:92 LB:14:72 LCB:37:78 RCB:63:78 RB:86:72 LDM:38:58 RDM:62:58 LAM:18:36 CAM:50:38 RAM:82:36 ST:50:16"),
  "4-3-3": M("GK:50:92 LB:14:72 LCB:37:78 RCB:63:78 RB:86:72 CDM:50:60 LCM:32:46 RCM:68:46 LW:16:22 RW:84:22 ST:50:14"),
  "3-5-2": M("GK:50:92 LCB:28:78 CB:50:80 RCB:72:78 LWB:10:52 RWB:90:52 CDM:50:60 LCM:34:44 RCM:66:44 LS:40:16 RS:60:16"),
  "4-4-2": M("GK:50:92 LB:14:72 LCB:37:78 RCB:63:78 RB:86:72 LM:14:46 LCM:38:50 RCM:62:50 RM:86:46 LS:40:18 RS:60:18"),
};

function venariTactics(now: number): Tactic[] {
  return [
    mkTactic("venari", 1, "Controlled 4-2-3-1", "4-2-3-1", true, FORMATIONS["4-2-3-1"], [
      "Our default shape. Two holding midfielders protect the centre-backs so the full-backs can join attacks one at a time.",
      "Goalkeeper plays short to either centre-back. LDM drops between them to make a three; RDM stays one line higher as the free man. Do not force the pass into CAM — go round if the middle is closed.",
      "Mid block, 4-4-1-1 without the ball. Wide attackers track full-backs to the halfway line only. ST shows the ball to one side and the CAM screens their pivot.",
      "Overload the left: LB, LAM and CAM make a triangle, then switch quickly to RAM in space. ST runs near post, RAM arrives far post, CAM holds the edge of the box.",
      "Corners: near-post flick from RCB, LCB attacks the penalty spot, both DMs stay back. Free kicks inside 25 yards belong to NOVA.",
      "Titan FC press hard for the first 15 minutes. Go long to VEX early, win the second ball, and settle once their press drops.",
    ], now),
    mkTactic("venari", 2, "High Press 4-3-3", "4-3-3", true, FORMATIONS["4-3-3"], [
      "Used when we need to force the game. High line, three forwards pressing their back four, single pivot behind.",
      "Play through the thirds quickly. Full-backs high and wide from the first pass; the CDM is the only safety option.",
      "Press on the trigger: any backwards pass to their goalkeeper. Wingers jump the centre-backs, ST cuts the switch, both CMs lock on man-to-man.",
      "Win it high and shoot within three passes. Wingers stay narrow in transition so the full-backs can overlap.",
      "Short corners to drag markers out, then cross to the back post. Defensive corners: two players left up to pin their full-backs.",
      "High energy cost — maximum 30 minutes at a time. Captain calls the switch back to 4-2-3-1.",
    ], now),
    mkTactic("venari", 3, "Late Game 3-5-2", "3-5-2", false, FORMATIONS["3-5-2"], [
      "For protecting a lead in the final 15 minutes. Three centre-backs, wing-backs level with the midfield, two up to hold the ball.",
      "No risks. Clear the first line, strikers hold it in the corners, wing-backs only support on the ball side.",
      "Low block, 5-3-2. Nobody dives in. Force crosses from deep and trust the three centre-backs in the air.",
      "Counter only with the two strikers and one runner from midfield. Everyone else holds position.",
      "Everybody back for defensive set pieces. Take our own corners short and keep the ball.",
      "Draft — still being tested in training before it is published to the squad.",
    ], now),
  ];
}

const TRIALS: [string, string, number, string, string, Trial["status"]][] = [
  ["Callum Wright", "Hawk", 22, "ST", "CAM", "New"],
  ["Ben Thompson", "Orbit", 19, "CM", "CDM", "New"],
  ["Jamie O'Neill", "Drift", 24, "LB", "LWB", "New"],
  ["Tyler Grant", "Zenith", 21, "GK", "CB", "Reviewing"],
  ["Sam Patel", "Mirage", 26, "RW", "ST", "Reviewing"],
  ["Connor Walsh", "Blitz", 20, "CB", "CDM", "Trial Offered"],
  ["Rhys Jenkins", "Onyx", 23, "CAM", "CM", "Trial Offered"],
  ["Marcus Lee", "Havoc", 25, "CDM", "CB", "Accepted"],
  ["Adam Foster", "Quake", 18, "LW", "RW", "Rejected"],
  ["Josh Barker", "Titan", 27, "RB", "RWB", "Rejected"],
];

const USERS: [string, User["role"], User["status"]][] = [
  ["AlexVenari", "admin", "active"], ["JordanVFC", "admin", "active"], ["VexMorgan", "member", "active"],
  ["NovaPrice", "member", "active"], ["RiftCole", "member", "active"], ["LockDavies", "member", "active"],
  ["EchoLewis", "member", "active"], ["PulseReed", "member", "active"], ["FlashClarke", "member", "active"],
  ["CoreBennett", "member", "active"], ["TerraceTom", "member", "active"], ["ValleyFan88", "member", "active"],
  ["HuntersEnd", "member", "pending"], ["KitCollector", "member", "active"], ["OldSchoolRaven", "member", "active"],
  ["SpamBot4000", "member", "suspended"], ["MatchdayMia", "member", "active"], ["StreamSniper", "member", "pending"],
];

const DONATIONS = [50, 20, 10, 5, 50, 20, 25, 100, 20, 10, 50, 35, 20, 50, 10, 20, 5, 50, 15, 20, 10, 50, 20, 20];
const SUPPORTERS = ["Tom H.", "Anonymous", "Mia R.", "Dave P.", "Raven", "Anonymous", "Sarah L.", "Valley Motors", "Chris E.", "Anonymous", "Hex", "Owen T.", "Anonymous", "Gareth W.", "Ellie M.", "Anonymous", "Jack S.", "Priya K.", "Anonymous", "Rob D.", "Anonymous", "Nia J.", "Luca B.", "Anonymous"];

function venariProducts(): Product[] {
  const mk = (i: number, name: string, category: Product["category"], price: number, sizes: string[], stock: number, description: string, salePrice?: number): Product => ({
    id: `venari-pr${i}`, clubId: "venari", name, sku: `VEN-${String(i).padStart(3, "0")}`, description, category, price, salePrice, sizes, stock, active: true,
  });
  const apparel = ["S", "M", "L", "XL", "XXL"];
  return [
    mk(1, "Venari 2026 Home Jersey", "Jerseys", 44.99, apparel, 24, "The official 2026 home shirt. Lightweight breathable fabric with a sublimated crest and sponsor-ready chest panel."),
    mk(2, "Venari Pro Hoodie", "Hoodies", 54.99, apparel, 15, "Heavyweight brushed-fleece hoodie with embroidered crest and tonal sleeve print. Built for cold matchday evenings."),
    mk(3, "Venari Logo T-Shirt", "T-Shirts", 24.99, apparel, 40, "Everyday cotton tee with the Venari wordmark across the chest."),
    mk(4, "Venari Cap", "Accessories", 19.99, ["One Size"], 18, "Six-panel cap with embroidered crest and adjustable strap."),
    mk(5, "Venari Mug", "Accessories", 12.99, [], 30, "Ceramic 11oz mug in matte black. Dishwasher safe."),
    mk(6, "Venari 2025 Away Jersey", "Jerseys", 44.99, apparel, 0, "Last season's away shirt. Limited remaining stock.", 29.99),
  ];
}

function venariOrders(now: number): Order[] {
  const rows: [string, string, string, number, string, number, Order["status"], number][] = [
    ["Sophie Allen", "Venari Pro Hoodie", "M", 54.99, "venari-pr2", 1, "New", 0.2],
    ["Daniel Brooks", "Venari 2026 Home Jersey", "XL", 44.99, "venari-pr1", 2, "New", 0.6],
    ["Hannah Cooper", "Venari Mug", "", 12.99, "venari-pr5", 2, "Processing", 1],
    ["Owen Tucker", "Venari Cap", "One Size", 19.99, "venari-pr4", 1, "Processing", 2],
    ["Priya Kaur", "Venari Logo T-Shirt", "S", 24.99, "venari-pr3", 1, "Shipped", 4],
    ["Gareth Wynne", "Venari 2026 Home Jersey", "L", 44.99, "venari-pr1", 1, "Shipped", 5],
    ["Ellie Marsh", "Venari Pro Hoodie", "L", 54.99, "venari-pr2", 1, "Completed", 9],
    ["Jack Simmons", "Venari Logo T-Shirt", "M", 24.99, "venari-pr3", 3, "Completed", 12],
    ["Nia James", "Venari Cap", "One Size", 19.99, "venari-pr4", 1, "Cancelled", 14],
    ["Rob Daniels", "Venari 2026 Home Jersey", "M", 44.99, "venari-pr1", 1, "Refunded", 18],
  ];
  return rows.map(([customer, name, size, price, productId, qty, status, days], i) => ({
    id: `venari-o${i}`, ref: `VEN-ORD-${1047 - i}`, clubId: "venari", customer,
    email: `${slugify(customer).replace("-", ".")}@example.demo`, address: `${12 + i * 7} Demo Street, Cardiff, CF10 ${i + 1}AB, United Kingdom`,
    items: [{ productId, name, size, qty, price }], total: Math.round(price * qty * 100) / 100,
    payment: status === "Refunded" ? "Refunded — Test Mode" : "Paid — Test Mode", status, createdAt: now - days * DAY,
  }));
}

function venariNews(now: number): News[] {
  const rows: [string, string, string, string, number, News["status"]][] = [
    ["Venari Secure Dramatic 3–2 Victory", "Match Report", "A late winner sealed all three points after a thrilling five-goal contest.",
      p("Venari came from behind twice before Jay “VEX” Morgan struck in the 88th minute to beat Titan FC 3–2 in the VPG Premier League.") + p("Titan led at the break, but Liam “NOVA” Price levelled early in the second half and the home side controlled the final half hour.") + p("The result keeps Venari third, two points behind Titan with the return fixture still to come.") + `<h2>Player of the Match</h2>` + p("Jay “VEX” Morgan — two goals and a rating of 9.1."), 2, "published"],
    ["Squad Announcement for the New Season", "Club News", "Twelve players have been registered for the 2026 campaign, with one new face up front.",
      p("The management team has confirmed a twelve-player squad for the new season.") + p("Luke “STRIKE” Harris joins as a second striker and takes the number 14 shirt. Every other squad number is unchanged.") + p("Numbers 12, 13 and 15 onwards remain available for players coming through trials."), 6, "published"],
    ["Trial Applications Now Open", "Recruitment", "Think you can compete at Premier League level? Applications are open for all positions.",
      p("Venari is recruiting. We are looking for committed players in every position, with a particular need for cover at full-back.") + p("Complete the trial application and the management team will be in touch. Open trials take place on the next scheduled trial night in the club calendar."), 8, "published"],
    ["Venari Reach 100 Competitive Wins", "Milestone", "A 2–0 win over Royal XI brought up a century of league victories for the club.",
      p("Goals from Jacob “ECHO” Lewis and Jay “VEX” Morgan secured Venari's 100th competitive league win.") + p("Ethan “RIFT” Cole, who has played in more of those wins than anyone else, captained the side on the night."), 16, "published"],
    ["Supporter Goal: Help Us Cover League Fees", "Club News", "Donations this month go directly towards league entry, hosting and cup fees.",
      p("Running a competitive club has real costs. This month's supporter goal covers league entry, website hosting and cup fees.") + p("Every contribution is appreciated — you can follow progress live on the homepage."), 11, "published"],
    ["2026 Home Jersey Now Available", "Club News", "The new home shirt is in the Venari Store in sizes S to XXL.",
      p("The 2026 home jersey has landed in the Venari Store.") + p("Orders are packed and posted by club volunteers, usually within three working days."), 13, "published"],
    ["Cup Quarter-Final Date Confirmed", "Fixtures", "Venari's VPG Cup quarter-final has been added to the club calendar.",
      p("The cup quarter-final has been scheduled and is now in the calendar. Opponent to be confirmed after the final round-of-16 tie."), 4, "published"],
    ["Training Schedule Update", "Club News", "Training nights move to 19:30 for the rest of the season.",
      p("Following feedback from the squad, training sessions will now start at 19:30."), 20, "published"],
    ["Mid-Season Review", "Club News", "A look back at the first half of the campaign.", p("Draft article — the management team is still writing this one."), 0, "draft"],
  ];
  return rows.map(([title, category, excerpt, content, days, status], i) => ({
    id: `venari-n${i + 1}`, clubId: "venari", title, slug: slugify(title), category, excerpt, content,
    author: i % 2 ? "Jordan Price" : "Alex Carter", publishedAt: now - days * DAY - 3 * HOUR, status,
  }));
}

function smallClub(club: Club, names: [string, string, string][], opponents: string[], table: [string, number][], staff: [string, string][], now: number, F: number) {
  const id = club.id;
  const players = genPlayers(id, names, now);
  const tags = players.map((x) => x.gamerTag);
  const news: News[] = [
    ["Three Points on the Road", "Match Report", `${club.name} ground out an important away win to stay in the promotion places.`],
    ["Open Trials Announced", "Recruitment", "The club is looking for players in defence and midfield ahead of the run-in."],
    ["New Season Kit Revealed", "Club News", "The new home kit will be worn for the first time this weekend."],
  ].map(([title, category, excerpt], i) => ({
    id: `${id}-n${i}`, clubId: id, title, slug: slugify(title), category, excerpt,
    content: p(excerpt) + p(`More from ${club.name} will follow on the club's social channels.`),
    author: staff[0][0], publishedAt: now - (2 + i * 5) * DAY, status: "published" as const,
  }));
  const events: ClubEvent[] = [
    { id: `${id}-e1`, clubId: id, title: `${club.name.split(" ")[0]} vs ${opponents[0]}`, type: "Match", startsAt: F + DAY, competition: club.league },
    { id: `${id}-e2`, clubId: id, title: "Training Session", type: "Training", startsAt: at(F, 3, 19, 30) },
    { id: `${id}-e3`, clubId: id, title: "Open Trials", type: "Trial", startsAt: at(F, 8, 19, 0) },
  ];
  const history: Era[] = [
    [`EA SPORTS FC 25`, "Building", club.founded + 2 > 2025 ? 2025 : 2025, 70, 38, "4th"],
    [`EA SPORTS FC 26`, "The Push", 2026, 28, 16, "In progress"],
  ].map(([game, title, year, matches, wins, best], i) => ({
    id: `${id}-h${i}`, clubId: id, game: game as string, title: title as string, year: year as number,
    story: `A season of steady progress for ${club.name}.`, matches: matches as number, wins: wins as number, bestFinish: best as string,
    topScorer: `${tags[10]} — ${players[10].stats.goals + 6} Goals`, achievements: ["Record points total", "Longest unbeaten run: 8 matches"], gallery: [], order: i,
  }));
  const products: Product[] = [
    { id: `${id}-pr1`, clubId: id, name: `${club.name.split(" ")[0]} 2026 Home Jersey`, sku: `${club.short}-001`, description: "Official 2026 home shirt.", category: "Jerseys", price: 39.99, sizes: ["S", "M", "L", "XL"], stock: 20, active: true },
    { id: `${id}-pr2`, clubId: id, name: `${club.name.split(" ")[0]} Scarf`, sku: `${club.short}-002`, description: "Knitted supporter scarf in club colours.", category: "Accessories", price: 14.99, sizes: [], stock: 35, active: true },
  ];
  return {
    players, news, events, history, products,
    matches: genMatches(id, opponents, club.league, tags, now),
    league: table.map(([team, pts]) => ({ team, pts, played: 12, isClub: team === club.name.replace(/ (Esports|FC)$/, "") })),
    staff: staff.map(([name, role], i) => ({ id: `${id}-s${i}`, clubId: id, name, role, psn: name.replace(" ", "") + club.short, discord: name.toLowerCase().replace(" ", "."), bio: `${role} at ${club.name}.`, joinedAt: now - (600 - i * 90) * DAY, order: i })),
    tactics: [mkTactic(id, 1, "Balanced 4-4-2", "4-4-2", true, FORMATIONS["4-4-2"], ["Two banks of four, two up front.", "Play to the wide midfielders early.", "Compact mid block.", "Crosses from both sides, two in the box.", "Near-post corners.", "Keep it simple."], now)],
    donations: [20, 10, 50, 25, 15].map((amount, i) => ({ id: `${id}-d${i}`, clubId: id, amount, name: "Supporter", createdAt: now - i * HOUR * 5, status: "succeeded" as const })),
  };
}

export function buildSeed(now = Date.now()): DB {
  const F = nextFriday(now);
  const cs = clubs(now);
  const monthStart = new Date(now);
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const span = Math.max(HOUR, now - monthStart.getTime());

  const goytre = smallClub(cs[1],
    [["Dylan", "GATE", "Rees"], ["Ieuan", "DASH", "Pugh"], ["Carl", "ANVIL", "Morris"], ["Tomos", "GRIT", "Bowen"], ["Kai", "SLIDE", "Roberts"], ["Ellis", "HOLD", "Parry"], ["Finn", "LOOP", "Howells"], ["Harri", "SPARK", "Lloyd"], ["Jude", "JET", "Baker"], ["Osian", "WAVE", "Griffiths"], ["Macsen", "FANG", "Thomas"]],
    ["Ironside FC", "Harbour Town", "Red Kite eSports", "Castle Rovers", "North Bank", "Ironside FC"],
    [["Goytre", 27], ["Harbour Town", 25], ["Ironside FC", 22], ["Red Kite eSports", 20], ["Castle Rovers", 15], ["North Bank", 12]],
    [["Sule Ahmed", "Club Manager"], ["Bryn Davies", "Assistant Manager"]], now, F);
  const aeternum = smallClub(cs[2],
    [["Leo", "VAULT", "Marsh"], ["Theo", "ARC", "Quinn"], ["Reece", "STONE", "Doyle"], ["Zak", "PILLAR", "Hale"], ["Milo", "GLIDE", "Shaw"], ["Kian", "ANCHOR", "West"], ["Evan", "TEMPO", "Burke"], ["Nico", "LUMEN", "Vale"], ["Ash", "COMET", "Frost"], ["Rio", "PRISM", "Lane"], ["Cole", "AEON", "Hart"]],
    ["Midnight XI", "Solar United", "Kestrel FC", "Union Nine", "Atlas eSC", "Solar United"],
    [["Solar United", 24], ["Midnight XI", 23], ["Kestrel FC", 21], ["Aeternum", 20], ["Union Nine", 16], ["Atlas eSC", 9]],
    [["Morgan Blake", "Club Manager"], ["Riley Stone", "Head Coach"]], now, F);

  const events: ClubEvent[] = [
    ["Venari vs Titan FC", "Match", F, "VPG Premier League", "Top-of-the-table clash at home."],
    ["Training Session", "Training", at(F, 2, 19, 30), "", "Shape work and set pieces."],
    ["Venari vs Phoenix United", "Match", at(F, 5, 21, 0), "League Match", ""],
    ["Open Trials", "Trial", at(F, 9, 19, 0), "", "All positions welcome. Apply through the trial form first."],
    ["Cup Quarter Final", "Tournament", at(F, 13, 20, 30), "VPG Cup", "Opponent to be confirmed."],
    ["Community Game Night", "Club Event", at(F, 16, 20, 0), "", "Members and supporters drop-in games."],
    ["Training Session", "Training", at(F, -5, 19, 30), "", ""],
    ["Venari vs Royal XI", "Match", at(F, -14, 20, 30), "VPG Premier League", ""],
    ["Kit Launch Stream", "Club Event", at(F, -10, 19, 0), "", "2026 home jersey reveal live on Twitch."],
  ].map(([title, type, startsAt, competition, description], i) => ({
    id: `venari-e${i}`, clubId: "venari", title: title as string, type: type as ClubEvent["type"], startsAt: startsAt as number,
    competition: (competition as string) || undefined, description: (description as string) || undefined,
  }));

  const trials: Trial[] = TRIALS.map(([realName, gamerTag, age, primaryPos, secondaryPos, status], i) => ({
    id: `venari-tr${i}`, ref: `VEN-TRIAL-${1041 - i}`, clubId: "venari", realName, gamerTag, age,
    email: `${gamerTag.toLowerCase()}@example.demo`, discord: gamerTag.toLowerCase() + "#" + (1000 + i * 37), psn: gamerTag + "_" + (10 + i),
    primaryPos, secondaryPos, formation: i % 2 ? "4-3-3" : "4-2-3-1", currentClub: i % 3 ? "Free agent" : "Northside FC", previousClubs: "Two seasons of 11-a-side Pro Clubs.",
    compExp: "3+ seasons", leagueExp: i % 2 ? "VPG Championship" : "VPG League One", availability: "Sun–Thu evenings", mic: "Yes", connection: "Wired fibre",
    why: "I want to play in an organised side that trains properly and competes for titles.", bring: "Communication, reliability and a calm head under pressure.",
    strengths: "Positioning and passing range.", improve: "Weak-foot finishing and defending in transition.", status, createdAt: now - (i * 1.4 + 0.3) * DAY,
  }));

  const users: User[] = [
    { id: "u-super", username: "PlatformOwner", email: "super@venari.demo", passHash: "demo", role: "superadmin", clubId: "venari", status: "active", createdAt: now - 400 * DAY, lastLoginAt: now - 2 * DAY },
    { id: "u-admin", username: "VenariAdmin", email: "admin@venari.demo", passHash: "demo", role: "admin", clubId: "venari", status: "active", createdAt: now - 390 * DAY, lastLoginAt: now - 5 * HOUR },
    { id: "u-member", username: "DemoMember", email: "member@venari.demo", passHash: "demo", role: "member", clubId: "venari", status: "active", createdAt: now - 120 * DAY, lastLoginAt: now - DAY },
    ...USERS.map(([username, role, status], i): User => ({
      id: `u-${i}`, username, email: `${username.toLowerCase()}@example.demo`, passHash: "demo", role, clubId: "venari", status,
      createdAt: now - (300 - i * 16) * DAY, lastLoginAt: status === "pending" ? undefined : now - (i * 9 + 3) * HOUR,
    })),
  ];

  const A = (i: number, user: string, action: string, entity: string, meta: string) => ({ id: `a${i}`, clubId: "venari", user, action, entity, meta, at: now - i * 5 * HOUR - HOUR });

  return {
    version: DB_VERSION,
    clubs: cs,
    users,
    news: [...venariNews(now), ...goytre.news, ...aeternum.news],
    events: [...events, ...goytre.events, ...aeternum.events],
    players: [...VENARI_PLAYERS.map((r, i) => mkPlayer("venari", r, now, i)), ...goytre.players, ...aeternum.players],
    staff: [
      ...([["Alex Carter", "Club Manager", "AlexVenari", "alex.venari", "Founding member and club manager since 2017. Sets the standards on and off the pitch."],
        ["Jordan Price", "Assistant Manager", "JordanVFC", "jordan.venari", "Runs matchday organisation, squad availability and fixtures."],
        ["Sam Williams", "Head Coach", "SamW_VEN", "sam.venari", "Designs the club's tactics and leads both weekly training sessions."],
        ["Chris Evans", "Recruitment Manager", "ChrisE_VEN", "chris.venari", "Reviews every trial application and runs open trial nights."]] as string[][]).map(([name, role, psn, discord, bio], i) => ({
        id: `venari-s${i}`, clubId: "venari", name, role, psn, discord, bio, joinedAt: now - (3200 - i * 500) * DAY, order: i,
      })),
      ...goytre.staff, ...aeternum.staff,
    ],
    history: [
      ...ERAS.map(([game, title, year, matches, wins, bestFinish, topScorer, achievements, story], i): Era => ({
        id: `venari-h${i}`, clubId: "venari", game, title, year, matches, wins, bestFinish, topScorer, achievements, story, gallery: [], order: i,
      })),
      ...goytre.history, ...aeternum.history,
    ],
    matches: [...mkMatches("venari", VENARI_MATCHES, now), ...goytre.matches, ...aeternum.matches],
    leagues: {
      venari: [["Apex FC", 28], ["Titan FC", 26], ["Venari", 24], ["Phoenix Utd", 21], ["Legacy FC", 19], ["Royal XI", 17], ["Storm City", 14], ["Nova Athletic", 11]].map(([team, pts]) => ({ team: team as string, pts: pts as number, played: 12, isClub: team === "Venari" })),
      goytre: goytre.league,
      aeternum: aeternum.league,
    },
    trials,
    donations: [
      ...DONATIONS.map((amount, i) => ({ id: `venari-d${i}`, clubId: "venari", amount, name: SUPPORTERS[i], createdAt: now - Math.floor((span * (i + 0.5)) / DONATIONS.length), status: "succeeded" as const })),
      ...goytre.donations, ...aeternum.donations,
    ],
    products: [...venariProducts(), ...goytre.products, ...aeternum.products],
    orders: venariOrders(now),
    tactics: [...venariTactics(now), ...goytre.tactics, ...aeternum.tactics],
    emails: [
      { id: "em1", clubId: "venari", to: "trials@venari.demo", subject: "New trial application VEN-TRIAL-1041 — Callum Wright", status: "Demo delivery — not sent", createdAt: now - 0.3 * DAY },
      { id: "em2", clubId: "venari", to: "contact@venari.demo", subject: "New shop order VEN-ORD-1047 — Sophie Allen", status: "Demo delivery — not sent", createdAt: now - 0.2 * DAY },
    ],
    audit: [
      A(0, "VenariAdmin", "Order status changed", "VEN-ORD-1045", "New → Processing"),
      A(1, "Visitor", "Trial received", "VEN-TRIAL-1041", "Callum Wright (ST)"),
      A(2, "Stripe webhook (test)", "Order received", "VEN-ORD-1047", "£54.99"),
      A(3, "VenariAdmin", "News created", "Venari Secure Dramatic 3–2 Victory", "Published"),
      A(4, "VenariAdmin", "Kit number changed", "Luke “STRIKE” Harris", "→ 14"),
      A(5, "VenariAdmin", "Player added", "Luke “STRIKE” Harris", "ST"),
      A(6, "Stripe webhook (test)", "Donation received", "£50", "Raven"),
      A(7, "DemoMember", "User logged in", "DemoMember", ""),
      A(8, "VenariAdmin", "Event created", "Cup Quarter Final", "Tournament"),
      A(9, "PlatformOwner", "User suspended", "SpamBot4000", "Spam registrations"),
      A(10, "VenariAdmin", "Tactics updated", "Controlled 4-2-3-1", "Published"),
      A(11, "VenariAdmin", "Club settings changed", "Venari Esports", "Social links"),
    ],
    counters: { trial: 1042, order: 1048 },
  };
}
