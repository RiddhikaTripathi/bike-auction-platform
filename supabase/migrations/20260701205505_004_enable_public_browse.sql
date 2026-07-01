/*
# Enable Public Browse for Unauthenticated Users

1. Purpose
- Allow anonymous users to browse active auctions
- Required for public marketplace functionality
- Visitors can view listings before signing up

2. Changes
- Add SELECT policy for anon role on bikes table
- Add SELECT policy for anon role on profiles table (for seller info)
*/

-- Allow anonymous users to browse active auctions
DROP POLICY IF EXISTS "bikes_select_all" ON bikes;
CREATE POLICY "bikes_select_all" ON bikes FOR SELECT
  TO anon, authenticated USING (true);

-- Allow anonymous users to view seller profiles
DROP POLICY IF EXISTS "profiles_select_all" ON profiles;
CREATE POLICY "profiles_select_all" ON profiles FOR SELECT
  TO anon, authenticated USING (true);

-- Allow anonymous users to view bids (for bid history)
DROP POLICY IF EXISTS "bids_select_all" ON bids;
CREATE POLICY "bids_select_all" ON bids FOR SELECT
  TO anon, authenticated USING (true);