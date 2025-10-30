/*
  # Create Products Table

  1. New Tables
    - `products`
      - `id` (uuid, primary key)
      - `seller_id` (uuid, references profiles, not null)
      - `name` (text, not null)
      - `description` (text)
      - `price` (numeric, not null)
      - `category` (text, not null)
      - `stock_quantity` (integer, not null, default 0)
      - `image_url` (text)
      - `is_active` (boolean, default true)
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())

  2. Security
    - Enable RLS on `products` table
    - Add policy for everyone to view active products
    - Add policy for sellers (retailers/wholesalers) to create their own products
    - Add policy for sellers to update their own products
    - Add policy for sellers to delete their own products

  3. Notes
    - Only retailers and wholesalers can create products
    - Products are publicly viewable when active
*/

CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  price numeric(10, 2) NOT NULL CHECK (price >= 0),
  category text NOT NULL,
  stock_quantity integer NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  image_url text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active products"
  ON products
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Sellers can create products"
  ON products
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = seller_id AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('retailer', 'wholesaler')
    )
  );

CREATE POLICY "Sellers can update own products"
  ON products
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = seller_id)
  WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Sellers can delete own products"
  ON products
  FOR DELETE
  TO authenticated
  USING (auth.uid() = seller_id);
