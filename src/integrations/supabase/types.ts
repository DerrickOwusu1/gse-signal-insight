export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      alerts: {
        Row: {
          created_at: string
          id: string
          is_dismissed: boolean | null
          is_read: boolean | null
          price: number | null
          rationale: string | null
          stock_id: string
          tier: string
          trigger_type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_dismissed?: boolean | null
          is_read?: boolean | null
          price?: number | null
          rationale?: string | null
          stock_id: string
          tier: string
          trigger_type: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_dismissed?: boolean | null
          is_read?: boolean | null
          price?: number | null
          rationale?: string | null
          stock_id?: string
          tier?: string
          trigger_type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alerts_stock_id_fkey"
            columns: ["stock_id"]
            isOneToOne: false
            referencedRelation: "stocks"
            referencedColumns: ["id"]
          },
        ]
      }
      backtests: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          name: string
          parameters: Json
          results: Json | null
          status: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          name: string
          parameters: Json
          results?: Json | null
          status?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          name?: string
          parameters?: Json
          results?: Json | null
          status?: string | null
          user_id?: string
        }
        Relationships: []
      }
      portfolios: {
        Row: {
          avg_cost: number
          created_at: string
          id: string
          shares: number
          stock_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avg_cost: number
          created_at?: string
          id?: string
          shares: number
          stock_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avg_cost?: number
          created_at?: string
          id?: string
          shares?: number
          stock_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "portfolios_stock_id_fkey"
            columns: ["stock_id"]
            isOneToOne: false
            referencedRelation: "stocks"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          api_key: string | null
          created_at: string
          data_refresh_interval: string | null
          email_alerts: boolean | null
          full_name: string | null
          id: string
          location: string | null
          phone: string | null
          sms_alerts: boolean | null
          telegram_alerts: boolean | null
          telegram_chat_id: string | null
          two_factor_enabled: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          api_key?: string | null
          created_at?: string
          data_refresh_interval?: string | null
          email_alerts?: boolean | null
          full_name?: string | null
          id?: string
          location?: string | null
          phone?: string | null
          sms_alerts?: boolean | null
          telegram_alerts?: boolean | null
          telegram_chat_id?: string | null
          two_factor_enabled?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          api_key?: string | null
          created_at?: string
          data_refresh_interval?: string | null
          email_alerts?: boolean | null
          full_name?: string | null
          id?: string
          location?: string | null
          phone?: string | null
          sms_alerts?: boolean | null
          telegram_alerts?: boolean | null
          telegram_chat_id?: string | null
          two_factor_enabled?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      stock_prices: {
        Row: {
          id: string
          price: number
          stock_id: string
          timestamp: string
          volume: number | null
        }
        Insert: {
          id?: string
          price: number
          stock_id: string
          timestamp?: string
          volume?: number | null
        }
        Update: {
          id?: string
          price?: number
          stock_id?: string
          timestamp?: string
          volume?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_prices_stock_id_fkey"
            columns: ["stock_id"]
            isOneToOne: false
            referencedRelation: "stocks"
            referencedColumns: ["id"]
          },
        ]
      }
      stocks: {
        Row: {
          company_name: string
          created_at: string
          current_price: number | null
          dividend_yield: number | null
          id: string
          is_active: boolean | null
          market_cap: number | null
          pb_ratio: number | null
          pe_ratio: number | null
          previous_close: number | null
          roe: number | null
          score: number | null
          sector: string | null
          ticker: string
          tier: string | null
          updated_at: string
          volume: number | null
        }
        Insert: {
          company_name: string
          created_at?: string
          current_price?: number | null
          dividend_yield?: number | null
          id?: string
          is_active?: boolean | null
          market_cap?: number | null
          pb_ratio?: number | null
          pe_ratio?: number | null
          previous_close?: number | null
          roe?: number | null
          score?: number | null
          sector?: string | null
          ticker: string
          tier?: string | null
          updated_at?: string
          volume?: number | null
        }
        Update: {
          company_name?: string
          created_at?: string
          current_price?: number | null
          dividend_yield?: number | null
          id?: string
          is_active?: boolean | null
          market_cap?: number | null
          pb_ratio?: number | null
          pe_ratio?: number | null
          previous_close?: number | null
          roe?: number | null
          score?: number | null
          sector?: string | null
          ticker?: string
          tier?: string | null
          updated_at?: string
          volume?: number | null
        }
        Relationships: []
      }
      trades: {
        Row: {
          executed_at: string
          fees: number | null
          id: string
          price: number
          shares: number
          stock_id: string
          trade_type: string
          user_id: string
        }
        Insert: {
          executed_at?: string
          fees?: number | null
          id?: string
          price: number
          shares: number
          stock_id: string
          trade_type: string
          user_id: string
        }
        Update: {
          executed_at?: string
          fees?: number | null
          id?: string
          price?: number
          shares?: number
          stock_id?: string
          trade_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trades_stock_id_fkey"
            columns: ["stock_id"]
            isOneToOne: false
            referencedRelation: "stocks"
            referencedColumns: ["id"]
          },
        ]
      }
      watchlists: {
        Row: {
          created_at: string
          id: string
          stock_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          stock_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          stock_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "watchlists_stock_id_fkey"
            columns: ["stock_id"]
            isOneToOne: false
            referencedRelation: "stocks"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
