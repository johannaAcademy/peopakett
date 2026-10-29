export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          full_name?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      parties: {
        Row: {
          id: string;
          owner_id: string;
          title: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          title: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'parties_owner_id_fkey';
            columns: ['owner_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      party_plans: {
        Row: {
          id: string;
          party_id: string;
          owner_id: string;
          status: 'draft';
          event_type: string;
          audience: string;
          age_group: string;
          theme: string;
          guest_count: number;
          event_date: string;
          event_time: string;
          location: string;
          venue_type: string;
          budget_cents: number;
          currency: 'EUR';
          details: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          party_id: string;
          owner_id: string;
          status?: 'draft';
          event_type: string;
          audience: string;
          age_group: string;
          theme: string;
          guest_count: number;
          event_date: string;
          event_time: string;
          location: string;
          venue_type: string;
          budget_cents: number;
          currency?: 'EUR';
          details?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          status?: 'draft';
          event_type?: string;
          audience?: string;
          age_group?: string;
          theme?: string;
          guest_count?: number;
          event_date?: string;
          event_time?: string;
          location?: string;
          venue_type?: string;
          budget_cents?: number;
          currency?: 'EUR';
          details?: Json;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'party_plans_party_id_fkey';
            columns: ['party_id'];
            isOneToOne: false;
            referencedRelation: 'parties';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'party_plans_owner_id_fkey';
            columns: ['owner_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      save_party_draft: {
        Args: {
          p_plan_id: string | null;
          p_draft: Json;
        };
        Returns: string;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
