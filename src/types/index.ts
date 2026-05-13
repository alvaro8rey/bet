export type Sport = "football" | "tennis" | "basketball" | "baseball" | "volleyball" | "other";
export type EventStatus = "pending" | "live" | "finished" | "cancelled";
export type BetResult = "home" | "draw" | "away";
export type BetStatus = "pending" | "won" | "lost" | "cancelled";

export interface Profile {
  id: string;
  user_id: string;
  username: string;
  avatar_url: string | null;
  points: number;
  total_bets: number;
  won_bets: number;
  lost_bets: number;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}

export interface Event {
  id: string;
  sport: Sport;
  competition: string;
  home_team: string;
  away_team: string;
  home_odds: number;
  draw_odds: number | null;
  away_odds: number;
  event_date: string;
  status: EventStatus;
  home_score: number | null;
  away_score: number | null;
  result: BetResult | null;
  created_at: string;
  updated_at: string;
}

export interface Bet {
  id: string;
  user_id: string;
  event_id: string;
  prediction: BetResult;
  amount: number;
  odds: number;
  potential_win: number;
  status: BetStatus;
  created_at: string;
  resolved_at: string | null;
  event?: Event;
  profile?: Profile;
}

export interface LeaderboardEntry {
  rank: number;
  user_id: string;
  username: string;
  points: number;
  total_bets: number;
  won_bets: number;
  win_rate: number;
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, "created_at" | "updated_at">;
        Update: Partial<Omit<Profile, "id" | "user_id" | "created_at">>;
      };
      events: {
        Row: Event;
        Insert: Omit<Event, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Event, "id" | "created_at">>;
      };
      bets: {
        Row: Bet;
        Insert: Omit<Bet, "id" | "created_at" | "resolved_at">;
        Update: Partial<Omit<Bet, "id" | "user_id" | "event_id" | "created_at">>;
      };
    };
  };
}
