export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type FixtureStatus =
  | "scheduled"
  | "live"
  | "finished"
  | "postponed"
  | "cancelled";

type EmptyRelationships = [];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          locale: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          locale?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          display_name?: string | null;
          locale?: string;
          updated_at?: string;
        };
        Relationships: EmptyRelationships;
      };
      leagues: {
        Row: {
          id: string;
          external_id: string;
          provider: string;
          name: string;
          country: string | null;
          season: string;
          logo_url: string | null;
        };
        Insert: {
          id?: string;
          external_id: string;
          provider?: string;
          name: string;
          country?: string | null;
          season: string;
          logo_url?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["leagues"]["Insert"]>;
        Relationships: EmptyRelationships;
      };
      teams: {
        Row: {
          id: string;
          external_id: string;
          provider: string;
          name: string;
          short_name: string | null;
          logo_url: string | null;
        };
        Insert: {
          id?: string;
          external_id: string;
          provider?: string;
          name: string;
          short_name?: string | null;
          logo_url?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["teams"]["Insert"]>;
        Relationships: EmptyRelationships;
      };
      players: {
        Row: {
          id: string;
          external_id: string;
          provider: string;
          team_id: string | null;
          name: string;
          position: string | null;
          nationality: string | null;
        };
        Insert: {
          id?: string;
          external_id: string;
          provider?: string;
          team_id?: string | null;
          name: string;
          position?: string | null;
          nationality?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["players"]["Insert"]>;
        Relationships: EmptyRelationships;
      };
      fixtures: {
        Row: {
          id: string;
          external_id: string;
          provider: string;
          league_id: string;
          home_team_id: string;
          away_team_id: string;
          kickoff_at: string;
          status: FixtureStatus;
          home_score: number | null;
          away_score: number | null;
          venue: string | null;
          round: string | null;
        };
        Insert: {
          id?: string;
          external_id: string;
          provider?: string;
          league_id: string;
          home_team_id: string;
          away_team_id: string;
          kickoff_at: string;
          status?: FixtureStatus;
          home_score?: number | null;
          away_score?: number | null;
          venue?: string | null;
          round?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["fixtures"]["Insert"]>;
        Relationships: EmptyRelationships;
      };
      fixture_stats: {
        Row: {
          fixture_id: string;
          home_xg: number | null;
          away_xg: number | null;
          home_shots: number | null;
          away_shots: number | null;
          home_shots_on_target: number | null;
          away_shots_on_target: number | null;
          home_possession: number | null;
          away_possession: number | null;
          home_corners: number | null;
          away_corners: number | null;
          updated_at: string;
        };
        Insert: {
          fixture_id: string;
          home_xg?: number | null;
          away_xg?: number | null;
          home_shots?: number | null;
          away_shots?: number | null;
          home_shots_on_target?: number | null;
          away_shots_on_target?: number | null;
          home_possession?: number | null;
          away_possession?: number | null;
          home_corners?: number | null;
          away_corners?: number | null;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["fixture_stats"]["Insert"]>;
        Relationships: EmptyRelationships;
      };
      player_match_stats: {
        Row: {
          id: string;
          fixture_id: string;
          player_id: string;
          minutes: number | null;
          goals: number | null;
          assists: number | null;
          shots: number | null;
          xg: number | null;
        };
        Insert: {
          id?: string;
          fixture_id: string;
          player_id: string;
          minutes?: number | null;
          goals?: number | null;
          assists?: number | null;
          shots?: number | null;
          xg?: number | null;
        };
        Update: Partial<
          Database["public"]["Tables"]["player_match_stats"]["Insert"]
        >;
        Relationships: EmptyRelationships;
      };
      favorites: {
        Row: {
          user_id: string;
          team_id: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          team_id: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["favorites"]["Insert"]>;
        Relationships: EmptyRelationships;
      };
      sync_logs: {
        Row: {
          id: string;
          provider: string;
          job_name: string;
          status: string;
          message: string | null;
          started_at: string;
          finished_at: string | null;
        };
        Insert: {
          id?: string;
          provider: string;
          job_name: string;
          status: string;
          message?: string | null;
          started_at?: string;
          finished_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["sync_logs"]["Insert"]>;
        Relationships: EmptyRelationships;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      fixture_status: FixtureStatus;
    };
    CompositeTypes: Record<string, never>;
  };
}
