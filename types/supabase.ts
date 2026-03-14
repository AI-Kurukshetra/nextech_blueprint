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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      appointments: {
        Row: {
          appointment_type: Database["public"]["Enums"]["appointment_type"]
          check_in_at: string | null
          completed_at: string | null
          created_at: string
          created_by_user_id: string | null
          ends_at: string
          id: string
          location_id: string | null
          notes: string | null
          patient_id: string
          practice_id: string
          provider_user_id: string
          room_label: string | null
          starts_at: string
          status: Database["public"]["Enums"]["appointment_status"]
          updated_at: string
          visit_reason: string | null
        }
        Insert: {
          appointment_type?: Database["public"]["Enums"]["appointment_type"]
          check_in_at?: string | null
          completed_at?: string | null
          created_at?: string
          created_by_user_id?: string | null
          ends_at: string
          id?: string
          location_id?: string | null
          notes?: string | null
          patient_id: string
          practice_id: string
          provider_user_id: string
          room_label?: string | null
          starts_at: string
          status?: Database["public"]["Enums"]["appointment_status"]
          updated_at?: string
          visit_reason?: string | null
        }
        Update: {
          appointment_type?: Database["public"]["Enums"]["appointment_type"]
          check_in_at?: string | null
          completed_at?: string | null
          created_at?: string
          created_by_user_id?: string | null
          ends_at?: string
          id?: string
          location_id?: string | null
          notes?: string | null
          patient_id?: string
          practice_id?: string
          provider_user_id?: string
          room_label?: string | null
          starts_at?: string
          status?: Database["public"]["Enums"]["appointment_status"]
          updated_at?: string
          visit_reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_location_fk"
            columns: ["practice_id", "location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["practice_id", "id"]
          },
          {
            foreignKeyName: "appointments_patient_fk"
            columns: ["practice_id", "patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["practice_id", "id"]
          },
          {
            foreignKeyName: "appointments_practice_id_fkey"
            columns: ["practice_id"]
            isOneToOne: false
            referencedRelation: "practices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_provider_fk"
            columns: ["practice_id", "provider_user_id"]
            isOneToOne: false
            referencedRelation: "practice_memberships"
            referencedColumns: ["practice_id", "user_id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_user_id: string
          after_state: Json | null
          before_state: Json | null
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          metadata: Json
          practice_id: string
        }
        Insert: {
          action: string
          actor_user_id: string
          after_state?: Json | null
          before_state?: Json | null
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          metadata?: Json
          practice_id: string
        }
        Update: {
          action?: string
          actor_user_id?: string
          after_state?: Json | null
          before_state?: Json | null
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          metadata?: Json
          practice_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_fk"
            columns: ["practice_id", "actor_user_id"]
            isOneToOne: false
            referencedRelation: "practice_memberships"
            referencedColumns: ["practice_id", "user_id"]
          },
          {
            foreignKeyName: "audit_logs_practice_id_fkey"
            columns: ["practice_id"]
            isOneToOne: false
            referencedRelation: "practices"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_records: {
        Row: {
          allowed_amount: number | null
          appointment_id: string | null
          balance_amount: number
          charge_amount: number
          claim_reference: string | null
          cpt_code: string
          created_at: string
          icd10_codes: string[]
          id: string
          insurance_policy_id: string | null
          modifier_codes: string[]
          notes: string | null
          paid_at: string | null
          patient_id: string
          practice_id: string
          rendering_provider_user_id: string | null
          service_date: string
          status: Database["public"]["Enums"]["billing_status"]
          submitted_at: string | null
          units: number
          updated_at: string
        }
        Insert: {
          allowed_amount?: number | null
          appointment_id?: string | null
          balance_amount: number
          charge_amount: number
          claim_reference?: string | null
          cpt_code: string
          created_at?: string
          icd10_codes?: string[]
          id?: string
          insurance_policy_id?: string | null
          modifier_codes?: string[]
          notes?: string | null
          paid_at?: string | null
          patient_id: string
          practice_id: string
          rendering_provider_user_id?: string | null
          service_date: string
          status?: Database["public"]["Enums"]["billing_status"]
          submitted_at?: string | null
          units?: number
          updated_at?: string
        }
        Update: {
          allowed_amount?: number | null
          appointment_id?: string | null
          balance_amount?: number
          charge_amount?: number
          claim_reference?: string | null
          cpt_code?: string
          created_at?: string
          icd10_codes?: string[]
          id?: string
          insurance_policy_id?: string | null
          modifier_codes?: string[]
          notes?: string | null
          paid_at?: string | null
          patient_id?: string
          practice_id?: string
          rendering_provider_user_id?: string | null
          service_date?: string
          status?: Database["public"]["Enums"]["billing_status"]
          submitted_at?: string | null
          units?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_records_appointment_fk"
            columns: ["practice_id", "appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["practice_id", "id"]
          },
          {
            foreignKeyName: "billing_records_insurance_fk"
            columns: ["practice_id", "insurance_policy_id"]
            isOneToOne: false
            referencedRelation: "patient_insurance_policies"
            referencedColumns: ["practice_id", "id"]
          },
          {
            foreignKeyName: "billing_records_patient_fk"
            columns: ["practice_id", "patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["practice_id", "id"]
          },
          {
            foreignKeyName: "billing_records_practice_id_fkey"
            columns: ["practice_id"]
            isOneToOne: false
            referencedRelation: "practices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_records_rendering_provider_fk"
            columns: ["practice_id", "rendering_provider_user_id"]
            isOneToOne: false
            referencedRelation: "practice_memberships"
            referencedColumns: ["practice_id", "user_id"]
          },
        ]
      }
      clinical_notes: {
        Row: {
          appointment_id: string | null
          assessment: string | null
          author_user_id: string
          chief_complaint: string | null
          created_at: string
          diagnosis_codes: string[]
          id: string
          is_patient_visible: boolean
          note_type: Database["public"]["Enums"]["clinical_note_type"]
          objective: string | null
          patient_id: string
          plan: string | null
          practice_id: string
          signed_at: string | null
          status: Database["public"]["Enums"]["clinical_note_status"]
          subjective: string | null
          updated_at: string
        }
        Insert: {
          appointment_id?: string | null
          assessment?: string | null
          author_user_id: string
          chief_complaint?: string | null
          created_at?: string
          diagnosis_codes?: string[]
          id?: string
          is_patient_visible?: boolean
          note_type?: Database["public"]["Enums"]["clinical_note_type"]
          objective?: string | null
          patient_id: string
          plan?: string | null
          practice_id: string
          signed_at?: string | null
          status?: Database["public"]["Enums"]["clinical_note_status"]
          subjective?: string | null
          updated_at?: string
        }
        Update: {
          appointment_id?: string | null
          assessment?: string | null
          author_user_id?: string
          chief_complaint?: string | null
          created_at?: string
          diagnosis_codes?: string[]
          id?: string
          is_patient_visible?: boolean
          note_type?: Database["public"]["Enums"]["clinical_note_type"]
          objective?: string | null
          patient_id?: string
          plan?: string | null
          practice_id?: string
          signed_at?: string | null
          status?: Database["public"]["Enums"]["clinical_note_status"]
          subjective?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinical_notes_appointment_fk"
            columns: ["practice_id", "appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["practice_id", "id"]
          },
          {
            foreignKeyName: "clinical_notes_author_fk"
            columns: ["practice_id", "author_user_id"]
            isOneToOne: false
            referencedRelation: "practice_memberships"
            referencedColumns: ["practice_id", "user_id"]
          },
          {
            foreignKeyName: "clinical_notes_patient_fk"
            columns: ["practice_id", "patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["practice_id", "id"]
          },
          {
            foreignKeyName: "clinical_notes_practice_id_fkey"
            columns: ["practice_id"]
            isOneToOne: false
            referencedRelation: "practices"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          address_line_1: string | null
          address_line_2: string | null
          city: string | null
          code: string
          country_code: string
          created_at: string
          email: string | null
          id: string
          is_active: boolean
          name: string
          phone: string | null
          postal_code: string | null
          practice_id: string
          state_region: string | null
          updated_at: string
        }
        Insert: {
          address_line_1?: string | null
          address_line_2?: string | null
          city?: string | null
          code: string
          country_code?: string
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name: string
          phone?: string | null
          postal_code?: string | null
          practice_id: string
          state_region?: string | null
          updated_at?: string
        }
        Update: {
          address_line_1?: string | null
          address_line_2?: string | null
          city?: string | null
          code?: string
          country_code?: string
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name?: string
          phone?: string | null
          postal_code?: string | null
          practice_id?: string
          state_region?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "locations_practice_id_fkey"
            columns: ["practice_id"]
            isOneToOne: false
            referencedRelation: "practices"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_documents: {
        Row: {
          appointment_id: string | null
          captured_at: string | null
          created_at: string
          description: string | null
          document_type: Database["public"]["Enums"]["document_type"]
          file_name: string
          id: string
          is_patient_visible: boolean
          mime_type: string
          patient_id: string
          practice_id: string
          storage_bucket: string
          storage_path: string
          updated_at: string
          uploaded_by_user_id: string | null
        }
        Insert: {
          appointment_id?: string | null
          captured_at?: string | null
          created_at?: string
          description?: string | null
          document_type?: Database["public"]["Enums"]["document_type"]
          file_name: string
          id?: string
          is_patient_visible?: boolean
          mime_type: string
          patient_id: string
          practice_id: string
          storage_bucket?: string
          storage_path: string
          updated_at?: string
          uploaded_by_user_id?: string | null
        }
        Update: {
          appointment_id?: string | null
          captured_at?: string | null
          created_at?: string
          description?: string | null
          document_type?: Database["public"]["Enums"]["document_type"]
          file_name?: string
          id?: string
          is_patient_visible?: boolean
          mime_type?: string
          patient_id?: string
          practice_id?: string
          storage_bucket?: string
          storage_path?: string
          updated_at?: string
          uploaded_by_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patient_documents_appointment_fk"
            columns: ["practice_id", "appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["practice_id", "id"]
          },
          {
            foreignKeyName: "patient_documents_patient_fk"
            columns: ["practice_id", "patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["practice_id", "id"]
          },
          {
            foreignKeyName: "patient_documents_practice_id_fkey"
            columns: ["practice_id"]
            isOneToOne: false
            referencedRelation: "practices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_documents_uploaded_by_user_id_fkey"
            columns: ["uploaded_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_insurance_policies: {
        Row: {
          created_at: string
          group_number: string | null
          id: string
          is_primary: boolean
          member_id: string
          patient_id: string
          payer_name: string
          plan_name: string | null
          practice_id: string
          relationship_to_subscriber: string | null
          subscriber_name: string | null
          updated_at: string
          verified_at: string | null
        }
        Insert: {
          created_at?: string
          group_number?: string | null
          id?: string
          is_primary?: boolean
          member_id: string
          patient_id: string
          payer_name: string
          plan_name?: string | null
          practice_id: string
          relationship_to_subscriber?: string | null
          subscriber_name?: string | null
          updated_at?: string
          verified_at?: string | null
        }
        Update: {
          created_at?: string
          group_number?: string | null
          id?: string
          is_primary?: boolean
          member_id?: string
          patient_id?: string
          payer_name?: string
          plan_name?: string | null
          practice_id?: string
          relationship_to_subscriber?: string | null
          subscriber_name?: string | null
          updated_at?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patient_insurance_policies_patient_fk"
            columns: ["practice_id", "patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["practice_id", "id"]
          },
          {
            foreignKeyName: "patient_insurance_policies_practice_id_fkey"
            columns: ["practice_id"]
            isOneToOne: false
            referencedRelation: "practices"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          address_line_1: string | null
          address_line_2: string | null
          allergies: string[]
          chart_number: string
          city: string | null
          country_code: string
          created_at: string
          date_of_birth: string
          dermatology_flags: string[]
          email: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          first_name: string
          id: string
          last_name: string
          last_visit_at: string | null
          phone: string | null
          portal_enabled: boolean
          portal_user_id: string | null
          postal_code: string | null
          practice_id: string
          preferred_name: string | null
          sex_at_birth: Database["public"]["Enums"]["administrative_sex"]
          state_region: string | null
          status: Database["public"]["Enums"]["patient_status"]
          updated_at: string
        }
        Insert: {
          address_line_1?: string | null
          address_line_2?: string | null
          allergies?: string[]
          chart_number?: string
          city?: string | null
          country_code?: string
          created_at?: string
          date_of_birth: string
          dermatology_flags?: string[]
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          first_name: string
          id?: string
          last_name: string
          last_visit_at?: string | null
          phone?: string | null
          portal_enabled?: boolean
          portal_user_id?: string | null
          postal_code?: string | null
          practice_id: string
          preferred_name?: string | null
          sex_at_birth?: Database["public"]["Enums"]["administrative_sex"]
          state_region?: string | null
          status?: Database["public"]["Enums"]["patient_status"]
          updated_at?: string
        }
        Update: {
          address_line_1?: string | null
          address_line_2?: string | null
          allergies?: string[]
          chart_number?: string
          city?: string | null
          country_code?: string
          created_at?: string
          date_of_birth?: string
          dermatology_flags?: string[]
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          first_name?: string
          id?: string
          last_name?: string
          last_visit_at?: string | null
          phone?: string | null
          portal_enabled?: boolean
          portal_user_id?: string | null
          postal_code?: string | null
          practice_id?: string
          preferred_name?: string | null
          sex_at_birth?: Database["public"]["Enums"]["administrative_sex"]
          state_region?: string | null
          status?: Database["public"]["Enums"]["patient_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "patients_portal_user_id_fkey"
            columns: ["portal_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patients_practice_id_fkey"
            columns: ["practice_id"]
            isOneToOne: false
            referencedRelation: "practices"
            referencedColumns: ["id"]
          },
        ]
      }
      practice_memberships: {
        Row: {
          created_at: string
          employment_title: string | null
          id: string
          invited_by_user_id: string | null
          is_active: boolean
          practice_id: string
          role: Database["public"]["Enums"]["staff_role"]
          specialties: Database["public"]["Enums"]["medical_specialty"][]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          employment_title?: string | null
          id?: string
          invited_by_user_id?: string | null
          is_active?: boolean
          practice_id: string
          role: Database["public"]["Enums"]["staff_role"]
          specialties?: Database["public"]["Enums"]["medical_specialty"][]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          employment_title?: string | null
          id?: string
          invited_by_user_id?: string | null
          is_active?: boolean
          practice_id?: string
          role?: Database["public"]["Enums"]["staff_role"]
          specialties?: Database["public"]["Enums"]["medical_specialty"][]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "practice_memberships_invited_by_user_id_fkey"
            columns: ["invited_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "practice_memberships_practice_id_fkey"
            columns: ["practice_id"]
            isOneToOne: false
            referencedRelation: "practices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "practice_memberships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      practice_member_locations: {
        Row: {
          assigned_by_user_id: string | null
          created_at: string
          location_id: string
          practice_id: string
          user_id: string
        }
        Insert: {
          assigned_by_user_id?: string | null
          created_at?: string
          location_id: string
          practice_id: string
          user_id: string
        }
        Update: {
          assigned_by_user_id?: string | null
          created_at?: string
          location_id?: string
          practice_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "practice_member_locations_assigned_by_user_id_fkey"
            columns: ["assigned_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "practice_member_locations_location_fk"
            columns: ["practice_id", "location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["practice_id", "id"]
          },
          {
            foreignKeyName: "practice_member_locations_membership_fk"
            columns: ["practice_id", "user_id"]
            isOneToOne: false
            referencedRelation: "practice_memberships"
            referencedColumns: ["practice_id", "user_id"]
          },
          {
            foreignKeyName: "practice_member_locations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      practices: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          owner_user_id: string
          primary_email: string | null
          primary_phone: string | null
          slug: string
          specialties: Database["public"]["Enums"]["medical_specialty"][]
          timezone: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          owner_user_id: string
          primary_email?: string | null
          primary_phone?: string | null
          slug: string
          specialties?: Database["public"]["Enums"]["medical_specialty"][]
          timezone?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          owner_user_id?: string
          primary_email?: string | null
          primary_phone?: string | null
          slug?: string
          specialties?: Database["public"]["Enums"]["medical_specialty"][]
          timezone?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "practices_owner_user_id_fkey"
            columns: ["owner_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          email: string | null
          first_name: string | null
          id: string
          last_name: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          first_name?: string | null
          id: string
          last_name?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_location_access: {
        Args: { target_location_id: string; target_practice_id: string }
        Returns: boolean
      }
      is_patient_in_practice: {
        Args: { target_practice_id: string }
        Returns: boolean
      }
      is_patient_portal_owner: {
        Args: { target_patient_id: string }
        Returns: boolean
      }
      is_practice_admin: {
        Args: { target_practice_id: string }
        Returns: boolean
      }
      is_practice_member: {
        Args: { target_practice_id: string }
        Returns: boolean
      }
      shares_practice_with_user: {
        Args: { target_user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      administrative_sex: "female" | "male" | "intersex" | "unknown"
      appointment_status:
        | "scheduled"
        | "checked_in"
        | "in_room"
        | "completed"
        | "cancelled"
        | "no_show"
      appointment_type: "new_patient" | "follow_up" | "procedure" | "telehealth"
      billing_status:
        | "draft"
        | "ready_to_submit"
        | "submitted"
        | "partially_paid"
        | "paid"
        | "denied"
        | "void"
      clinical_note_status: "draft" | "signed" | "addendum"
      clinical_note_type: "soap" | "consult" | "procedure" | "follow_up"
      document_type:
        | "clinical_photo"
        | "consent_form"
        | "lab_result"
        | "referral"
        | "insurance_card"
        | "treatment_plan"
        | "invoice"
        | "external_record"
        | "other"
      medical_specialty: "dermatology" | "ophthalmology" | "plastic_surgery"
      patient_status: "active" | "inactive" | "archived"
      staff_role:
        | "practice_owner"
        | "practice_admin"
        | "provider"
        | "nurse"
        | "medical_assistant"
        | "front_desk"
        | "biller"
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
      administrative_sex: ["female", "male", "intersex", "unknown"],
      appointment_status: [
        "scheduled",
        "checked_in",
        "in_room",
        "completed",
        "cancelled",
        "no_show",
      ],
      appointment_type: ["new_patient", "follow_up", "procedure", "telehealth"],
      billing_status: [
        "draft",
        "ready_to_submit",
        "submitted",
        "partially_paid",
        "paid",
        "denied",
        "void",
      ],
      clinical_note_status: ["draft", "signed", "addendum"],
      clinical_note_type: ["soap", "consult", "procedure", "follow_up"],
      document_type: [
        "clinical_photo",
        "consent_form",
        "lab_result",
        "referral",
        "insurance_card",
        "treatment_plan",
        "invoice",
        "external_record",
        "other",
      ],
      medical_specialty: ["dermatology", "ophthalmology", "plastic_surgery"],
      patient_status: ["active", "inactive", "archived"],
      staff_role: [
        "practice_owner",
        "practice_admin",
        "provider",
        "nurse",
        "medical_assistant",
        "front_desk",
        "biller",
      ],
    },
  },
} as const

