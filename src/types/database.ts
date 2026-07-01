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
          display_name: string;
          avatar_url: string | null;
          is_admin: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string;
          avatar_url?: string | null;
          is_admin?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          display_name?: string;
          avatar_url?: string | null;
          is_admin?: boolean;
          updated_at?: string;
        };
      };
      categories: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          created_at?: string;
        };
        Update: {
          name?: string;
          description?: string | null;
        };
      };
      bikes: {
        Row: {
          id: string;
          title: string;
          description: string;
          brand: string;
          model: string | null;
          year: number | null;
          category_id: string | null;
          image_urls: string[];
          starting_price: number;
          current_price: number;
          buy_now_price: number | null;
          reserve_price: number | null;
          currency: string;
          seller_id: string;
          winner_id: string | null;
          status: 'draft' | 'active' | 'closed' | 'cancelled';
          start_time: string;
          end_time: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description: string;
          brand: string;
          model?: string | null;
          year?: number | null;
          category_id?: string | null;
          image_urls?: string[];
          starting_price: number;
          current_price?: number;
          buy_now_price?: number | null;
          reserve_price?: number | null;
          currency?: string;
          seller_id?: string;
          winner_id?: string | null;
          status?: 'draft' | 'active' | 'closed' | 'cancelled';
          start_time?: string;
          end_time: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          description?: string;
          brand?: string;
          model?: string | null;
          year?: number | null;
          category_id?: string | null;
          image_urls?: string[];
          starting_price?: number;
          current_price?: number;
          buy_now_price?: number | null;
          reserve_price?: number | null;
          currency?: string;
          winner_id?: string | null;
          status?: 'draft' | 'active' | 'closed' | 'cancelled';
          start_time?: string;
          end_time?: string;
          updated_at?: string;
        };
      };
      bids: {
        Row: {
          id: string;
          bike_id: string;
          bidder_id: string;
          amount: number;
          currency: string;
          is_winning: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          bike_id: string;
          bidder_id?: string;
          amount: number;
          currency?: string;
          is_winning?: boolean;
          created_at?: string;
        };
        Update: {
          amount?: number;
          is_winning?: boolean;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Category = Database['public']['Tables']['categories']['Row'];
export type Bike = Database['public']['Tables']['bikes']['Row'];
export type Bid = Database['public']['Tables']['bids']['Row'];

export type BikeWithDetails = Bike & {
  category: Category | null;
  seller: Pick<Profile, 'id' | 'display_name' | 'avatar_url'>;
  winner: Pick<Profile, 'id' | 'display_name' | 'avatar_url'> | null;
};

export type BidWithDetails = Bid & {
  profiles: Pick<Profile, 'id' | 'display_name' | 'avatar_url'>;
};
