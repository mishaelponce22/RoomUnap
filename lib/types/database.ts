export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type UserRole = 'estudiante' | 'arrendador' | 'super_admin'
export type ListingStatus = 'active' | 'inactive' | 'rented'

export interface Database {
  public: {
    Tables: {
      favorites: {
        Row: {
          id: string
          user_id: string
          listing_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          listing_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          listing_id?: string
          created_at?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          id: string
          email: string
          full_name: string
          phone: string | null
          role: UserRole
          created_at: string
        }
        Insert: {
          id: string
          email: string
          full_name: string
          phone?: string | null
          role?: UserRole
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          phone?: string | null
          role?: UserRole
          created_at?: string
        }
        Relationships: []
      }
      listings: {
        Row: {
          id: string
          owner_id: string
          title: string
          description: string | null
          price: number
          zone: string
          image_url: string | null
          status: ListingStatus
          is_verified: boolean
          is_new: boolean
          features: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          title: string
          description?: string | null
          price: number
          zone: string
          image_url?: string | null
          status?: ListingStatus
          is_verified?: boolean
          is_new?: boolean
          features?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          owner_id?: string
          title?: string
          description?: string | null
          price?: number
          zone?: string
          image_url?: string | null
          status?: ListingStatus
          is_verified?: boolean
          is_new?: boolean
          features?: Json | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "listings_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

export interface User {
  id: string
  email: string
  full_name: string
  phone: string | null
  role: UserRole
  created_at: string
}

export type Listing = Database['public']['Tables']['listings']['Row']

export interface ListingImage {
  id: string
  listing_id: string
  url: string
  position: number
  created_at: string
}

export interface ListingFeatures {
  has_wifi?: boolean
  has_private_bathroom?: boolean
  has_security_cameras?: boolean
  is_shared_bed?: boolean
  has_kitchen?: boolean
  has_washing_machine?: boolean
  image_urls?: string[]
  [key: string]: any
}

export interface Favorite {
  id: string
  user_id: string
  listing_id: string
  created_at: string
}

// Tipo combinado útil para el grid del Home
export interface ListingWithDetails extends Listing {
  images: ListingImage[]
  features: ListingFeatures | null
  owner: Pick<User, 'full_name' | 'phone'>
}
