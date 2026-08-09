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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      appointments: {
        Row: {
          created_at: string
          doctor_id: string
          duration_minutes: number | null
          id: string
          notes: string | null
          patient_id: string
          reason: string | null
          scheduled_at: string
          status: string
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          doctor_id: string
          duration_minutes?: number | null
          id?: string
          notes?: string | null
          patient_id: string
          reason?: string | null
          scheduled_at: string
          status?: string
          type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          doctor_id?: string
          duration_minutes?: number | null
          id?: string
          notes?: string | null
          patient_id?: string
          reason?: string | null
          scheduled_at?: string
          status?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      consultation_messages: {
        Row: {
          appointment_id: string
          created_at: string
          file_name: string | null
          file_type: string | null
          file_url: string | null
          id: string
          message: string | null
          sender_id: string
          sender_role: string
        }
        Insert: {
          appointment_id: string
          created_at?: string
          file_name?: string | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          message?: string | null
          sender_id: string
          sender_role: string
        }
        Update: {
          appointment_id?: string
          created_at?: string
          file_name?: string | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          message?: string | null
          sender_id?: string
          sender_role?: string
        }
        Relationships: [
          {
            foreignKeyName: "consultation_messages_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
        ]
      }
      doctor_availability: {
        Row: {
          break_end: string | null
          break_start: string | null
          doctor_id: string
          doctor_name: string
          end_time: string | null
          id: string
          is_available: boolean
          next_available_slot: string | null
          slot_duration_minutes: number | null
          specialty: string
          start_time: string | null
          updated_at: string
          working_days: string[] | null
        }
        Insert: {
          break_end?: string | null
          break_start?: string | null
          doctor_id: string
          doctor_name: string
          end_time?: string | null
          id?: string
          is_available?: boolean
          next_available_slot?: string | null
          slot_duration_minutes?: number | null
          specialty: string
          start_time?: string | null
          updated_at?: string
          working_days?: string[] | null
        }
        Update: {
          break_end?: string | null
          break_start?: string | null
          doctor_id?: string
          doctor_name?: string
          end_time?: string | null
          id?: string
          is_available?: boolean
          next_available_slot?: string | null
          slot_duration_minutes?: number | null
          specialty?: string
          start_time?: string | null
          updated_at?: string
          working_days?: string[] | null
        }
        Relationships: []
      }
      doctor_profiles: {
        Row: {
          approval_status: string | null
          approved_at: string | null
          approved_by: string | null
          bio: string | null
          consultation_fee: number | null
          created_at: string
          id: string
          is_accepting_patients: boolean | null
          license_number: string | null
          rejection_reason: string | null
          specialty: string
          updated_at: string
          years_of_experience: number | null
        }
        Insert: {
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          bio?: string | null
          consultation_fee?: number | null
          created_at?: string
          id: string
          is_accepting_patients?: boolean | null
          license_number?: string | null
          rejection_reason?: string | null
          specialty: string
          updated_at?: string
          years_of_experience?: number | null
        }
        Update: {
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          bio?: string | null
          consultation_fee?: number | null
          created_at?: string
          id?: string
          is_accepting_patients?: boolean | null
          license_number?: string | null
          rejection_reason?: string | null
          specialty?: string
          updated_at?: string
          years_of_experience?: number | null
        }
        Relationships: []
      }
      doctor_reviews: {
        Row: {
          appointment_id: string | null
          created_at: string
          doctor_id: string
          id: string
          patient_id: string
          rating: number
          review_text: string | null
          updated_at: string
        }
        Insert: {
          appointment_id?: string | null
          created_at?: string
          doctor_id: string
          id?: string
          patient_id: string
          rating: number
          review_text?: string | null
          updated_at?: string
        }
        Update: {
          appointment_id?: string | null
          created_at?: string
          doctor_id?: string
          id?: string
          patient_id?: string
          rating?: number
          review_text?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "doctor_reviews_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "doctor_reviews_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "doctor_reviews_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      email_logs: {
        Row: {
          body: string | null
          created_at: string | null
          error_message: string | null
          id: string
          recipient_email: string
          recipient_id: string | null
          sent_at: string | null
          status: string | null
          subject: string
          template_type: string | null
        }
        Insert: {
          body?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          recipient_email: string
          recipient_id?: string | null
          sent_at?: string | null
          status?: string | null
          subject: string
          template_type?: string | null
        }
        Update: {
          body?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          recipient_email?: string
          recipient_id?: string | null
          sent_at?: string | null
          status?: string | null
          subject?: string
          template_type?: string | null
        }
        Relationships: []
      }
      medical_records: {
        Row: {
          description: string | null
          file_name: string
          file_size: number | null
          file_url: string
          id: string
          patient_id: string
          record_type: string
          title: string
          uploaded_at: string
          uploaded_by: string
        }
        Insert: {
          description?: string | null
          file_name: string
          file_size?: number | null
          file_url: string
          id?: string
          patient_id: string
          record_type: string
          title: string
          uploaded_at?: string
          uploaded_by: string
        }
        Update: {
          description?: string | null
          file_name?: string
          file_size?: number | null
          file_url?: string
          id?: string
          patient_id?: string
          record_type?: string
          title?: string
          uploaded_at?: string
          uploaded_by?: string
        }
        Relationships: []
      }
      ml_datasets: {
        Row: {
          description: string | null
          disease_type: string
          features: string[] | null
          file_name: string | null
          file_size: number | null
          file_url: string | null
          id: string
          name: string
          record_count: number | null
          status: string | null
          uploaded_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          description?: string | null
          disease_type: string
          features?: string[] | null
          file_name?: string | null
          file_size?: number | null
          file_url?: string | null
          id?: string
          name: string
          record_count?: number | null
          status?: string | null
          uploaded_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          description?: string | null
          disease_type?: string
          features?: string[] | null
          file_name?: string | null
          file_size?: number | null
          file_url?: string | null
          id?: string
          name?: string
          record_count?: number | null
          status?: string | null
          uploaded_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: []
      }
      ml_training_runs: {
        Row: {
          accuracy: number | null
          completed_at: string | null
          dataset_id: string | null
          disease_type: string
          f1_score: number | null
          id: string
          model_type: string
          precision_score: number | null
          recall_score: number | null
          started_at: string | null
          status: string | null
          training_params: Json | null
        }
        Insert: {
          accuracy?: number | null
          completed_at?: string | null
          dataset_id?: string | null
          disease_type: string
          f1_score?: number | null
          id?: string
          model_type?: string
          precision_score?: number | null
          recall_score?: number | null
          started_at?: string | null
          status?: string | null
          training_params?: Json | null
        }
        Update: {
          accuracy?: number | null
          completed_at?: string | null
          dataset_id?: string | null
          disease_type?: string
          f1_score?: number | null
          id?: string
          model_type?: string
          precision_score?: number | null
          recall_score?: number | null
          started_at?: string | null
          status?: string | null
          training_params?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "ml_training_runs_dataset_id_fkey"
            columns: ["dataset_id"]
            isOneToOne: false
            referencedRelation: "ml_datasets"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          read?: boolean
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      patient_medical_history: {
        Row: {
          condition: string
          created_at: string
          diagnosed_date: string | null
          id: string
          notes: string | null
          patient_id: string
          status: string | null
        }
        Insert: {
          condition: string
          created_at?: string
          diagnosed_date?: string | null
          id?: string
          notes?: string | null
          patient_id: string
          status?: string | null
        }
        Update: {
          condition?: string
          created_at?: string
          diagnosed_date?: string | null
          id?: string
          notes?: string | null
          patient_id?: string
          status?: string | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          appointment_id: string | null
          completed_at: string | null
          created_at: string | null
          currency: string | null
          doctor_id: string
          id: string
          patient_id: string
          payment_method: string | null
          status: string | null
          transaction_id: string | null
          upi_id: string | null
        }
        Insert: {
          amount: number
          appointment_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          currency?: string | null
          doctor_id: string
          id?: string
          patient_id: string
          payment_method?: string | null
          status?: string | null
          transaction_id?: string | null
          upi_id?: string | null
        }
        Update: {
          amount?: number
          appointment_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          currency?: string | null
          doctor_id?: string
          id?: string
          patient_id?: string
          payment_method?: string | null
          status?: string | null
          transaction_id?: string | null
          upi_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
        ]
      }
      prescriptions: {
        Row: {
          appointment_id: string | null
          created_at: string
          doctor_id: string
          dosage: string
          duration: string | null
          frequency: string
          id: string
          instructions: string | null
          is_active: boolean | null
          medication_name: string
          patient_id: string
          prescribed_at: string
          refills_remaining: number | null
        }
        Insert: {
          appointment_id?: string | null
          created_at?: string
          doctor_id: string
          dosage: string
          duration?: string | null
          frequency: string
          id?: string
          instructions?: string | null
          is_active?: boolean | null
          medication_name: string
          patient_id: string
          prescribed_at?: string
          refills_remaining?: number | null
        }
        Update: {
          appointment_id?: string | null
          created_at?: string
          doctor_id?: string
          dosage?: string
          duration?: string | null
          frequency?: string
          id?: string
          instructions?: string | null
          is_active?: boolean | null
          medication_name?: string
          patient_id?: string
          prescribed_at?: string
          refills_remaining?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "prescriptions_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          created_at: string
          date_of_birth: string | null
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      role_requests: {
        Row: {
          created_at: string
          id: string
          reason: string | null
          requested_role: Database["public"]["Enums"]["app_role"]
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          user_current_role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          reason?: string | null
          requested_role: Database["public"]["Enums"]["app_role"]
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_current_role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          reason?: string | null
          requested_role?: Database["public"]["Enums"]["app_role"]
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_current_role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      doctor_payment_summary: {
        Row: {
          amount: number | null
          appointment_id: string | null
          completed_at: string | null
          created_at: string | null
          currency: string | null
          doctor_id: string | null
          id: string | null
          patient_id: string | null
          status: string | null
        }
        Insert: {
          amount?: number | null
          appointment_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          currency?: string | null
          doctor_id?: string | null
          id?: string | null
          patient_id?: string | null
          status?: string | null
        }
        Update: {
          amount?: number | null
          appointment_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          currency?: string | null
          doctor_id?: string | null
          id?: string | null
          patient_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
        ]
      }
      public_doctor_ratings: {
        Row: {
          created_at: string | null
          doctor_id: string | null
          id: string | null
          rating: number | null
          review_text: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          doctor_id?: string | null
          id?: string | null
          rating?: number | null
          review_text?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          doctor_id?: string | null
          id?: string | null
          rating?: number | null
          review_text?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "doctor_reviews_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
Functions: {
      admin_delete_user: { Args: { target_user_id: string }; Returns: boolean }
      admin_update_user_role: {
        Args: { target_user_id: string; new_role: string }
        Returns: boolean
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "patient" | "doctor" | "admin"
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
      app_role: ["patient", "doctor", "admin"],
    },
  },
} as const
