/*
# Bike Auction Platform - Initial Schema

1. New Tables
- `profiles`: User profiles extending auth.users with display name, avatar, and admin role
- `categories`: Bike categories for classification (Mountain, Road, Hybrid, etc.)
- `bikes`: Auction listings with bike details, pricing, timing, and status
- `bids`: Bid history tracking all bids placed on auctions

2. Security
- Enable RLS on all tables
- Profiles: Users can read all profiles, update only their own
- Categories: Public read access for all users
- Bikes: Users can read all, create/update own listings, admins can manage all
- Bids: Users can read all bids, create own bids, admins can manage all

3. Important Notes
- All user_id columns default to auth.uid() for automatic owner assignment
- Cascade deletes ensure referential integrity
- Timestamps track creation and updates
- Status enums control auction lifecycle
*/

-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL DEFAULT 'Anonymous',
  avatar_url text,
  is_admin boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Bikes/Auctions table
CREATE TABLE IF NOT EXISTS bikes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  brand text NOT NULL,
  model text,
  year integer,
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  image_urls text[] DEFAULT '{}',
  starting_price decimal(10,2) NOT NULL,
  current_price decimal(10,2) NOT NULL,
  buy_now_price decimal(10,2),
  reserve_price decimal(10,2),
  currency text NOT NULL DEFAULT 'USD',
  seller_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  winner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('draft', 'active', 'closed', 'cancelled')),
  start_time timestamptz DEFAULT now(),
  end_time timestamptz NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Bids table
CREATE TABLE IF NOT EXISTS bids (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bike_id uuid NOT NULL REFERENCES bikes(id) ON DELETE CASCADE,
  bidder_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  amount decimal(10,2) NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  is_winning boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Insert default categories
INSERT INTO categories (name, description) VALUES
  ('Mountain Bike', 'Off-road bikes with robust frames and suspension'),
  ('Road Bike', 'Lightweight bikes designed for paved roads'),
  ('Hybrid Bike', 'Versatile bikes combining road and mountain features'),
  ('Electric Bike', 'Bikes with electric motor assistance'),
  ('BMX', 'Bikes designed for stunt riding and racing'),
  ('Cruiser', 'Comfortable bikes for casual riding'),
  ('Folding Bike', 'Compact bikes that fold for easy storage'),
  ('Gravel Bike', 'Versatile bikes for mixed terrain')
ON CONFLICT (name) DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_bikes_seller_id ON bikes(seller_id);
CREATE INDEX IF NOT EXISTS idx_bikes_status ON bikes(status);
CREATE INDEX IF NOT EXISTS idx_bikes_end_time ON bikes(end_time);
CREATE INDEX IF NOT EXISTS idx_bikes_category ON bikes(category_id);
CREATE INDEX IF NOT EXISTS idx_bids_bike_id ON bids(bike_id);
CREATE INDEX IF NOT EXISTS idx_bids_bidder_id ON bids(bidder_id);
CREATE INDEX IF NOT EXISTS idx_bids_amount ON bids(bike_id, amount DESC);

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE bikes ENABLE ROW LEVEL SECURITY;
ALTER TABLE bids ENABLE ROW LEVEL SECURITY;

-- Profiles policies
DROP POLICY IF EXISTS "profiles_select_all" ON profiles;
CREATE POLICY "profiles_select_all" ON profiles FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Categories policies (read-only for all)
DROP POLICY IF EXISTS "categories_select_all" ON categories;
CREATE POLICY "categories_select_all" ON categories FOR SELECT
  TO anon, authenticated USING (true);

-- Bikes policies
DROP POLICY IF EXISTS "bikes_select_all" ON bikes;
CREATE POLICY "bikes_select_all" ON bikes FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "bikes_insert_own" ON bikes;
CREATE POLICY "bikes_insert_own" ON bikes FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = seller_id);

DROP POLICY IF EXISTS "bikes_update_own" ON bikes;
CREATE POLICY "bikes_update_own" ON bikes FOR UPDATE
  TO authenticated USING (auth.uid() = seller_id OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true))
  WITH CHECK (auth.uid() = seller_id OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));

DROP POLICY IF EXISTS "bikes_delete_own" ON bikes;
CREATE POLICY "bikes_delete_own" ON bikes FOR DELETE
  TO authenticated USING (auth.uid() = seller_id OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));

-- Bids policies
DROP POLICY IF EXISTS "bids_select_all" ON bids;
CREATE POLICY "bids_select_all" ON bids FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "bids_insert_own" ON bids;
CREATE POLICY "bids_insert_own" ON bids FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = bidder_id);

DROP POLICY IF EXISTS "bids_delete_admin" ON bids;
CREATE POLICY "bids_delete_admin" ON bids FOR DELETE
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));

-- Function to automatically handle profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_bikes_updated_at ON bikes;
CREATE TRIGGER update_bikes_updated_at
  BEFORE UPDATE ON bikes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();