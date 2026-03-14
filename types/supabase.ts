export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type EmptyTable = {
  Row: Record<string, never>;
  Insert: Record<string, never>;
  Update: Record<string, never>;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      appointments: {
        Row: {
          appointment_type: Database["public"]["Enums"]["appointment_type"];
          check_in_at: string | null;
          completed_at: string | null;
          created_at: string;
          created_by_user_id: string | null;
          ends_at: string;
          id: string;
          location_id: string | null;
          notes: string | null;
          patient_id: string;
          practice_id: string;
          provider_user_id: string;
          room_label: string | null;
          starts_at: string;
          status: Database["public"]["Enums"]["appointment_status"];
          updated_at: string;
          visit_reason: string | null;
        };
        Insert: {
          appointment_type?: Database["public"]["Enums"]["appointment_type"];
          check_in_at?: string | null;
          completed_at?: string | null;
          created_at?: string;
          created_by_user_id?: string | null;
          ends_at: string;
          id?: string;
          location_id?: string | null;
          notes?: string | null;
          patient_id: string;
          practice_id: string;
          provider_user_id: string;
          room_label?: string | null;
          starts_at: string;
          status?: Database["public"]["Enums"]["appointment_status"];
          updated_at?: string;
          visit_reason?: string | null;
        };
        Update: {
          appointment_type?: Database["public"]["Enums"]["appointment_type"];
          check_in_at?: string | null;
          completed_at?: string | null;
          created_at?: string;
          created_by_user_id?: string | null;
          ends_at?: string;
          id?: string;
          location_id?: string | null;
          notes?: string | null;
          patient_id?: string;
          practice_id?: string;
          provider_user_id?: string;
          room_label?: string | null;
          starts_at?: string;
          status?: Database["public"]["Enums"]["appointment_status"];
          updated_at?: string;
          visit_reason?: string | null;
        };
        Relationships: [];
      };
      audit_logs: EmptyTable;
      billing_records: {
        Row: {
          allowed_amount: number | null;
          appointment_id: string | null;
          balance_amount: number;
          charge_amount: number;
          claim_reference: string | null;
          cpt_code: string;
          created_at: string;
          icd10_codes: string[];
          id: string;
          insurance_policy_id: string | null;
          modifier_codes: string[];
          notes: string | null;
          paid_at: string | null;
          patient_id: string;
          practice_id: string;
          rendering_provider_user_id: string | null;
          service_date: string;
          status: Database["public"]["Enums"]["billing_status"];
          submitted_at: string | null;
          units: number;
          updated_at: string;
        };
        Insert: {
          allowed_amount?: number | null;
          appointment_id?: string | null;
          balance_amount: number;
          charge_amount: number;
          claim_reference?: string | null;
          cpt_code: string;
          created_at?: string;
          icd10_codes?: string[];
          id?: string;
          insurance_policy_id?: string | null;
          modifier_codes?: string[];
          notes?: string | null;
          paid_at?: string | null;
          patient_id: string;
          practice_id: string;
          rendering_provider_user_id?: string | null;
          service_date: string;
          status?: Database["public"]["Enums"]["billing_status"];
          submitted_at?: string | null;
          units?: number;
          updated_at?: string;
        };
        Update: {
          allowed_amount?: number | null;
          appointment_id?: string | null;
          balance_amount?: number;
          charge_amount?: number;
          claim_reference?: string | null;
          cpt_code?: string;
          created_at?: string;
          icd10_codes?: string[];
          id?: string;
          insurance_policy_id?: string | null;
          modifier_codes?: string[];
          notes?: string | null;
          paid_at?: string | null;
          patient_id?: string;
          practice_id?: string;
          rendering_provider_user_id?: string | null;
          service_date?: string;
          status?: Database["public"]["Enums"]["billing_status"];
          submitted_at?: string | null;
          units?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      clinical_notes: {
        Row: {
          assessment: string | null;
          appointment_id: string | null;
          author_user_id: string;
          chief_complaint: string | null;
          created_at: string;
          diagnosis_codes: string[];
          id: string;
          is_patient_visible: boolean;
          note_type: Database["public"]["Enums"]["clinical_note_type"];
          objective: string | null;
          patient_id: string;
          plan: string | null;
          practice_id: string;
          signed_at: string | null;
          status: Database["public"]["Enums"]["clinical_note_status"];
          subjective: string | null;
          updated_at: string;
        };
        Insert: {
          assessment?: string | null;
          appointment_id?: string | null;
          author_user_id: string;
          chief_complaint?: string | null;
          created_at?: string;
          diagnosis_codes?: string[];
          id?: string;
          is_patient_visible?: boolean;
          note_type?: Database["public"]["Enums"]["clinical_note_type"];
          objective?: string | null;
          patient_id: string;
          plan?: string | null;
          practice_id: string;
          signed_at?: string | null;
          status?: Database["public"]["Enums"]["clinical_note_status"];
          subjective?: string | null;
          updated_at?: string;
        };
        Update: {
          assessment?: string | null;
          appointment_id?: string | null;
          author_user_id?: string;
          chief_complaint?: string | null;
          created_at?: string;
          diagnosis_codes?: string[];
          id?: string;
          is_patient_visible?: boolean;
          note_type?: Database["public"]["Enums"]["clinical_note_type"];
          objective?: string | null;
          patient_id?: string;
          plan?: string | null;
          practice_id?: string;
          signed_at?: string | null;
          status?: Database["public"]["Enums"]["clinical_note_status"];
          subjective?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      locations: {
        Row: {
          address_line_1: string | null;
          address_line_2: string | null;
          city: string | null;
          code: string;
          country_code: string;
          created_at: string;
          email: string | null;
          id: string;
          is_active: boolean;
          name: string;
          phone: string | null;
          postal_code: string | null;
          practice_id: string;
          state_region: string | null;
          updated_at: string;
        };
        Insert: {
          address_line_1?: string | null;
          address_line_2?: string | null;
          city?: string | null;
          code: string;
          country_code?: string;
          created_at?: string;
          email?: string | null;
          id?: string;
          is_active?: boolean;
          name: string;
          phone?: string | null;
          postal_code?: string | null;
          practice_id: string;
          state_region?: string | null;
          updated_at?: string;
        };
        Update: {
          address_line_1?: string | null;
          address_line_2?: string | null;
          city?: string | null;
          code?: string;
          country_code?: string;
          created_at?: string;
          email?: string | null;
          id?: string;
          is_active?: boolean;
          name?: string;
          phone?: string | null;
          postal_code?: string | null;
          practice_id?: string;
          state_region?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      patient_documents: {
        Row: {
          appointment_id: string | null;
          captured_at: string | null;
          created_at: string;
          description: string | null;
          document_type: Database["public"]["Enums"]["document_type"];
          file_name: string;
          id: string;
          is_patient_visible: boolean;
          mime_type: string;
          patient_id: string;
          practice_id: string;
          storage_bucket: string;
          storage_path: string;
          updated_at: string;
          uploaded_by_user_id: string | null;
        };
        Insert: {
          appointment_id?: string | null;
          captured_at?: string | null;
          created_at?: string;
          description?: string | null;
          document_type?: Database["public"]["Enums"]["document_type"];
          file_name: string;
          id?: string;
          is_patient_visible?: boolean;
          mime_type: string;
          patient_id: string;
          practice_id: string;
          storage_bucket?: string;
          storage_path: string;
          updated_at?: string;
          uploaded_by_user_id?: string | null;
        };
        Update: {
          appointment_id?: string | null;
          captured_at?: string | null;
          created_at?: string;
          description?: string | null;
          document_type?: Database["public"]["Enums"]["document_type"];
          file_name?: string;
          id?: string;
          is_patient_visible?: boolean;
          mime_type?: string;
          patient_id?: string;
          practice_id?: string;
          storage_bucket?: string;
          storage_path?: string;
          updated_at?: string;
          uploaded_by_user_id?: string | null;
        };
        Relationships: [];
      };
      patient_insurance_policies: {
        Row: {
          created_at: string;
          group_number: string | null;
          id: string;
          is_primary: boolean;
          member_id: string;
          patient_id: string;
          payer_name: string;
          plan_name: string | null;
          practice_id: string;
          relationship_to_subscriber: string | null;
          subscriber_name: string | null;
          updated_at: string;
          verified_at: string | null;
        };
        Insert: {
          created_at?: string;
          group_number?: string | null;
          id?: string;
          is_primary?: boolean;
          member_id: string;
          patient_id: string;
          payer_name: string;
          plan_name?: string | null;
          practice_id: string;
          relationship_to_subscriber?: string | null;
          subscriber_name?: string | null;
          updated_at?: string;
          verified_at?: string | null;
        };
        Update: {
          created_at?: string;
          group_number?: string | null;
          id?: string;
          is_primary?: boolean;
          member_id?: string;
          patient_id?: string;
          payer_name?: string;
          plan_name?: string | null;
          practice_id?: string;
          relationship_to_subscriber?: string | null;
          subscriber_name?: string | null;
          updated_at?: string;
          verified_at?: string | null;
        };
        Relationships: [];
      };
      patients: {
        Row: {
          address_line_1: string | null;
          address_line_2: string | null;
          allergies: string[];
          chart_number: string;
          city: string | null;
          country_code: string;
          created_at: string;
          date_of_birth: string;
          dermatology_flags: string[];
          email: string | null;
          emergency_contact_name: string | null;
          emergency_contact_phone: string | null;
          first_name: string;
          id: string;
          last_name: string;
          last_visit_at: string | null;
          phone: string | null;
          portal_enabled: boolean;
          portal_user_id: string | null;
          postal_code: string | null;
          practice_id: string;
          preferred_name: string | null;
          sex_at_birth: Database["public"]["Enums"]["administrative_sex"];
          state_region: string | null;
          status: Database["public"]["Enums"]["patient_status"];
          updated_at: string;
        };
        Insert: {
          address_line_1?: string | null;
          address_line_2?: string | null;
          allergies?: string[];
          chart_number?: string;
          city?: string | null;
          country_code?: string;
          created_at?: string;
          date_of_birth: string;
          dermatology_flags?: string[];
          email?: string | null;
          emergency_contact_name?: string | null;
          emergency_contact_phone?: string | null;
          first_name: string;
          id?: string;
          last_name: string;
          last_visit_at?: string | null;
          phone?: string | null;
          portal_enabled?: boolean;
          portal_user_id?: string | null;
          postal_code?: string | null;
          practice_id: string;
          preferred_name?: string | null;
          sex_at_birth?: Database["public"]["Enums"]["administrative_sex"];
          state_region?: string | null;
          status?: Database["public"]["Enums"]["patient_status"];
          updated_at?: string;
        };
        Update: {
          address_line_1?: string | null;
          address_line_2?: string | null;
          allergies?: string[];
          chart_number?: string;
          city?: string | null;
          country_code?: string;
          created_at?: string;
          date_of_birth?: string;
          dermatology_flags?: string[];
          email?: string | null;
          emergency_contact_name?: string | null;
          emergency_contact_phone?: string | null;
          first_name?: string;
          id?: string;
          last_name?: string;
          last_visit_at?: string | null;
          phone?: string | null;
          portal_enabled?: boolean;
          portal_user_id?: string | null;
          postal_code?: string | null;
          practice_id?: string;
          preferred_name?: string | null;
          sex_at_birth?: Database["public"]["Enums"]["administrative_sex"];
          state_region?: string | null;
          status?: Database["public"]["Enums"]["patient_status"];
          updated_at?: string;
        };
        Relationships: [];
      };
      practice_member_locations: {
        Row: {
          assigned_by_user_id: string | null;
          created_at: string;
          location_id: string;
          practice_id: string;
          user_id: string;
        };
        Insert: {
          assigned_by_user_id?: string | null;
          created_at?: string;
          location_id: string;
          practice_id: string;
          user_id: string;
        };
        Update: {
          assigned_by_user_id?: string | null;
          created_at?: string;
          location_id?: string;
          practice_id?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      practice_memberships: {
        Row: {
          created_at: string;
          employment_title: string | null;
          id: string;
          invited_by_user_id: string | null;
          is_active: boolean;
          practice_id: string;
          role: Database["public"]["Enums"]["staff_role"];
          specialties: Database["public"]["Enums"]["medical_specialty"][];
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          employment_title?: string | null;
          id?: string;
          invited_by_user_id?: string | null;
          is_active?: boolean;
          practice_id: string;
          role: Database["public"]["Enums"]["staff_role"];
          specialties?: Database["public"]["Enums"]["medical_specialty"][];
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          employment_title?: string | null;
          id?: string;
          invited_by_user_id?: string | null;
          is_active?: boolean;
          practice_id?: string;
          role?: Database["public"]["Enums"]["staff_role"];
          specialties?: Database["public"]["Enums"]["medical_specialty"][];
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      practices: {
        Row: {
          created_at: string;
          id: string;
          is_active: boolean;
          name: string;
          owner_user_id: string;
          primary_email: string | null;
          primary_phone: string | null;
          slug: string;
          specialties: Database["public"]["Enums"]["medical_specialty"][];
          timezone: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          is_active?: boolean;
          name: string;
          owner_user_id: string;
          primary_email?: string | null;
          primary_phone?: string | null;
          slug: string;
          specialties?: Database["public"]["Enums"]["medical_specialty"][];
          timezone?: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          is_active?: boolean;
          name?: string;
          owner_user_id?: string;
          primary_email?: string | null;
          primary_phone?: string | null;
          slug?: string;
          specialties?: Database["public"]["Enums"]["medical_specialty"][];
          timezone?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          display_name: string | null;
          email: string | null;
          first_name: string | null;
          id: string;
          last_name: string | null;
          phone: string | null;
          updated_at: string;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          display_name?: string | null;
          email?: string | null;
          first_name?: string | null;
          id: string;
          last_name?: string | null;
          phone?: string | null;
          updated_at?: string;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          display_name?: string | null;
          email?: string | null;
          first_name?: string | null;
          id?: string;
          last_name?: string | null;
          phone?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      has_location_access: {
        Args: {
          target_location_id: string;
          target_practice_id: string;
        };
        Returns: boolean;
      };
      is_patient_in_practice: {
        Args: {
          target_practice_id: string;
        };
        Returns: boolean;
      };
      is_patient_portal_owner: {
        Args: {
          target_patient_id: string;
        };
        Returns: boolean;
      };
      is_practice_admin: {
        Args: {
          target_practice_id: string;
        };
        Returns: boolean;
      };
      is_practice_member: {
        Args: {
          target_practice_id: string;
        };
        Returns: boolean;
      };
      shares_practice_with_user: {
        Args: {
          target_user_id: string;
        };
        Returns: boolean;
      };
    };
    Enums: {
      administrative_sex: "female" | "male" | "intersex" | "unknown";
      appointment_status:
        | "scheduled"
        | "checked_in"
        | "in_room"
        | "completed"
        | "cancelled"
        | "no_show";
      appointment_type:
        | "new_patient"
        | "follow_up"
        | "procedure"
        | "telehealth";
      billing_status:
        | "draft"
        | "ready_to_submit"
        | "submitted"
        | "partially_paid"
        | "paid"
        | "denied"
        | "void";
      clinical_note_status: "draft" | "signed" | "addendum";
      clinical_note_type: "soap" | "consult" | "procedure" | "follow_up";
      document_type:
        | "clinical_photo"
        | "consent_form"
        | "lab_result"
        | "referral"
        | "insurance_card"
        | "treatment_plan"
        | "invoice"
        | "external_record"
        | "other";
      medical_specialty: "dermatology" | "ophthalmology" | "plastic_surgery";
      patient_status: "active" | "inactive" | "archived";
      staff_role:
        | "practice_owner"
        | "practice_admin"
        | "provider"
        | "nurse"
        | "medical_assistant"
        | "front_desk"
        | "biller";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type PublicSchema = Database["public"];

export type Tables<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Row: infer Row;
    }
    ? Row
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Row: infer Row;
      }
      ? Row
      : never
    : never;

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer Insert;
    }
    ? Insert
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer Insert;
      }
      ? Insert
      : never
    : never;

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer Update;
    }
    ? Update
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer Update;
      }
      ? Update
      : never
    : never;

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never;
