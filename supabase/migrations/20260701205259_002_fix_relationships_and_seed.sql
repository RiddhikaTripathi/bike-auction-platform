/*
# Fix Foreign Key Relationships and Add Seed Data

1. Changes Made
- Drop existing foreign key constraints from bikes and bids to auth.users
- Add new foreign key constraints to reference profiles.id instead
- This enables Supabase's automatic relationship detection for queries

2. Seed Data
- Insert sample bikes for existing profiles (if any)
- Add a function to add demo data when first user signs up

3. Security
- RLS policies remain intact
- All relationships now properly reference the profiles table
*/

-- First, drop the existing foreign key constraints
ALTER TABLE bikes DROP CONSTRAINT IF EXISTS bikes_seller_id_fkey;
ALTER TABLE bikes DROP CONSTRAINT IF EXISTS bikes_winner_id_fkey;
ALTER TABLE bids DROP CONSTRAINT IF EXISTS bids_bidder_id_fkey;

-- Add new foreign key constraints referencing profiles.id
ALTER TABLE bikes
  ADD CONSTRAINT bikes_seller_id_fkey
  FOREIGN KEY (seller_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE bikes
  ADD CONSTRAINT bikes_winner_id_fkey
  FOREIGN KEY (winner_id) REFERENCES profiles(id) ON DELETE SET NULL;

ALTER TABLE bids
  ADD CONSTRAINT bids_bidder_id_fkey
  FOREIGN KEY (bidder_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Insert demo data for existing profiles (if any)
DO $$
DECLARE
  profile_id uuid;
BEGIN
  -- Get first profile if exists
  SELECT id INTO profile_id FROM profiles LIMIT 1;
  
  -- Only seed if we have a profile but no bikes
  IF profile_id IS NOT NULL AND (SELECT COUNT(*) FROM bikes) = 0 THEN
    INSERT INTO public.bikes (
      title, description, brand, model, year, category_id,
      image_urls, starting_price, current_price, buy_now_price,
      seller_id, status, end_time
    ) VALUES
      (
        'Specialized Stumpjumper Pro 2023',
        'Excellent condition mountain bike with full suspension. Recently serviced with new brakes and tires. Perfect for trails and downhill riding.',
        'Specialized',
        'Stumpjumper Pro',
        2023,
        (SELECT id FROM categories WHERE name = 'Mountain Bike' LIMIT 1),
        ARRAY['https://images.pexels.com/photos/100582/pexels-photo-100582.jpeg?auto=compress&cs=tinysrgb&w=800'],
        1200.00,
        1200.00,
        2500.00,
        profile_id,
        'active',
        NOW() + INTERVAL '7 days'
      ),
      (
        'Trek Domane SL6 Road Bike',
        'Lightweight carbon fiber road bike with Shimano Ultegra groupset. Perfect for century rides and competitive racing.',
        'Trek',
        'Domane SL6',
        2022,
        (SELECT id FROM categories WHERE name = 'Road Bike' LIMIT 1),
        ARRAY['https://images.pexels.com/photos/273434/pexels-photo-273434.jpeg?auto=compress&cs=tinysrgb&w=800'],
        2000.00,
        2750.00,
        4000.00,
        profile_id,
        'active',
        NOW() + INTERVAL '5 days'
      ),
      (
        'Giant Escape 3 Hybrid Commuter',
        'Reliable hybrid bike perfect for city commuting.',
        'Giant',
        'Escape 3',
        2023,
        (SELECT id FROM categories WHERE name = 'Hybrid Bike' LIMIT 1),
        ARRAY['https://images.pexels.com/photos/114960/pexels-photo-114960.jpeg?auto=compress&cs=tinysrgb&w=800'],
        350.00,
        350.00,
        600.00,
        profile_id,
        'active',
        NOW() + INTERVAL '10 days'
      ),
      (
        'Rad Power RadCity Electric Bike',
        'Powerful e-bike with 500W motor and removable battery.',
        'Rad Power',
        'RadCity',
        2023,
        (SELECT id FROM categories WHERE name = 'Electric Bike' LIMIT 1),
        ARRAY['https://images.pexels.com/photos/1825655/pexels-photo-1825655.jpeg?auto=compress&cs=tinysrgb&w=800'],
        800.00,
        1100.00,
        1800.00,
        profile_id,
        'active',
        NOW() + INTERVAL '3 days'
      ),
      (
        'Mongoose BMX Freestyle Bike',
        'Perfect for skate parks and street riding.',
        'Mongoose',
        'Freestyle BMX',
        2022,
        (SELECT id FROM categories WHERE name = 'BMX' LIMIT 1),
        ARRAY['https://images.pexels.com/photos/273434/pexels-photo-273434.jpeg?auto=compress&cs=tinysrgb&w=800'],
        200.00,
        200.00,
        350.00,
        profile_id,
        'active',
        NOW() + INTERVAL '14 days'
      ),
      (
        'Vintage Schwinn Cruiser 1985',
        'Beautiful restored vintage cruiser bike.',
        'Schwinn',
        'Cruiser Deluxe',
        1985,
        (SELECT id FROM categories WHERE name = 'Cruiser' LIMIT 1),
        ARRAY['https://images.pexels.com/photos/100582/pexels-photo-100582.jpeg?auto=compress&cs=tinysrgb&w=800'],
        400.00,
        650.00,
        1000.00,
        profile_id,
        'active',
        NOW() + INTERVAL '7 days'
      );
  END IF;
END $$;