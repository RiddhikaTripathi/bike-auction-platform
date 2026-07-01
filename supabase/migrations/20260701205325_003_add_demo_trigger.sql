/*
# Add Demo Data Trigger for New Users

1. Purpose
- Automatically create demo bike auctions when a user signs up
- Only runs for the first user (demo seeding)
- Provides immediate content for testing

2. Security
- Trigger runs as SECURITY DEFINER with appropriate permissions
*/

-- Create function to seed demo data
CREATE OR REPLACE FUNCTION public.seed_demo_auctions()
RETURNS trigger AS $$
BEGIN
  -- Only seed if this is the first profile and no bikes exist
  IF (SELECT COUNT(*) FROM public.bikes) = 0 THEN
    INSERT INTO public.bikes (
      title, description, brand, model, year, category_id,
      image_urls, starting_price, current_price, buy_now_price,
      seller_id, status, end_time
    ) VALUES
      (
        'Specialized Stumpjumper Pro 2023',
        'Excellent condition mountain bike with full suspension. Recently serviced with new brakes and tires. Perfect for trails and downhill riding. Features include SRAM GX Eagle drivetrain, Fox Rhythm suspension, and tubeless-ready wheels.',
        'Specialized',
        'Stumpjumper Pro',
        2023,
        (SELECT id FROM public.categories WHERE name = 'Mountain Bike' LIMIT 1),
        ARRAY['https://images.pexels.com/photos/100582/pexels-photo-100582.jpeg?auto=compress&cs=tinysrgb&w=800'],
        1200.00,
        1200.00,
        2500.00,
        NEW.id,
        'active',
        NOW() + INTERVAL '7 days'
      ),
      (
        'Trek Domane SL6 Road Bike',
        'Lightweight carbon fiber road bike with Shimano Ultegra groupset. Perfect for century rides and competitive racing. Only 500 miles on the clock. Includes Bontrager Paradigm wheels and full Ultegra R8100 12-speed groupset.',
        'Trek',
        'Domane SL6',
        2022,
        (SELECT id FROM public.categories WHERE name = 'Road Bike' LIMIT 1),
        ARRAY['https://images.pexels.com/photos/273434/pexels-photo-273434.jpeg?auto=compress&cs=tinysrgb&w=800'],
        2000.00,
        2750.00,
        4000.00,
        NEW.id,
        'active',
        NOW() + INTERVAL '5 days'
      ),
      (
        'Giant Escape 3 Hybrid Commuter',
        'Reliable hybrid bike perfect for city commuting. Features rack mounts, fenders, hydraulic disc brakes, and a comfortable upright riding position. Great for daily commuting.',
        'Giant',
        'Escape 3',
        2023,
        (SELECT id FROM public.categories WHERE name = 'Hybrid Bike' LIMIT 1),
        ARRAY['https://images.pexels.com/photos/114960/pexels-photo-114960.jpeg?auto=compress&cs=tinysrgb&w=800'],
        350.00,
        350.00,
        600.00,
        NEW.id,
        'active',
        NOW() + INTERVAL '10 days'
      ),
      (
        'Rad Power RadCity Electric Bike',
        'Powerful e-bike with 500W motor and removable battery. Perfect for long commutes with pedal assist up to 28mph. Includes integrated lights, rear rack, and fenders.',
        'Rad Power',
        'RadCity',
        2023,
        (SELECT id FROM public.categories WHERE name = 'Electric Bike' LIMIT 1),
        ARRAY['https://images.pexels.com/photos/1825655/pexels-photo-1825655.jpeg?auto=compress&cs=tinysrgb&w=800'],
        800.00,
        1100.00,
        1800.00,
        NEW.id,
        'active',
        NOW() + INTERVAL '3 days'
      ),
      (
        'Mongoose BMX Freestyle Bike',
        'Perfect for skate parks and street riding. 20-inch wheels, gyro brakes, and reinforced chromoly frame. Great for beginners and intermediate riders.',
        'Mongoose',
        'Freestyle BMX',
        2022,
        (SELECT id FROM public.categories WHERE name = 'BMX' LIMIT 1),
        ARRAY['https://images.pexels.com/photos/273434/pexels-photo-273434.jpeg?auto=compress&cs=tinysrgb&w=800'],
        200.00,
        200.00,
        350.00,
        NEW.id,
        'active',
        NOW() + INTERVAL '14 days'
      ),
      (
        'Vintage Schwinn Cruiser 1985',
        'Beautifully restored vintage cruiser bike. Original chrome fenders, leather seat, and classic styling. A true collector''s piece in excellent condition.',
        'Schwinn',
        'Cruiser Deluxe',
        1985,
        (SELECT id FROM public.categories WHERE name = 'Cruiser' LIMIT 1),
        ARRAY['https://images.pexels.com/photos/100582/pexels-photo-100582.jpeg?auto=compress&cs=tinysrgb&w=800'],
        400.00,
        650.00,
        1000.00,
        NEW.id,
        'active',
        NOW() + INTERVAL '7 days'
      );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger - drops the old one first
DROP TRIGGER IF EXISTS seed_demo_on_signup ON profiles;
CREATE TRIGGER seed_demo_on_signup
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.seed_demo_auctions();