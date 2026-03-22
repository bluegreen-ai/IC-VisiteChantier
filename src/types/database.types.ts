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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      betc_buildings: {
        Row: {
          address: string | null
          building_type: string | null
          city: string | null
          construction_year: number | null
          created_at: string | null
          description: string | null
          floor_count: number | null
          id: string
          latitude: number | null
          longitude: number | null
          metadata: Json | null
          name: string
          postal_code: string | null
          structural_system: string | null
          surface_area: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          address?: string | null
          building_type?: string | null
          city?: string | null
          construction_year?: number | null
          created_at?: string | null
          description?: string | null
          floor_count?: number | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          metadata?: Json | null
          name: string
          postal_code?: string | null
          structural_system?: string | null
          surface_area?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          address?: string | null
          building_type?: string | null
          city?: string | null
          construction_year?: number | null
          created_at?: string | null
          description?: string | null
          floor_count?: number | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          metadata?: Json | null
          name?: string
          postal_code?: string | null
          structural_system?: string | null
          surface_area?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "betc_buildings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "shared_users_access_view"
            referencedColumns: ["user_id"]
          },
        ]
      }
      betc_messages: {
        Row: {
          attachments: Json | null
          content: string
          created_at: string | null
          id: string
          metadata: Json | null
          mission_id: string
          role: string
        }
        Insert: {
          attachments?: Json | null
          content: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          mission_id: string
          role: string
        }
        Update: {
          attachments?: Json | null
          content?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          mission_id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "betc_messages_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "betc_missions"
            referencedColumns: ["id"]
          },
        ]
      }
      betc_missions: {
        Row: {
          brief: string | null
          building_id: string | null
          checklist: Json | null
          created_at: string | null
          id: string
          metadata: Json | null
          name: string
          status: string | null
          type: string | null
          updated_at: string | null
          user_id: string
          visited_at: string | null
        }
        Insert: {
          brief?: string | null
          building_id?: string | null
          checklist?: Json | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          name: string
          status?: string | null
          type?: string | null
          updated_at?: string | null
          user_id: string
          visited_at?: string | null
        }
        Update: {
          brief?: string | null
          building_id?: string | null
          checklist?: Json | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          name?: string
          status?: string | null
          type?: string | null
          updated_at?: string | null
          user_id?: string
          visited_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "betc_missions_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "betc_buildings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "betc_missions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "shared_users_access_view"
            referencedColumns: ["user_id"]
          },
        ]
      }
      betc_observations: {
        Row: {
          action: string | null
          cause: string | null
          created_at: string | null
          description: string
          element: string | null
          id: string
          metadata: Json | null
          mission_id: string
          ref: string | null
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          action?: string | null
          cause?: string | null
          created_at?: string | null
          description: string
          element?: string | null
          id?: string
          metadata?: Json | null
          mission_id: string
          ref?: string | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          action?: string | null
          cause?: string | null
          created_at?: string | null
          description?: string
          element?: string | null
          id?: string
          metadata?: Json | null
          mission_id?: string
          ref?: string | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "betc_observations_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "betc_missions"
            referencedColumns: ["id"]
          },
        ]
      }
      betc_photos: {
        Row: {
          created_at: string | null
          filename: string
          height: number | null
          id: string
          message_id: string | null
          metadata: Json | null
          mission_id: string
          observation_id: string | null
          size_bytes: number | null
          storage_path: string
          width: number | null
        }
        Insert: {
          created_at?: string | null
          filename: string
          height?: number | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          mission_id: string
          observation_id?: string | null
          size_bytes?: number | null
          storage_path: string
          width?: number | null
        }
        Update: {
          created_at?: string | null
          filename?: string
          height?: number | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          mission_id?: string
          observation_id?: string | null
          size_bytes?: number | null
          storage_path?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "betc_photos_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "betc_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "betc_photos_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "betc_missions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "betc_photos_observation_id_fkey"
            columns: ["observation_id"]
            isOneToOne: false
            referencedRelation: "betc_observations"
            referencedColumns: ["id"]
          },
        ]
      }
      betc_reports: {
        Row: {
          created_at: string | null
          generated_at: string | null
          id: string
          mission_id: string
          report_type: string | null
          sections: Json | null
          status: string | null
          storage_path: string | null
          template_id: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          generated_at?: string | null
          id?: string
          mission_id: string
          report_type?: string | null
          sections?: Json | null
          status?: string | null
          storage_path?: string | null
          template_id?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          generated_at?: string | null
          id?: string
          mission_id?: string
          report_type?: string | null
          sections?: Json | null
          status?: string | null
          storage_path?: string | null
          template_id?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "betc_reports_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "betc_missions"
            referencedColumns: ["id"]
          },
        ]
      }
      bgign_bdtopo_buildings: {
        Row: {
          centroid: unknown
          cleabs: string | null
          code_insee: string | null
          code_postal: string | null
          construction_legere: boolean | null
          created_at: string | null
          department: string
          estimated_floors: number | null
          etat: string | null
          geom: unknown
          hauteur: number | null
          id: string
          import_date: string | null
          nature: string | null
          nom_commune: string | null
          nom_voie: string | null
          numero: string | null
          rep: string | null
          rnb_id: string | null
          source_file: string | null
          updated_at: string | null
          usage1: string | null
          usage2: string | null
        }
        Insert: {
          centroid?: unknown
          cleabs?: string | null
          code_insee?: string | null
          code_postal?: string | null
          construction_legere?: boolean | null
          created_at?: string | null
          department: string
          estimated_floors?: number | null
          etat?: string | null
          geom: unknown
          hauteur?: number | null
          id?: string
          import_date?: string | null
          nature?: string | null
          nom_commune?: string | null
          nom_voie?: string | null
          numero?: string | null
          rep?: string | null
          rnb_id?: string | null
          source_file?: string | null
          updated_at?: string | null
          usage1?: string | null
          usage2?: string | null
        }
        Update: {
          centroid?: unknown
          cleabs?: string | null
          code_insee?: string | null
          code_postal?: string | null
          construction_legere?: boolean | null
          created_at?: string | null
          department?: string
          estimated_floors?: number | null
          etat?: string | null
          geom?: unknown
          hauteur?: number | null
          id?: string
          import_date?: string | null
          nature?: string | null
          nom_commune?: string | null
          nom_voie?: string | null
          numero?: string | null
          rep?: string | null
          rnb_id?: string | null
          source_file?: string | null
          updated_at?: string | null
          usage1?: string | null
          usage2?: string | null
        }
        Relationships: []
      }
      bgign_datasets: {
        Row: {
          active: boolean | null
          code: string
          created_at: string | null
          description: string | null
          download_url_pattern: string | null
          id: string
          name: string
          provider: string | null
          release_date: string | null
          updated_at: string | null
          version: string | null
        }
        Insert: {
          active?: boolean | null
          code: string
          created_at?: string | null
          description?: string | null
          download_url_pattern?: string | null
          id?: string
          name: string
          provider?: string | null
          release_date?: string | null
          updated_at?: string | null
          version?: string | null
        }
        Update: {
          active?: boolean | null
          code?: string
          created_at?: string | null
          description?: string | null
          download_url_pattern?: string | null
          id?: string
          name?: string
          provider?: string | null
          release_date?: string | null
          updated_at?: string | null
          version?: string | null
        }
        Relationships: []
      }
      bgign_department_coverage: {
        Row: {
          bbox: unknown
          created_at: string | null
          dataset_code: string
          department: string
          error_message: string | null
          id: string
          import_date: string | null
          import_duration_seconds: number | null
          import_status: string | null
          layer: string
          record_count: number | null
          source_file: string | null
          storage_bucket: string | null
          storage_path: string | null
          tiles_generated: boolean | null
          tiles_generation_date: string | null
          tiles_url: string | null
          updated_at: string | null
        }
        Insert: {
          bbox?: unknown
          created_at?: string | null
          dataset_code: string
          department: string
          error_message?: string | null
          id?: string
          import_date?: string | null
          import_duration_seconds?: number | null
          import_status?: string | null
          layer: string
          record_count?: number | null
          source_file?: string | null
          storage_bucket?: string | null
          storage_path?: string | null
          tiles_generated?: boolean | null
          tiles_generation_date?: string | null
          tiles_url?: string | null
          updated_at?: string | null
        }
        Update: {
          bbox?: unknown
          created_at?: string | null
          dataset_code?: string
          department?: string
          error_message?: string | null
          id?: string
          import_date?: string | null
          import_duration_seconds?: number | null
          import_status?: string | null
          layer?: string
          record_count?: number | null
          source_file?: string | null
          storage_bucket?: string | null
          storage_path?: string | null
          tiles_generated?: boolean | null
          tiles_generation_date?: string | null
          tiles_url?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bgign_department_coverage_dataset_code_fkey"
            columns: ["dataset_code"]
            isOneToOne: false
            referencedRelation: "bgign_datasets"
            referencedColumns: ["code"]
          },
        ]
      }
      bgign_download_queue: {
        Row: {
          completed_at: string | null
          created_at: string | null
          dataset_code: string
          department: string
          error_message: string | null
          id: string
          layer: string
          max_retries: number | null
          priority: number | null
          requested_by: string | null
          retry_count: number | null
          started_at: string | null
          status: string | null
          trigger_source: string | null
          updated_at: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          dataset_code: string
          department: string
          error_message?: string | null
          id?: string
          layer: string
          max_retries?: number | null
          priority?: number | null
          requested_by?: string | null
          retry_count?: number | null
          started_at?: string | null
          status?: string | null
          trigger_source?: string | null
          updated_at?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          dataset_code?: string
          department?: string
          error_message?: string | null
          id?: string
          layer?: string
          max_retries?: number | null
          priority?: number | null
          requested_by?: string | null
          retry_count?: number | null
          started_at?: string | null
          status?: string | null
          trigger_source?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bgign_download_queue_dataset_code_fkey"
            columns: ["dataset_code"]
            isOneToOne: false
            referencedRelation: "bgign_datasets"
            referencedColumns: ["code"]
          },
        ]
      }
      buildings: {
        Row: {
          building_id: string | null
          building_name: string | null
          cleabs: string | null
          created_at: string | null
          fid: number | null
          geometry: unknown
          hauteur: number | null
          id: string
          nombre_d_etages: number | null
          nombre_de_logement: number | null
          residence_id: string | null
          usage_1: string | null
        }
        Insert: {
          building_id?: string | null
          building_name?: string | null
          cleabs?: string | null
          created_at?: string | null
          fid?: number | null
          geometry: unknown
          hauteur?: number | null
          id?: string
          nombre_d_etages?: number | null
          nombre_de_logement?: number | null
          residence_id?: string | null
          usage_1?: string | null
        }
        Update: {
          building_id?: string | null
          building_name?: string | null
          cleabs?: string | null
          created_at?: string | null
          fid?: number | null
          geometry?: unknown
          hauteur?: number | null
          id?: string
          nombre_d_etages?: number | null
          nombre_de_logement?: number | null
          residence_id?: string | null
          usage_1?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "buildings_residence_id_fkey"
            columns: ["residence_id"]
            isOneToOne: false
            referencedRelation: "residences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "buildings_residence_id_fkey"
            columns: ["residence_id"]
            isOneToOne: false
            referencedRelation: "visit_summary"
            referencedColumns: ["residence_id"]
          },
        ]
      }
      bwc_chunks: {
        Row: {
          chunk_index: number
          content: string
          created_at: string | null
          document_id: string
          embedding: string
          fts_en: unknown
          fts_fr: unknown
          id: string
          metadata: Json | null
          token_count: number | null
        }
        Insert: {
          chunk_index: number
          content: string
          created_at?: string | null
          document_id: string
          embedding: string
          fts_en?: unknown
          fts_fr?: unknown
          id?: string
          metadata?: Json | null
          token_count?: number | null
        }
        Update: {
          chunk_index?: number
          content?: string
          created_at?: string | null
          document_id?: string
          embedding?: string
          fts_en?: unknown
          fts_fr?: unknown
          id?: string
          metadata?: Json | null
          token_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "bwc_chunks_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "bwc_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      bwc_client_accounts: {
        Row: {
          created_at: string | null
          default_language: string | null
          id: string
          logo_url: string | null
          metadata: Json | null
          name: string
          primary_color: string | null
          slug: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          default_language?: string | null
          id?: string
          logo_url?: string | null
          metadata?: Json | null
          name: string
          primary_color?: string | null
          slug: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          default_language?: string | null
          id?: string
          logo_url?: string | null
          metadata?: Json | null
          name?: string
          primary_color?: string | null
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      bwc_client_users: {
        Row: {
          client_id: string
          created_at: string | null
          role: string
          user_id: string
        }
        Insert: {
          client_id: string
          created_at?: string | null
          role?: string
          user_id: string
        }
        Update: {
          client_id?: string
          created_at?: string | null
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bwc_client_users_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "bwc_client_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bwc_client_users_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "shared_users_access_view"
            referencedColumns: ["user_id"]
          },
        ]
      }
      bwc_definitions: {
        Row: {
          created_at: string | null
          definition: string
          id: string
          language: string
          source_document: string | null
          tender_id: string
          term: string
        }
        Insert: {
          created_at?: string | null
          definition: string
          id?: string
          language: string
          source_document?: string | null
          tender_id: string
          term: string
        }
        Update: {
          created_at?: string | null
          definition?: string
          id?: string
          language?: string
          source_document?: string | null
          tender_id?: string
          term?: string
        }
        Relationships: []
      }
      bwc_documents: {
        Row: {
          content: string | null
          country: string | null
          created_at: string | null
          document_type: string | null
          id: string
          language: string | null
          metadata: Json | null
          source: string
          tender_id: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          content?: string | null
          country?: string | null
          created_at?: string | null
          document_type?: string | null
          id?: string
          language?: string | null
          metadata?: Json | null
          source: string
          tender_id?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          content?: string | null
          country?: string | null
          created_at?: string | null
          document_type?: string | null
          id?: string
          language?: string | null
          metadata?: Json | null
          source?: string
          tender_id?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      bwc_reports: {
        Row: {
          client_id: string | null
          completed_at: string | null
          created_at: string | null
          created_by: string | null
          download_token: string | null
          file_path: string | null
          file_size_bytes: number | null
          id: string
          language: string
          market: string
          report_type: string
          sections_count: number | null
          status: string
          title: string | null
          token_expires_at: string | null
        }
        Insert: {
          client_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          download_token?: string | null
          file_path?: string | null
          file_size_bytes?: number | null
          id?: string
          language?: string
          market?: string
          report_type?: string
          sections_count?: number | null
          status?: string
          title?: string | null
          token_expires_at?: string | null
        }
        Update: {
          client_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          download_token?: string | null
          file_path?: string | null
          file_size_bytes?: number | null
          id?: string
          language?: string
          market?: string
          report_type?: string
          sections_count?: number | null
          status?: string
          title?: string | null
          token_expires_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bwc_reports_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "bwc_client_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bwc_reports_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "shared_users_access_view"
            referencedColumns: ["user_id"]
          },
        ]
      }
      bwc_strategy_metrics: {
        Row: {
          confidence: string | null
          country: string | null
          created_at: string | null
          document_id: string | null
          energy_source: string | null
          extraction_method: string | null
          id: string
          is_official_target: boolean | null
          metric_category: string
          metric_name: string
          needs_validation: boolean | null
          period: string | null
          scenario: string | null
          sector: string | null
          source_date: string | null
          source_name: string
          source_page: number | null
          source_section: string | null
          source_text: string | null
          source_type: string
          unit: string
          validated_at: string | null
          validated_by: string | null
          value: number
          value_max: number | null
          value_min: number | null
          year: number | null
        }
        Insert: {
          confidence?: string | null
          country?: string | null
          created_at?: string | null
          document_id?: string | null
          energy_source?: string | null
          extraction_method?: string | null
          id?: string
          is_official_target?: boolean | null
          metric_category: string
          metric_name: string
          needs_validation?: boolean | null
          period?: string | null
          scenario?: string | null
          sector?: string | null
          source_date?: string | null
          source_name: string
          source_page?: number | null
          source_section?: string | null
          source_text?: string | null
          source_type: string
          unit: string
          validated_at?: string | null
          validated_by?: string | null
          value: number
          value_max?: number | null
          value_min?: number | null
          year?: number | null
        }
        Update: {
          confidence?: string | null
          country?: string | null
          created_at?: string | null
          document_id?: string | null
          energy_source?: string | null
          extraction_method?: string | null
          id?: string
          is_official_target?: boolean | null
          metric_category?: string
          metric_name?: string
          needs_validation?: boolean | null
          period?: string | null
          scenario?: string | null
          sector?: string | null
          source_date?: string | null
          source_name?: string
          source_page?: number | null
          source_section?: string | null
          source_text?: string | null
          source_type?: string
          unit?: string
          validated_at?: string | null
          validated_by?: string | null
          value?: number
          value_max?: number | null
          value_min?: number | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "bwc_strategy_metrics_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "bwc_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      disorder_catalog: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          disorder_id: string
          id: string
          name: string
          severity_levels: string[] | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          disorder_id: string
          id?: string
          name: string
          severity_levels?: string[] | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          disorder_id?: string
          id?: string
          name?: string
          severity_levels?: string[] | null
        }
        Relationships: []
      }
      disorders: {
        Row: {
          confidence: number | null
          created_at: string | null
          description: string | null
          disorder_catalog_id: string | null
          geometry: unknown
          id: string
          photo_id: string | null
          ref_id: string | null
          severity: string
          status: string | null
          timestamp: string | null
          x_coord: number | null
          x_pixel: number | null
          y_coord: number | null
          y_pixel: number | null
          z_coord: number | null
        }
        Insert: {
          confidence?: number | null
          created_at?: string | null
          description?: string | null
          disorder_catalog_id?: string | null
          geometry?: unknown
          id?: string
          photo_id?: string | null
          ref_id?: string | null
          severity: string
          status?: string | null
          timestamp?: string | null
          x_coord?: number | null
          x_pixel?: number | null
          y_coord?: number | null
          y_pixel?: number | null
          z_coord?: number | null
        }
        Update: {
          confidence?: number | null
          created_at?: string | null
          description?: string | null
          disorder_catalog_id?: string | null
          geometry?: unknown
          id?: string
          photo_id?: string | null
          ref_id?: string | null
          severity?: string
          status?: string | null
          timestamp?: string | null
          x_coord?: number | null
          x_pixel?: number | null
          y_coord?: number | null
          y_pixel?: number | null
          z_coord?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "disorders_disorder_catalog_id_fkey"
            columns: ["disorder_catalog_id"]
            isOneToOne: false
            referencedRelation: "disorder_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disorders_photo_id_fkey"
            columns: ["photo_id"]
            isOneToOne: false
            referencedRelation: "photos"
            referencedColumns: ["id"]
          },
        ]
      }
      drone_positions: {
        Row: {
          created_at: string | null
          fid: number | null
          filename: string
          geometry: unknown
          gimbal_pitch: number | null
          gimbal_roll: number | null
          gimbal_yaw: number | null
          id: string
          relative_altitude: number | null
          visit_id: string | null
          x_coord: number | null
          y_coord: number | null
          z_coord: number | null
        }
        Insert: {
          created_at?: string | null
          fid?: number | null
          filename: string
          geometry?: unknown
          gimbal_pitch?: number | null
          gimbal_roll?: number | null
          gimbal_yaw?: number | null
          id?: string
          relative_altitude?: number | null
          visit_id?: string | null
          x_coord?: number | null
          y_coord?: number | null
          z_coord?: number | null
        }
        Update: {
          created_at?: string | null
          fid?: number | null
          filename?: string
          geometry?: unknown
          gimbal_pitch?: number | null
          gimbal_roll?: number | null
          gimbal_yaw?: number | null
          id?: string
          relative_altitude?: number | null
          visit_id?: string | null
          x_coord?: number | null
          y_coord?: number | null
          z_coord?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "drone_positions_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visit_summary"
            referencedColumns: ["visit_id"]
          },
          {
            foreignKeyName: "drone_positions_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
        ]
      }
      edifice_annotations: {
        Row: {
          confidence: number | null
          created_at: string | null
          disorder_id: string | null
          height: number
          id: string
          photo_description: string | null
          photo_id: string
          roboflow_annotation_id: string | null
          segmentation_polygon: Json | null
          source: string | null
          updated_at: string | null
          validated: boolean | null
          width: number
          x_center: number
          y_center: number
        }
        Insert: {
          confidence?: number | null
          created_at?: string | null
          disorder_id?: string | null
          height: number
          id?: string
          photo_description?: string | null
          photo_id: string
          roboflow_annotation_id?: string | null
          segmentation_polygon?: Json | null
          source?: string | null
          updated_at?: string | null
          validated?: boolean | null
          width: number
          x_center: number
          y_center: number
        }
        Update: {
          confidence?: number | null
          created_at?: string | null
          disorder_id?: string | null
          height?: number
          id?: string
          photo_description?: string | null
          photo_id?: string
          roboflow_annotation_id?: string | null
          segmentation_polygon?: Json | null
          source?: string | null
          updated_at?: string | null
          validated?: boolean | null
          width?: number
          x_center?: number
          y_center?: number
        }
        Relationships: [
          {
            foreignKeyName: "edifice_annotations_disorder_id_fkey"
            columns: ["disorder_id"]
            isOneToOne: false
            referencedRelation: "edifice_disorders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "edifice_annotations_photo_id_fkey"
            columns: ["photo_id"]
            isOneToOne: false
            referencedRelation: "edifice_photos"
            referencedColumns: ["id"]
          },
        ]
      }
      edifice_buildings: {
        Row: {
          address: string | null
          bdnb_id: string | null
          building_2d_map_url: string | null
          building_3d_image_url: string | null
          building_geometry: unknown
          building_type: string | null
          construction_year: number | null
          created_at: string | null
          description: string | null
          floor_count: number | null
          id: string
          ign_data: Json | null
          latitude: number | null
          longitude: number | null
          name: string
          organization_id: string
          rnb_id: string | null
          surface_area: number | null
          updated_at: string | null
          x_lambert93: number | null
          y_lambert93: number | null
        }
        Insert: {
          address?: string | null
          bdnb_id?: string | null
          building_2d_map_url?: string | null
          building_3d_image_url?: string | null
          building_geometry?: unknown
          building_type?: string | null
          construction_year?: number | null
          created_at?: string | null
          description?: string | null
          floor_count?: number | null
          id?: string
          ign_data?: Json | null
          latitude?: number | null
          longitude?: number | null
          name: string
          organization_id: string
          rnb_id?: string | null
          surface_area?: number | null
          updated_at?: string | null
          x_lambert93?: number | null
          y_lambert93?: number | null
        }
        Update: {
          address?: string | null
          bdnb_id?: string | null
          building_2d_map_url?: string | null
          building_3d_image_url?: string | null
          building_geometry?: unknown
          building_type?: string | null
          construction_year?: number | null
          created_at?: string | null
          description?: string | null
          floor_count?: number | null
          id?: string
          ign_data?: Json | null
          latitude?: number | null
          longitude?: number | null
          name?: string
          organization_id?: string
          rnb_id?: string | null
          surface_area?: number | null
          updated_at?: string | null
          x_lambert93?: number | null
          y_lambert93?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "edifice_buildings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "edifice_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      edifice_component_types: {
        Row: {
          category: string | null
          code: string
          created_at: string | null
          display_order: number | null
          id: string
          label_en: string | null
          label_fr: string
          parent_id: string | null
          subtypes: Json | null
          yolo_class_id: number | null
        }
        Insert: {
          category?: string | null
          code: string
          created_at?: string | null
          display_order?: number | null
          id?: string
          label_en?: string | null
          label_fr: string
          parent_id?: string | null
          subtypes?: Json | null
          yolo_class_id?: number | null
        }
        Update: {
          category?: string | null
          code?: string
          created_at?: string | null
          display_order?: number | null
          id?: string
          label_en?: string | null
          label_fr?: string
          parent_id?: string | null
          subtypes?: Json | null
          yolo_class_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "edifice_component_types_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "edifice_component_types"
            referencedColumns: ["id"]
          },
        ]
      }
      edifice_disorder_types: {
        Row: {
          applicable_component_codes: string[] | null
          category: string | null
          code: string
          created_at: string | null
          description: string | null
          display_order: number | null
          id: string
          label_en: string | null
          label_fr: string
          yolo_class_id: number | null
        }
        Insert: {
          applicable_component_codes?: string[] | null
          category?: string | null
          code: string
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          label_en?: string | null
          label_fr: string
          yolo_class_id?: number | null
        }
        Update: {
          applicable_component_codes?: string[] | null
          category?: string | null
          code?: string
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          label_en?: string | null
          label_fr?: string
          yolo_class_id?: number | null
        }
        Relationships: []
      }
      edifice_disorders: {
        Row: {
          cause: string | null
          component_type_id: string | null
          condition_index: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          disorder_type_id: string | null
          display_order: number | null
          id: string
          location: string | null
          name: string
          project_id: string
          recommendations: string | null
          updated_at: string | null
        }
        Insert: {
          cause?: string | null
          component_type_id?: string | null
          condition_index?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          disorder_type_id?: string | null
          display_order?: number | null
          id?: string
          location?: string | null
          name: string
          project_id: string
          recommendations?: string | null
          updated_at?: string | null
        }
        Update: {
          cause?: string | null
          component_type_id?: string | null
          condition_index?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          disorder_type_id?: string | null
          display_order?: number | null
          id?: string
          location?: string | null
          name?: string
          project_id?: string
          recommendations?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "edifice_disorders_component_type_id_fkey"
            columns: ["component_type_id"]
            isOneToOne: false
            referencedRelation: "edifice_component_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "edifice_disorders_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "edifice_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "edifice_disorders_disorder_type_id_fkey"
            columns: ["disorder_type_id"]
            isOneToOne: false
            referencedRelation: "edifice_disorder_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "edifice_disorders_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "edifice_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      edifice_enum_labels: {
        Row: {
          created_at: string | null
          display_order: number | null
          enum_type: string
          enum_value: string
          id: string
          label_en: string | null
          label_fr: string
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          enum_type: string
          enum_value: string
          id?: string
          label_en?: string | null
          label_fr: string
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          enum_type?: string
          enum_value?: string
          id?: string
          label_en?: string | null
          label_fr?: string
        }
        Relationships: []
      }
      edifice_organizations: {
        Row: {
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      edifice_photos: {
        Row: {
          caption: string | null
          category: Database["public"]["Enums"]["edifice_photo_category"] | null
          created_at: string | null
          crop_region: Json | null
          exif_data: Json | null
          file_size: number | null
          height: number
          id: string
          mime_type: string | null
          original_filename: string | null
          project_id: string
          roboflow_image_id: string | null
          roboflow_sync_status: string | null
          rotation: number | null
          storage_path: string
          updated_at: string | null
          uploaded_by: string | null
          width: number
        }
        Insert: {
          caption?: string | null
          category?:
            | Database["public"]["Enums"]["edifice_photo_category"]
            | null
          created_at?: string | null
          crop_region?: Json | null
          exif_data?: Json | null
          file_size?: number | null
          height: number
          id?: string
          mime_type?: string | null
          original_filename?: string | null
          project_id: string
          roboflow_image_id?: string | null
          roboflow_sync_status?: string | null
          rotation?: number | null
          storage_path: string
          updated_at?: string | null
          uploaded_by?: string | null
          width: number
        }
        Update: {
          caption?: string | null
          category?:
            | Database["public"]["Enums"]["edifice_photo_category"]
            | null
          created_at?: string | null
          crop_region?: Json | null
          exif_data?: Json | null
          file_size?: number | null
          height?: number
          id?: string
          mime_type?: string | null
          original_filename?: string | null
          project_id?: string
          roboflow_image_id?: string | null
          roboflow_sync_status?: string | null
          rotation?: number | null
          storage_path?: string
          updated_at?: string | null
          uploaded_by?: string | null
          width?: number
        }
        Relationships: [
          {
            foreignKeyName: "edifice_photos_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "edifice_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "edifice_photos_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "edifice_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      edifice_profiles: {
        Row: {
          created_at: string | null
          email: string
          full_name: string
          id: string
          organization_id: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name: string
          id: string
          organization_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          organization_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "edifice_profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "shared_users_access_view"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "edifice_profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "edifice_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      edifice_project_documents: {
        Row: {
          created_at: string | null
          file_name: string
          file_size: number | null
          file_type: string | null
          id: string
          project_id: string
          storage_path: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string | null
          file_name: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          project_id: string
          storage_path: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string | null
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          project_id?: string
          storage_path?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "edifice_project_documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "edifice_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "edifice_project_documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "edifice_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      edifice_projects: {
        Row: {
          building_id: string | null
          created_at: string | null
          created_by: string | null
          id: string
          mission_context: string | null
          name: string
          organization_id: string
          reference_number: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          building_id?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          mission_context?: string | null
          name: string
          organization_id: string
          reference_number?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          building_id?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          mission_context?: string | null
          name?: string
          organization_id?: string
          reference_number?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "edifice_projects_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "edifice_buildings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "edifice_projects_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "edifice_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "edifice_projects_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "edifice_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      edifice_report_disorders: {
        Row: {
          created_at: string | null
          disorder_id: string
          display_order: number | null
          id: string
          photo_ids: string[] | null
          report_id: string
        }
        Insert: {
          created_at?: string | null
          disorder_id: string
          display_order?: number | null
          id?: string
          photo_ids?: string[] | null
          report_id: string
        }
        Update: {
          created_at?: string | null
          disorder_id?: string
          display_order?: number | null
          id?: string
          photo_ids?: string[] | null
          report_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "edifice_report_disorders_disorder_id_fkey"
            columns: ["disorder_id"]
            isOneToOne: false
            referencedRelation: "edifice_disorders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "edifice_report_disorders_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "edifice_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      edifice_reports: {
        Row: {
          conclusions: string | null
          contexte: string | null
          created_at: string | null
          description_batiment: string | null
          detail_visite: string | null
          docx_file_name: string | null
          docx_filename: string | null
          docx_generated_at: string | null
          docx_storage_path: string | null
          generated_at: string | null
          generated_by: string | null
          id: string
          investigation_methods: string | null
          observations: string | null
          project_id: string
          recommandations: string | null
          report_type: string | null
          status: string | null
          updated_at: string | null
          visit_date: string | null
        }
        Insert: {
          conclusions?: string | null
          contexte?: string | null
          created_at?: string | null
          description_batiment?: string | null
          detail_visite?: string | null
          docx_file_name?: string | null
          docx_filename?: string | null
          docx_generated_at?: string | null
          docx_storage_path?: string | null
          generated_at?: string | null
          generated_by?: string | null
          id?: string
          investigation_methods?: string | null
          observations?: string | null
          project_id: string
          recommandations?: string | null
          report_type?: string | null
          status?: string | null
          updated_at?: string | null
          visit_date?: string | null
        }
        Update: {
          conclusions?: string | null
          contexte?: string | null
          created_at?: string | null
          description_batiment?: string | null
          detail_visite?: string | null
          docx_file_name?: string | null
          docx_filename?: string | null
          docx_generated_at?: string | null
          docx_storage_path?: string | null
          generated_at?: string | null
          generated_by?: string | null
          id?: string
          investigation_methods?: string | null
          observations?: string | null
          project_id?: string
          recommandations?: string | null
          report_type?: string | null
          status?: string | null
          updated_at?: string | null
          visit_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "edifice_reports_generated_by_fkey"
            columns: ["generated_by"]
            isOneToOne: false
            referencedRelation: "edifice_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "edifice_reports_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "edifice_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      facade_vectors: {
        Row: {
          building_name: string
          created_at: string | null
          facade_id: string
          facade_name: string
          geometry: unknown
          id: string
          normal_x: number
          normal_y: number
          normal_z: number | null
          residence_id: string | null
          updated_at: string | null
        }
        Insert: {
          building_name: string
          created_at?: string | null
          facade_id: string
          facade_name: string
          geometry: unknown
          id?: string
          normal_x: number
          normal_y: number
          normal_z?: number | null
          residence_id?: string | null
          updated_at?: string | null
        }
        Update: {
          building_name?: string
          created_at?: string | null
          facade_id?: string
          facade_name?: string
          geometry?: unknown
          id?: string
          normal_x?: number
          normal_y?: number
          normal_z?: number | null
          residence_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "facade_vectors_residence_id_fkey"
            columns: ["residence_id"]
            isOneToOne: false
            referencedRelation: "residences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "facade_vectors_residence_id_fkey"
            columns: ["residence_id"]
            isOneToOne: false
            referencedRelation: "visit_summary"
            referencedColumns: ["residence_id"]
          },
        ]
      }
      facades: {
        Row: {
          building_id: string | null
          building_name: string | null
          center_x: number | null
          center_y: number | null
          center_z: number | null
          created_at: string | null
          facade_id: string
          facade_name: string | null
          fid: number | null
          geometry: unknown
          id: string
          normal_x: number | null
          normal_y: number | null
          normal_z: number | null
        }
        Insert: {
          building_id?: string | null
          building_name?: string | null
          center_x?: number | null
          center_y?: number | null
          center_z?: number | null
          created_at?: string | null
          facade_id: string
          facade_name?: string | null
          fid?: number | null
          geometry: unknown
          id?: string
          normal_x?: number | null
          normal_y?: number | null
          normal_z?: number | null
        }
        Update: {
          building_id?: string | null
          building_name?: string | null
          center_x?: number | null
          center_y?: number | null
          center_z?: number | null
          created_at?: string | null
          facade_id?: string
          facade_name?: string | null
          fid?: number | null
          geometry?: unknown
          id?: string
          normal_x?: number | null
          normal_y?: number | null
          normal_z?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "facades_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "facades_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "visit_summary"
            referencedColumns: ["building_id"]
          },
        ]
      }
      intersections: {
        Row: {
          building_id: string
          created_at: string | null
          distance: number
          facade_id: string
          geometry: unknown
          id: string
          intersection_x: number
          intersection_y: number
          intersection_z: number
          photo_id: string
          surface_type: string | null
        }
        Insert: {
          building_id: string
          created_at?: string | null
          distance: number
          facade_id: string
          geometry?: unknown
          id?: string
          intersection_x: number
          intersection_y: number
          intersection_z: number
          photo_id: string
          surface_type?: string | null
        }
        Update: {
          building_id?: string
          created_at?: string | null
          distance?: number
          facade_id?: string
          geometry?: unknown
          id?: string
          intersection_x?: number
          intersection_y?: number
          intersection_z?: number
          photo_id?: string
          surface_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "intersections_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "intersections_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "visit_summary"
            referencedColumns: ["building_id"]
          },
          {
            foreignKeyName: "intersections_facade_id_fkey"
            columns: ["facade_id"]
            isOneToOne: false
            referencedRelation: "facades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "intersections_facade_id_fkey"
            columns: ["facade_id"]
            isOneToOne: false
            referencedRelation: "visit_summary"
            referencedColumns: ["facade_id"]
          },
          {
            foreignKeyName: "intersections_photo_id_fkey"
            columns: ["photo_id"]
            isOneToOne: false
            referencedRelation: "photos"
            referencedColumns: ["id"]
          },
        ]
      }
      photos: {
        Row: {
          capture_time: string | null
          created_at: string | null
          file_size: number | null
          filename: string
          id: string
          processing_status: string | null
          storage_path: string
          visit_id: string | null
          xmp_metadata: Json | null
        }
        Insert: {
          capture_time?: string | null
          created_at?: string | null
          file_size?: number | null
          filename: string
          id?: string
          processing_status?: string | null
          storage_path: string
          visit_id?: string | null
          xmp_metadata?: Json | null
        }
        Update: {
          capture_time?: string | null
          created_at?: string | null
          file_size?: number | null
          filename?: string
          id?: string
          processing_status?: string | null
          storage_path?: string
          visit_id?: string | null
          xmp_metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "photos_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visit_summary"
            referencedColumns: ["visit_id"]
          },
          {
            foreignKeyName: "photos_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          user_id?: string | null
        }
        Relationships: []
      }
      qgis_projects: {
        Row: {
          content: string | null
          metadata: Json | null
          name: string
        }
        Insert: {
          content?: string | null
          metadata?: Json | null
          name: string
        }
        Update: {
          content?: string | null
          metadata?: Json | null
          name?: string
        }
        Relationships: []
      }
      residences: {
        Row: {
          address: string | null
          commune: string | null
          created_at: string | null
          departement: string | null
          id: string
          name: string
          project_id: string | null
        }
        Insert: {
          address?: string | null
          commune?: string | null
          created_at?: string | null
          departement?: string | null
          id?: string
          name: string
          project_id?: string | null
        }
        Update: {
          address?: string | null
          commune?: string | null
          created_at?: string | null
          departement?: string | null
          id?: string
          name?: string
          project_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "residences_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      shared_app_access: {
        Row: {
          app_id: string
          created_at: string | null
          role: string | null
          user_id: string
        }
        Insert: {
          app_id: string
          created_at?: string | null
          role?: string | null
          user_id: string
        }
        Update: {
          app_id?: string
          created_at?: string | null
          role?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shared_app_access_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "shared_users_access_view"
            referencedColumns: ["user_id"]
          },
        ]
      }
      spatial_ref_sys: {
        Row: {
          auth_name: string | null
          auth_srid: number | null
          proj4text: string | null
          srid: number
          srtext: string | null
        }
        Insert: {
          auth_name?: string | null
          auth_srid?: number | null
          proj4text?: string | null
          srid: number
          srtext?: string | null
        }
        Update: {
          auth_name?: string | null
          auth_srid?: number | null
          proj4text?: string | null
          srid?: number
          srtext?: string | null
        }
        Relationships: []
      }
      visits: {
        Row: {
          created_at: string | null
          id: string
          intersections_computed: boolean | null
          metadata: Json | null
          residence_id: string | null
          status: string | null
          visit_date: string | null
          visit_time: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          intersections_computed?: boolean | null
          metadata?: Json | null
          residence_id?: string | null
          status?: string | null
          visit_date?: string | null
          visit_time?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          intersections_computed?: boolean | null
          metadata?: Json | null
          residence_id?: string | null
          status?: string | null
          visit_date?: string | null
          visit_time?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "visits_residence_id_fkey"
            columns: ["residence_id"]
            isOneToOne: false
            referencedRelation: "residences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visits_residence_id_fkey"
            columns: ["residence_id"]
            isOneToOne: false
            referencedRelation: "visit_summary"
            referencedColumns: ["residence_id"]
          },
        ]
      }
      wcast_commodities: {
        Row: {
          commodity: string
          created_at: string
          currency: string
          price: number
          source: string
          timestamp: string
        }
        Insert: {
          commodity: string
          created_at?: string
          currency?: string
          price: number
          source?: string
          timestamp: string
        }
        Update: {
          commodity?: string
          created_at?: string
          currency?: string
          price?: number
          source?: string
          timestamp?: string
        }
        Relationships: []
      }
      wcast_cross_border_flows: {
        Row: {
          border: string
          created_at: string
          flow_mw: number
          source: string
          timestamp: string
        }
        Insert: {
          border: string
          created_at?: string
          flow_mw: number
          source?: string
          timestamp: string
        }
        Update: {
          border?: string
          created_at?: string
          flow_mw?: number
          source?: string
          timestamp?: string
        }
        Relationships: []
      }
      wcast_forecasts: {
        Row: {
          created_at: string
          delivery_timestamp: string
          generated_at: string
          horizon_days: number
          model_version: string
          price_eur_mwh: number
          quantile: number
        }
        Insert: {
          created_at?: string
          delivery_timestamp: string
          generated_at: string
          horizon_days: number
          model_version?: string
          price_eur_mwh: number
          quantile: number
        }
        Update: {
          created_at?: string
          delivery_timestamp?: string
          generated_at?: string
          horizon_days?: number
          model_version?: string
          price_eur_mwh?: number
          quantile?: number
        }
        Relationships: []
      }
      wcast_generation: {
        Row: {
          actual_mw: number | null
          created_at: string
          forecast_mw: number | null
          production_type: string
          source: string
          timestamp: string
        }
        Insert: {
          actual_mw?: number | null
          created_at?: string
          forecast_mw?: number | null
          production_type: string
          source?: string
          timestamp: string
        }
        Update: {
          actual_mw?: number | null
          created_at?: string
          forecast_mw?: number | null
          production_type?: string
          source?: string
          timestamp?: string
        }
        Relationships: []
      }
      wcast_load: {
        Row: {
          created_at: string
          forecast_mw: number | null
          load_mw: number | null
          source: string
          timestamp: string
        }
        Insert: {
          created_at?: string
          forecast_mw?: number | null
          load_mw?: number | null
          source?: string
          timestamp: string
        }
        Update: {
          created_at?: string
          forecast_mw?: number | null
          load_mw?: number | null
          source?: string
          timestamp?: string
        }
        Relationships: []
      }
      wcast_neighbor_prices: {
        Row: {
          country: string
          created_at: string
          price_eur_mwh: number
          source: string
          timestamp: string
        }
        Insert: {
          country: string
          created_at?: string
          price_eur_mwh: number
          source?: string
          timestamp: string
        }
        Update: {
          country?: string
          created_at?: string
          price_eur_mwh?: number
          source?: string
          timestamp?: string
        }
        Relationships: []
      }
      wcast_nuclear_availability: {
        Row: {
          available_mw: number
          installed_mw: number
          source: string
          timestamp: string
          unavailable_mw: number
        }
        Insert: {
          available_mw: number
          installed_mw: number
          source?: string
          timestamp: string
          unavailable_mw: number
        }
        Update: {
          available_mw?: number
          installed_mw?: number
          source?: string
          timestamp?: string
          unavailable_mw?: number
        }
        Relationships: []
      }
      wcast_spot_prices: {
        Row: {
          created_at: string
          price_eur_mwh: number
          source: string
          timestamp: string
        }
        Insert: {
          created_at?: string
          price_eur_mwh: number
          source?: string
          timestamp: string
        }
        Update: {
          created_at?: string
          price_eur_mwh?: number
          source?: string
          timestamp?: string
        }
        Relationships: []
      }
      wcast_weather: {
        Row: {
          created_at: string
          diffuse_radiation: number | null
          direct_radiation: number | null
          location: string
          shortwave_radiation: number | null
          source: string
          temperature_2m: number | null
          timestamp: string
          wind_direction_100m: number | null
          wind_speed_100m: number | null
        }
        Insert: {
          created_at?: string
          diffuse_radiation?: number | null
          direct_radiation?: number | null
          location: string
          shortwave_radiation?: number | null
          source?: string
          temperature_2m?: number | null
          timestamp: string
          wind_direction_100m?: number | null
          wind_speed_100m?: number | null
        }
        Update: {
          created_at?: string
          diffuse_radiation?: number | null
          direct_radiation?: number | null
          location?: string
          shortwave_radiation?: number | null
          source?: string
          temperature_2m?: number | null
          timestamp?: string
          wind_direction_100m?: number | null
          wind_speed_100m?: number | null
        }
        Relationships: []
      }
      wcast_weather_forecast: {
        Row: {
          created_at: string
          diffuse_radiation: number | null
          direct_radiation: number | null
          location: string
          shortwave_radiation: number | null
          source: string
          temperature_2m: number | null
          timestamp: string
          wind_direction_100m: number | null
          wind_speed_100m: number | null
        }
        Insert: {
          created_at?: string
          diffuse_radiation?: number | null
          direct_radiation?: number | null
          location: string
          shortwave_radiation?: number | null
          source?: string
          temperature_2m?: number | null
          timestamp: string
          wind_direction_100m?: number | null
          wind_speed_100m?: number | null
        }
        Update: {
          created_at?: string
          diffuse_radiation?: number | null
          direct_radiation?: number | null
          location?: string
          shortwave_radiation?: number | null
          source?: string
          temperature_2m?: number | null
          timestamp?: string
          wind_direction_100m?: number | null
          wind_speed_100m?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      disorders_full: {
        Row: {
          building_name: string | null
          description: string | null
          disorder_color: string | null
          disorder_name: string | null
          facade_id: string | null
          facade_name: string | null
          id: string | null
          photo_filename: string | null
          project_name: string | null
          ref_id: string | null
          residence_name: string | null
          severity: string | null
          status: string | null
          storage_path: string | null
          timestamp: string | null
          x_coord: number | null
          x_pixel: number | null
          y_coord: number | null
          y_pixel: number | null
          z_coord: number | null
        }
        Relationships: []
      }
      facade_stats: {
        Row: {
          building_name: string | null
          facade_id: string | null
          facade_name: string | null
          high_severity_disorders: number | null
          low_severity_disorders: number | null
          medium_severity_disorders: number | null
          total_disorders: number | null
          total_photos: number | null
        }
        Relationships: []
      }
      geography_columns: {
        Row: {
          coord_dimension: number | null
          f_geography_column: unknown
          f_table_catalog: unknown
          f_table_name: unknown
          f_table_schema: unknown
          srid: number | null
          type: string | null
        }
        Relationships: []
      }
      geometry_columns: {
        Row: {
          coord_dimension: number | null
          f_geometry_column: unknown
          f_table_catalog: string | null
          f_table_name: unknown
          f_table_schema: unknown
          srid: number | null
          type: string | null
        }
        Insert: {
          coord_dimension?: number | null
          f_geometry_column?: unknown
          f_table_catalog?: string | null
          f_table_name?: unknown
          f_table_schema?: unknown
          srid?: number | null
          type?: string | null
        }
        Update: {
          coord_dimension?: number | null
          f_geometry_column?: unknown
          f_table_catalog?: string | null
          f_table_name?: unknown
          f_table_schema?: unknown
          srid?: number | null
          type?: string | null
        }
        Relationships: []
      }
      shared_users_access_view: {
        Row: {
          apps: string[] | null
          email: string | null
          is_confirmed: boolean | null
          user_created: string | null
          user_id: string | null
        }
        Relationships: []
      }
      visit_summary: {
        Row: {
          avg_distance: number | null
          building_id: string | null
          building_name: string | null
          building_string_id: string | null
          disorder_count: number | null
          facade_display_name: string | null
          facade_id: string | null
          facade_name: string | null
          facade_string_id: string | null
          first_photo_filename: string | null
          last_photo_filename: string | null
          max_distance: number | null
          min_distance: number | null
          photo_count: number | null
          residence_address: string | null
          residence_id: string | null
          residence_name: string | null
          surface_types: string | null
          visit_date: string | null
          visit_display_name: string | null
          visit_id: string | null
          visit_status: string | null
          visit_time: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      _postgis_deprecate: {
        Args: { newname: string; oldname: string; version: string }
        Returns: undefined
      }
      _postgis_index_extent: {
        Args: { col: string; tbl: unknown }
        Returns: unknown
      }
      _postgis_pgsql_version: { Args: never; Returns: string }
      _postgis_scripts_pgsql_version: { Args: never; Returns: string }
      _postgis_selectivity: {
        Args: { att_name: string; geom: unknown; mode?: string; tbl: unknown }
        Returns: number
      }
      _postgis_stats: {
        Args: { ""?: string; att_name: string; tbl: unknown }
        Returns: string
      }
      _st_3dintersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_containsproperly: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_coveredby:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_covers:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_crosses: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_dwithin: {
        Args: {
          geog1: unknown
          geog2: unknown
          tolerance: number
          use_spheroid?: boolean
        }
        Returns: boolean
      }
      _st_equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_intersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_linecrossingdirection: {
        Args: { line1: unknown; line2: unknown }
        Returns: number
      }
      _st_longestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      _st_maxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      _st_orderingequals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_sortablehash: { Args: { geom: unknown }; Returns: number }
      _st_touches: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_voronoi: {
        Args: {
          clip?: unknown
          g1: unknown
          return_polygons?: boolean
          tolerance?: number
        }
        Returns: unknown
      }
      _st_within: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      addauth: { Args: { "": string }; Returns: boolean }
      addgeometrycolumn:
        | {
            Args: {
              catalog_name: string
              column_name: string
              new_dim: number
              new_srid_in: number
              new_type: string
              schema_name: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              column_name: string
              new_dim: number
              new_srid: number
              new_type: string
              schema_name: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              column_name: string
              new_dim: number
              new_srid: number
              new_type: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
      bwc_chunk_counts: {
        Args: { doc_ids: string[] }
        Returns: {
          chunk_count: number
          document_id: string
        }[]
      }
      bwc_compare_metrics_across_sources: {
        Args: { p_metric_name: string; p_scenario?: string; p_year: number }
        Returns: {
          confidence: string
          deviation_from_official: number
          is_official_target: boolean
          source_name: string
          source_type: string
          unit: string
          value: number
        }[]
      }
      bwc_get_strategy_metrics: {
        Args: {
          p_category?: string
          p_energy_source?: string
          p_limit?: number
          p_metric_name?: string
          p_scenario?: string
          p_sector?: string
          p_source_name?: string
          p_year?: number
        }
        Returns: {
          confidence: string
          energy_source: string
          id: string
          is_official_target: boolean
          metric_category: string
          metric_name: string
          period: string
          scenario: string
          sector: string
          source_name: string
          source_text: string
          source_type: string
          unit: string
          value: number
          value_max: number
          value_min: number
          year: number
        }[]
      }
      bwc_hybrid_search: {
        Args: {
          filter_country?: string
          filter_document_type?: string
          filter_tender_id?: string
          fulltext_weight?: number
          language?: string
          match_count?: number
          query_embedding: string
          query_text: string
          rrf_k?: number
          semantic_weight?: number
        }
        Returns: {
          chunk_id: string
          chunk_metadata: Json
          content: string
          document_country: string
          document_id: string
          document_language: string
          document_source: string
          document_tender_id: string
          document_title: string
          document_type: string
          score: number
        }[]
      }
      bwc_semantic_search: {
        Args: { match_count?: number; query_embedding: string }
        Returns: {
          chunk_id: string
          content: string
          document_id: string
          document_source: string
          document_title: string
          similarity: number
        }[]
      }
      disablelongtransactions: { Args: never; Returns: string }
      dropgeometrycolumn:
        | {
            Args: {
              catalog_name: string
              column_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
        | {
            Args: {
              column_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
        | { Args: { column_name: string; table_name: string }; Returns: string }
      dropgeometrytable:
        | {
            Args: {
              catalog_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
        | { Args: { schema_name: string; table_name: string }; Returns: string }
        | { Args: { table_name: string }; Returns: string }
      enablelongtransactions: { Args: never; Returns: string }
      equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      generate_ref_id: {
        Args: { disorder_type: string; facade_id_param: string }
        Returns: string
      }
      geometry: { Args: { "": string }; Returns: unknown }
      geometry_above: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_below: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_cmp: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_contained_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_contains_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_distance_box: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_distance_centroid: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_eq: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_ge: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_gt: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_le: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_left: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_lt: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overabove: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overbelow: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overlaps_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overleft: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overright: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_right: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_same: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_same_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_within: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geomfromewkt: { Args: { "": string }; Returns: unknown }
      get_buildings_with_geometry: {
        Args: { p_residence_uuid: string }
        Returns: {
          building_id: string
          building_name: string
          cleabs: string
          fid: number
          geometry_wkt: string
          hauteur: number
          id: string
          nombre_d_etages: number
          nombre_de_logement: number
          usage_1: string
        }[]
      }
      get_facades_with_geometry: {
        Args: { p_building_uuids: string[] }
        Returns: {
          building_id: string
          building_name: string
          center_x: number
          center_y: number
          center_z: number
          facade_id: string
          facade_name: string
          fid: number
          geometry_wkt: string
          id: string
          normal_x: number
          normal_y: number
          normal_z: number
        }[]
      }
      get_project_stats: {
        Args: { project_id_param: string }
        Returns: {
          last_visit_date: string
          total_disorders: number
          total_photos: number
          total_residences: number
          total_visits: number
        }[]
      }
      gettransactionid: { Args: never; Returns: unknown }
      longtransactionsenabled: { Args: never; Returns: boolean }
      populate_geometry_columns:
        | { Args: { tbl_oid: unknown; use_typmod?: boolean }; Returns: number }
        | { Args: { use_typmod?: boolean }; Returns: string }
      postgis_constraint_dims: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: number
      }
      postgis_constraint_srid: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: number
      }
      postgis_constraint_type: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: string
      }
      postgis_extensions_upgrade: { Args: never; Returns: string }
      postgis_full_version: { Args: never; Returns: string }
      postgis_geos_version: { Args: never; Returns: string }
      postgis_lib_build_date: { Args: never; Returns: string }
      postgis_lib_revision: { Args: never; Returns: string }
      postgis_lib_version: { Args: never; Returns: string }
      postgis_libjson_version: { Args: never; Returns: string }
      postgis_liblwgeom_version: { Args: never; Returns: string }
      postgis_libprotobuf_version: { Args: never; Returns: string }
      postgis_libxml_version: { Args: never; Returns: string }
      postgis_proj_version: { Args: never; Returns: string }
      postgis_scripts_build_date: { Args: never; Returns: string }
      postgis_scripts_installed: { Args: never; Returns: string }
      postgis_scripts_released: { Args: never; Returns: string }
      postgis_svn_version: { Args: never; Returns: string }
      postgis_type_name: {
        Args: {
          coord_dimension: number
          geomname: string
          use_new_name?: boolean
        }
        Returns: string
      }
      postgis_version: { Args: never; Returns: string }
      postgis_wagyu_version: { Args: never; Returns: string }
      shared_check_app_access: {
        Args: { p_app_id: string; p_user_id: string }
        Returns: boolean
      }
      shared_grant_access: {
        Args: { p_app_id: string; p_email: string }
        Returns: string
      }
      shared_grant_all_access: { Args: { p_email: string }; Returns: string }
      shared_revoke_access: {
        Args: { p_app_id: string; p_email: string }
        Returns: string
      }
      st_3dclosestpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3ddistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_3dintersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_3dlongestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3dmakebox: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3dmaxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_3dshortestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_addpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_angle:
        | { Args: { line1: unknown; line2: unknown }; Returns: number }
        | {
            Args: { pt1: unknown; pt2: unknown; pt3: unknown; pt4?: unknown }
            Returns: number
          }
      st_area:
        | { Args: { geog: unknown; use_spheroid?: boolean }; Returns: number }
        | { Args: { "": string }; Returns: number }
      st_asencodedpolyline: {
        Args: { geom: unknown; nprecision?: number }
        Returns: string
      }
      st_asewkt: { Args: { "": string }; Returns: string }
      st_asgeojson:
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | {
            Args: {
              geom_column?: string
              maxdecimaldigits?: number
              pretty_bool?: boolean
              r: Record<string, unknown>
            }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_asgml:
        | {
            Args: {
              geog: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
            }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
        | {
            Args: {
              geog: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
              version: number
            }
            Returns: string
          }
        | {
            Args: {
              geom: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
              version: number
            }
            Returns: string
          }
      st_askml:
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; nprefix?: string }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; nprefix?: string }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_aslatlontext: {
        Args: { geom: unknown; tmpl?: string }
        Returns: string
      }
      st_asmarc21: { Args: { format?: string; geom: unknown }; Returns: string }
      st_asmvtgeom: {
        Args: {
          bounds: unknown
          buffer?: number
          clip_geom?: boolean
          extent?: number
          geom: unknown
        }
        Returns: unknown
      }
      st_assvg:
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; rel?: number }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; rel?: number }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_astext: { Args: { "": string }; Returns: string }
      st_astwkb:
        | {
            Args: {
              geom: unknown
              prec?: number
              prec_m?: number
              prec_z?: number
              with_boxes?: boolean
              with_sizes?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              geom: unknown[]
              ids: number[]
              prec?: number
              prec_m?: number
              prec_z?: number
              with_boxes?: boolean
              with_sizes?: boolean
            }
            Returns: string
          }
      st_asx3d: {
        Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
        Returns: string
      }
      st_azimuth:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: number }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
      st_boundingdiagonal: {
        Args: { fits?: boolean; geom: unknown }
        Returns: unknown
      }
      st_buffer:
        | {
            Args: { geom: unknown; options?: string; radius: number }
            Returns: unknown
          }
        | {
            Args: { geom: unknown; quadsegs: number; radius: number }
            Returns: unknown
          }
      st_centroid: { Args: { "": string }; Returns: unknown }
      st_clipbybox2d: {
        Args: { box: unknown; geom: unknown }
        Returns: unknown
      }
      st_closestpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_collect: { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
      st_concavehull: {
        Args: {
          param_allow_holes?: boolean
          param_geom: unknown
          param_pctconvex: number
        }
        Returns: unknown
      }
      st_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_containsproperly: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_coorddim: { Args: { geometry: unknown }; Returns: number }
      st_coveredby:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_covers:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_crosses: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_curvetoline: {
        Args: { flags?: number; geom: unknown; tol?: number; toltype?: number }
        Returns: unknown
      }
      st_delaunaytriangles: {
        Args: { flags?: number; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_difference: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_disjoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_distance:
        | {
            Args: { geog1: unknown; geog2: unknown; use_spheroid?: boolean }
            Returns: number
          }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
      st_distancesphere:
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
        | {
            Args: { geom1: unknown; geom2: unknown; radius: number }
            Returns: number
          }
      st_distancespheroid: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_dwithin: {
        Args: {
          geog1: unknown
          geog2: unknown
          tolerance: number
          use_spheroid?: boolean
        }
        Returns: boolean
      }
      st_equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_expand:
        | { Args: { box: unknown; dx: number; dy: number }; Returns: unknown }
        | {
            Args: { box: unknown; dx: number; dy: number; dz?: number }
            Returns: unknown
          }
        | {
            Args: {
              dm?: number
              dx: number
              dy: number
              dz?: number
              geom: unknown
            }
            Returns: unknown
          }
      st_force3d: { Args: { geom: unknown; zvalue?: number }; Returns: unknown }
      st_force3dm: {
        Args: { geom: unknown; mvalue?: number }
        Returns: unknown
      }
      st_force3dz: {
        Args: { geom: unknown; zvalue?: number }
        Returns: unknown
      }
      st_force4d: {
        Args: { geom: unknown; mvalue?: number; zvalue?: number }
        Returns: unknown
      }
      st_generatepoints:
        | { Args: { area: unknown; npoints: number }; Returns: unknown }
        | {
            Args: { area: unknown; npoints: number; seed: number }
            Returns: unknown
          }
      st_geogfromtext: { Args: { "": string }; Returns: unknown }
      st_geographyfromtext: { Args: { "": string }; Returns: unknown }
      st_geohash:
        | { Args: { geog: unknown; maxchars?: number }; Returns: string }
        | { Args: { geom: unknown; maxchars?: number }; Returns: string }
      st_geomcollfromtext: { Args: { "": string }; Returns: unknown }
      st_geometricmedian: {
        Args: {
          fail_if_not_converged?: boolean
          g: unknown
          max_iter?: number
          tolerance?: number
        }
        Returns: unknown
      }
      st_geometryfromtext: { Args: { "": string }; Returns: unknown }
      st_geomfromewkt: { Args: { "": string }; Returns: unknown }
      st_geomfromgeojson:
        | { Args: { "": Json }; Returns: unknown }
        | { Args: { "": Json }; Returns: unknown }
        | { Args: { "": string }; Returns: unknown }
      st_geomfromgml: { Args: { "": string }; Returns: unknown }
      st_geomfromkml: { Args: { "": string }; Returns: unknown }
      st_geomfrommarc21: { Args: { marc21xml: string }; Returns: unknown }
      st_geomfromtext: { Args: { "": string }; Returns: unknown }
      st_gmltosql: { Args: { "": string }; Returns: unknown }
      st_hasarc: { Args: { geometry: unknown }; Returns: boolean }
      st_hausdorffdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_hexagon: {
        Args: { cell_i: number; cell_j: number; origin?: unknown; size: number }
        Returns: unknown
      }
      st_hexagongrid: {
        Args: { bounds: unknown; size: number }
        Returns: Record<string, unknown>[]
      }
      st_interpolatepoint: {
        Args: { line: unknown; point: unknown }
        Returns: number
      }
      st_intersection: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_intersects:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_isvaliddetail: {
        Args: { flags?: number; geom: unknown }
        Returns: Database["public"]["CompositeTypes"]["valid_detail"]
        SetofOptions: {
          from: "*"
          to: "valid_detail"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      st_length:
        | { Args: { geog: unknown; use_spheroid?: boolean }; Returns: number }
        | { Args: { "": string }; Returns: number }
      st_letters: { Args: { font?: Json; letters: string }; Returns: unknown }
      st_linecrossingdirection: {
        Args: { line1: unknown; line2: unknown }
        Returns: number
      }
      st_linefromencodedpolyline: {
        Args: { nprecision?: number; txtin: string }
        Returns: unknown
      }
      st_linefromtext: { Args: { "": string }; Returns: unknown }
      st_linelocatepoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_linetocurve: { Args: { geometry: unknown }; Returns: unknown }
      st_locatealong: {
        Args: { geometry: unknown; leftrightoffset?: number; measure: number }
        Returns: unknown
      }
      st_locatebetween: {
        Args: {
          frommeasure: number
          geometry: unknown
          leftrightoffset?: number
          tomeasure: number
        }
        Returns: unknown
      }
      st_locatebetweenelevations: {
        Args: { fromelevation: number; geometry: unknown; toelevation: number }
        Returns: unknown
      }
      st_longestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makebox2d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makeline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makevalid: {
        Args: { geom: unknown; params: string }
        Returns: unknown
      }
      st_maxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_minimumboundingcircle: {
        Args: { inputgeom: unknown; segs_per_quarter?: number }
        Returns: unknown
      }
      st_mlinefromtext: { Args: { "": string }; Returns: unknown }
      st_mpointfromtext: { Args: { "": string }; Returns: unknown }
      st_mpolyfromtext: { Args: { "": string }; Returns: unknown }
      st_multilinestringfromtext: { Args: { "": string }; Returns: unknown }
      st_multipointfromtext: { Args: { "": string }; Returns: unknown }
      st_multipolygonfromtext: { Args: { "": string }; Returns: unknown }
      st_node: { Args: { g: unknown }; Returns: unknown }
      st_normalize: { Args: { geom: unknown }; Returns: unknown }
      st_offsetcurve: {
        Args: { distance: number; line: unknown; params?: string }
        Returns: unknown
      }
      st_orderingequals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_perimeter: {
        Args: { geog: unknown; use_spheroid?: boolean }
        Returns: number
      }
      st_pointfromtext: { Args: { "": string }; Returns: unknown }
      st_pointm: {
        Args: {
          mcoordinate: number
          srid?: number
          xcoordinate: number
          ycoordinate: number
        }
        Returns: unknown
      }
      st_pointz: {
        Args: {
          srid?: number
          xcoordinate: number
          ycoordinate: number
          zcoordinate: number
        }
        Returns: unknown
      }
      st_pointzm: {
        Args: {
          mcoordinate: number
          srid?: number
          xcoordinate: number
          ycoordinate: number
          zcoordinate: number
        }
        Returns: unknown
      }
      st_polyfromtext: { Args: { "": string }; Returns: unknown }
      st_polygonfromtext: { Args: { "": string }; Returns: unknown }
      st_project: {
        Args: { azimuth: number; distance: number; geog: unknown }
        Returns: unknown
      }
      st_quantizecoordinates: {
        Args: {
          g: unknown
          prec_m?: number
          prec_x: number
          prec_y?: number
          prec_z?: number
        }
        Returns: unknown
      }
      st_reduceprecision: {
        Args: { geom: unknown; gridsize: number }
        Returns: unknown
      }
      st_relate: { Args: { geom1: unknown; geom2: unknown }; Returns: string }
      st_removerepeatedpoints: {
        Args: { geom: unknown; tolerance?: number }
        Returns: unknown
      }
      st_segmentize: {
        Args: { geog: unknown; max_segment_length: number }
        Returns: unknown
      }
      st_setsrid:
        | { Args: { geog: unknown; srid: number }; Returns: unknown }
        | { Args: { geom: unknown; srid: number }; Returns: unknown }
      st_sharedpaths: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_shortestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_simplifypolygonhull: {
        Args: { geom: unknown; is_outer?: boolean; vertex_fraction: number }
        Returns: unknown
      }
      st_split: { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
      st_square: {
        Args: { cell_i: number; cell_j: number; origin?: unknown; size: number }
        Returns: unknown
      }
      st_squaregrid: {
        Args: { bounds: unknown; size: number }
        Returns: Record<string, unknown>[]
      }
      st_srid:
        | { Args: { geog: unknown }; Returns: number }
        | { Args: { geom: unknown }; Returns: number }
      st_subdivide: {
        Args: { geom: unknown; gridsize?: number; maxvertices?: number }
        Returns: unknown[]
      }
      st_swapordinates: {
        Args: { geom: unknown; ords: unknown }
        Returns: unknown
      }
      st_symdifference: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_symmetricdifference: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_tileenvelope: {
        Args: {
          bounds?: unknown
          margin?: number
          x: number
          y: number
          zoom: number
        }
        Returns: unknown
      }
      st_touches: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_transform:
        | {
            Args: { from_proj: string; geom: unknown; to_proj: string }
            Returns: unknown
          }
        | {
            Args: { from_proj: string; geom: unknown; to_srid: number }
            Returns: unknown
          }
        | { Args: { geom: unknown; to_proj: string }; Returns: unknown }
      st_triangulatepolygon: { Args: { g1: unknown }; Returns: unknown }
      st_union:
        | { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
        | {
            Args: { geom1: unknown; geom2: unknown; gridsize: number }
            Returns: unknown
          }
      st_voronoilines: {
        Args: { extend_to?: unknown; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_voronoipolygons: {
        Args: { extend_to?: unknown; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_within: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_wkbtosql: { Args: { wkb: string }; Returns: unknown }
      st_wkttosql: { Args: { "": string }; Returns: unknown }
      st_wrapx: {
        Args: { geom: unknown; move: number; wrap: number }
        Returns: unknown
      }
      unlockrows: { Args: { "": string }; Returns: number }
      update_building_geometry_from_geojson: {
        Args: { p_building_id: string; p_geojson: string }
        Returns: undefined
      }
      updategeometrysrid: {
        Args: {
          catalogn_name: string
          column_name: string
          new_srid_in: number
          schema_name: string
          table_name: string
        }
        Returns: string
      }
    }
    Enums: {
      edifice_photo_category:
        | "exterior"
        | "context"
        | "disorder"
        | "plan"
        | "aerial"
    }
    CompositeTypes: {
      geometry_dump: {
        path: number[] | null
        geom: unknown
      }
      valid_detail: {
        valid: boolean | null
        reason: string | null
        location: unknown
      }
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
      edifice_photo_category: [
        "exterior",
        "context",
        "disorder",
        "plan",
        "aerial",
      ],
    },
  },
} as const

