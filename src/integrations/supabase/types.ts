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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      analysis_results: {
        Row: {
          analyzed_at: string | null
          atelectasis_score: number | null
          cardiomegaly_score: number | null
          consolidation_score: number | null
          edema_score: number | null
          effusion_score: number | null
          emphysema_score: number | null
          enlarged_cardiomediastinum_score: number | null
          fibrosis_score: number | null
          fracture_score: number | null
          hernia_score: number | null
          id: string
          infiltration_score: number | null
          lung_lesion_score: number | null
          lung_opacity_score: number | null
          mass_score: number | null
          nodule_score: number | null
          overall_risk: string | null
          pleural_thickening_score: number | null
          pneumonia_score: number | null
          pneumothorax_score: number | null
          processing_time_seconds: number | null
          recommendation: string | null
          status: string | null
          user_id: string
          xray_image_id: string
        }
        Insert: {
          analyzed_at?: string | null
          atelectasis_score?: number | null
          cardiomegaly_score?: number | null
          consolidation_score?: number | null
          edema_score?: number | null
          effusion_score?: number | null
          emphysema_score?: number | null
          enlarged_cardiomediastinum_score?: number | null
          fibrosis_score?: number | null
          fracture_score?: number | null
          hernia_score?: number | null
          id?: string
          infiltration_score?: number | null
          lung_lesion_score?: number | null
          lung_opacity_score?: number | null
          mass_score?: number | null
          nodule_score?: number | null
          overall_risk?: string | null
          pleural_thickening_score?: number | null
          pneumonia_score?: number | null
          pneumothorax_score?: number | null
          processing_time_seconds?: number | null
          recommendation?: string | null
          status?: string | null
          user_id: string
          xray_image_id: string
        }
        Update: {
          analyzed_at?: string | null
          atelectasis_score?: number | null
          cardiomegaly_score?: number | null
          consolidation_score?: number | null
          edema_score?: number | null
          effusion_score?: number | null
          emphysema_score?: number | null
          enlarged_cardiomediastinum_score?: number | null
          fibrosis_score?: number | null
          fracture_score?: number | null
          hernia_score?: number | null
          id?: string
          infiltration_score?: number | null
          lung_lesion_score?: number | null
          lung_opacity_score?: number | null
          mass_score?: number | null
          nodule_score?: number | null
          overall_risk?: string | null
          pleural_thickening_score?: number | null
          pneumonia_score?: number | null
          pneumothorax_score?: number | null
          processing_time_seconds?: number | null
          recommendation?: string | null
          status?: string | null
          user_id?: string
          xray_image_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "analysis_results_xray_image_id_fkey"
            columns: ["xray_image_id"]
            isOneToOne: false
            referencedRelation: "xray_images"
            referencedColumns: ["id"]
          },
        ]
      }
      consultation_messages: {
        Row: {
          consultation_id: string
          created_at: string | null
          id: string
          message: string
          sender_id: string
        }
        Insert: {
          consultation_id: string
          created_at?: string | null
          id?: string
          message: string
          sender_id: string
        }
        Update: {
          consultation_id?: string
          created_at?: string | null
          id?: string
          message?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "consultation_messages_consultation_id_fkey"
            columns: ["consultation_id"]
            isOneToOne: false
            referencedRelation: "consultations"
            referencedColumns: ["id"]
          },
        ]
      }
      consultations: {
        Row: {
          analysis_result_id: string
          created_at: string | null
          id: string
          requesting_doctor_id: string
          specialist_id: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          analysis_result_id: string
          created_at?: string | null
          id?: string
          requesting_doctor_id: string
          specialist_id: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          analysis_result_id?: string
          created_at?: string | null
          id?: string
          requesting_doctor_id?: string
          specialist_id?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "consultations_analysis_result_id_fkey"
            columns: ["analysis_result_id"]
            isOneToOne: false
            referencedRelation: "analysis_results"
            referencedColumns: ["id"]
          },
        ]
      }
      diagnostic_reports: {
        Row: {
          analysis_result_id: string
          created_at: string | null
          id: string
          pdf_url: string | null
          report_content: Json | null
          user_id: string
        }
        Insert: {
          analysis_result_id: string
          created_at?: string | null
          id?: string
          pdf_url?: string | null
          report_content?: Json | null
          user_id: string
        }
        Update: {
          analysis_result_id?: string
          created_at?: string | null
          id?: string
          pdf_url?: string | null
          report_content?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "diagnostic_reports_analysis_result_id_fkey"
            columns: ["analysis_result_id"]
            isOneToOne: false
            referencedRelation: "analysis_results"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          availability: string | null
          avatar_url: string | null
          created_at: string | null
          full_name: string
          hospital: string | null
          id: string
          specialty: string | null
          updated_at: string | null
          user_id: string
          years_experience: number | null
        }
        Insert: {
          availability?: string | null
          avatar_url?: string | null
          created_at?: string | null
          full_name: string
          hospital?: string | null
          id?: string
          specialty?: string | null
          updated_at?: string | null
          user_id: string
          years_experience?: number | null
        }
        Update: {
          availability?: string | null
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string
          hospital?: string | null
          id?: string
          specialty?: string | null
          updated_at?: string | null
          user_id?: string
          years_experience?: number | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      xray_images: {
        Row: {
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          notes: string | null
          patient_id: string | null
          uploaded_at: string | null
          user_id: string
          xray_type: string | null
        }
        Insert: {
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          notes?: string | null
          patient_id?: string | null
          uploaded_at?: string | null
          user_id: string
          xray_type?: string | null
        }
        Update: {
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          notes?: string | null
          patient_id?: string | null
          uploaded_at?: string | null
          user_id?: string
          xray_type?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "doctor" | "specialist" | "admin"
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
    Enums: {
      app_role: ["doctor", "specialist", "admin"],
    },
  },
} as const
