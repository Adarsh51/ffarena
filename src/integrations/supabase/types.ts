export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      player_stats: {
        Row: {
          created_at: string
          id: string
          player_id: string | null
          total_earnings: number
          tournaments_played: number
          tournaments_won: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          player_id?: string | null
          total_earnings?: number
          tournaments_played?: number
          tournaments_won?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          player_id?: string | null
          total_earnings?: number
          tournaments_played?: number
          tournaments_won?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_stats_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: true
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      players: {
        Row: {
          clerk_user_id: string
          created_at: string | null
          email: string
          free_fire_uid: string | null
          id: string
          in_game_name: string | null
          updated_at: string | null
          username: string
        }
        Insert: {
          clerk_user_id: string
          created_at?: string | null
          email: string
          free_fire_uid?: string | null
          id?: string
          in_game_name?: string | null
          updated_at?: string | null
          username: string
        }
        Update: {
          clerk_user_id?: string
          created_at?: string | null
          email?: string
          free_fire_uid?: string | null
          id?: string
          in_game_name?: string | null
          updated_at?: string | null
          username?: string
        }
        Relationships: []
      }
      settings: {
        Row: {
          id: string
          setting_key: string
          setting_value: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          setting_key: string
          setting_value: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          setting_key?: string
          setting_value?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      tournament_registrations: {
        Row: {
          created_at: string | null
          id: string
          payment_status: string | null
          player_id: string | null
          slot_time: string
          tournament_type: Database["public"]["Enums"]["tournament_type"]
        }
        Insert: {
          created_at?: string | null
          id?: string
          payment_status?: string | null
          player_id?: string | null
          slot_time: string
          tournament_type: Database["public"]["Enums"]["tournament_type"]
        }
        Update: {
          created_at?: string | null
          id?: string
          payment_status?: string | null
          player_id?: string | null
          slot_time?: string
          tournament_type?: Database["public"]["Enums"]["tournament_type"]
        }
        Relationships: [
          {
            foreignKeyName: "tournament_registrations_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      tournaments: {
        Row: {
          created_at: string
          entry_fee: number
          id: string
          max_participants: number
          name: string
          prize_pool: number
          scheduled_date: string
          scheduled_time: string
          status: string
          type: Database["public"]["Enums"]["tournament_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          entry_fee: number
          id?: string
          max_participants?: number
          name: string
          prize_pool?: number
          scheduled_date: string
          scheduled_time: string
          status?: string
          type: Database["public"]["Enums"]["tournament_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          entry_fee?: number
          id?: string
          max_participants?: number
          name?: string
          prize_pool?: number
          scheduled_date?: string
          scheduled_time?: string
          status?: string
          type?: Database["public"]["Enums"]["tournament_type"]
          updated_at?: string
        }
        Relationships: []
      }
      winners: {
        Row: {
          created_at: string | null
          id: string
          image_url: string | null
          player_name: string
          tournament_date: string | null
          tournament_type: Database["public"]["Enums"]["tournament_type"]
        }
        Insert: {
          created_at?: string | null
          id?: string
          image_url?: string | null
          player_name: string
          tournament_date?: string | null
          tournament_type: Database["public"]["Enums"]["tournament_type"]
        }
        Update: {
          created_at?: string | null
          id?: string
          image_url?: string | null
          player_name?: string
          tournament_date?: string | null
          tournament_type?: Database["public"]["Enums"]["tournament_type"]
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_valid_clerk_user: {
        Args: { clerk_id: string }
        Returns: boolean
      }
    }
    Enums: {
      tournament_type: "solo" | "duo" | "squad"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      tournament_type: ["solo", "duo", "squad"],
    },
  },
} as const
