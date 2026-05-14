import { NextRequest, NextResponse } from "next/server";

const FOOTBALL_DATA_KEY = process.env.FOOTBALL_DATA_API_KEY ?? "";
const FD_OPTS = {
  headers: { "X-Auth-Token": FOOTBALL_DATA_KEY },
  next: { revalidate: 86400 },
};

// Free-tier competitions on football-data.org
const COMPETITIONS = ["PD", "PL", "BL1", "SA", "FL1", "CL", "EL", "PPL", "DED", "ELC"];

interface FDTeam {
  name: string;
  shortName: string;
  tla: string;
  crest: string;
}

function clean(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function teamMatches(fd: FDTeam, query: string): boolean {
  const q = clean(query);
  if (q.length < 3) return false;

  const name = clean(fd.name);
  const short = clean(fd.shortName);
  const tla = clean(fd.tla);

  // Exact clean match
  if (name === q || short === q || tla === q) return true;

  // One contains the other (both must be non-trivially long)
  if (name.length >= 3 && (name.includes(q) || q.includes(name))) return true;
  if (short.length >= 3 && (short.includes(q) || q.includes(short))) return true;

  return false;
}

async function footballDataLogo(team: string): Promise<string | null> {
  if (!FOOTBALL_DATA_KEY) return null;
  for (const comp of COMPETITIONS) {
    try {
      const res = await fetch(
        `https://api.football-data.org/v4/competitions/${comp}/teams`,
        FD_OPTS
      );
      if (!res.ok) continue;
      const d = await res.json();
      const teams: FDTeam[] = d?.teams ?? [];
      const found = teams.find((t) => teamMatches(t, team));
      if (found?.crest) return found.crest;
    } catch { /* continue */ }
  }
  return null;
}

export async function GET(req: NextRequest) {
  const team = req.nextUrl.searchParams.get("team");
  if (!team) return NextResponse.json({ url: null });

  const url = await footballDataLogo(team);
  return NextResponse.json({ url: url ?? null });
}
