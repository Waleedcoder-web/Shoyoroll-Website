const { Client, Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '1234',
};

const targetDbName = process.env.DB_NAME || 'blueneedle_db';

const initSql = `
-- Admin users table
CREATE TABLE IF NOT EXISTS admin_users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'admin',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  sku VARCHAR(100) UNIQUE,
  description TEXT,
  intro TEXT,
  materials TEXT,
  gsm INTEGER,
  weave VARCHAR(100),
  colors JSONB DEFAULT '[]'::jsonb,
  sizes JSONB DEFAULT '[]'::jsonb,
  moq INTEGER DEFAULT 50,
  image_url VARCHAR(500),
  images JSONB DEFAULT '[]'::jsonb,
  preview_url VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Alter table in case products already existed
ALTER TABLE products ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb;

-- Uploads table (Storing file metadata and URLs)
CREATE TABLE IF NOT EXISTS uploads (
  id SERIAL PRIMARY KEY,
  filename VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  mimetype VARCHAR(100) NOT NULL,
  size INTEGER NOT NULL,
  url VARCHAR(500) NOT NULL,
  product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Inquiries table (Quote requests and contact submissions)
CREATE TABLE IF NOT EXISTS inquiries (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  company VARCHAR(255),
  country VARCHAR(100),
  product_interest VARCHAR(255),
  quantity INTEGER,
  message TEXT,
  status VARCHAR(50) DEFAULT 'new',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert core products if table is empty
INSERT INTO products (name, category, sku, description, intro, materials, gsm, weave, colors, sizes, moq, image_url, preview_url, is_active)
VALUES
  ('BJJ Gi', 'BJJ Gis', 'BN-GI-001', 'Traditional BJJ uniforms manufactured for training and competition requirements.', 'Pearl weave and gold weave BJJ uniforms built to your specification.', E'Pearl weave cotton 350-550 GSM\nGold weave cotton\nRipstop pants\nEVA foam collar', 450, 'Pearl Weave', '["White", "Blue", "Black"]'::jsonb, '["A1", "A2", "A3", "A4"]'::jsonb, 50, '../assets/product-gi.jpg', '../products/bjj-gi.html', true),
  ('BJJ Belts', 'Belts', 'BN-BELT-001', 'Durable BJJ belts available in different ranks, sizes, colors, and custom branding options.', 'Rank belts built with firm multi-row stitching and a clean rank bar, produced in full colour ranges with your own labelling.', E'Cotton twill belt body\nMulti-layer inner core\nCotton or leather rank bar patch', null, 'Twill Weave', '["White", "Blue", "Purple", "Brown", "Black"]'::jsonb, '["A1", "A2", "A3", "A4", "A5"]'::jsonb, 50, '../assets/product-belts.jpg', '../products/bjj-belts.html', true),
  ('No-Gi Apparel', 'No-Gi', 'BN-NOGI-001', 'Performance-focused apparel for modern grappling and No-Gi training.', 'Training tees, spats and layering pieces made from performance knits, cut and finished for grappling movement.', E'Polyester-spandex performance knit\nCotton-poly blends\nMoisture-managing jersey', 240, 'Knit', '["Black", "Navy", "Charcoal"]'::jsonb, '["S", "M", "L", "XL", "2XL"]'::jsonb, 50, '../assets/product-nogi.jpg', '../products/no-gi-apparel.html', true),
  ('Rash Guards', 'Compression', 'BN-RASH-001', 'Custom-designed compression rash guards with professional printing and branding.', 'Full sublimation compression rash guards with flatlock or overlock seams and artwork printed edge to edge.', E'Polyester-spandex 220-280 GSM\nRecycled poly options\nSilicone gripper hem', 260, 'Compression Knit', '["Custom Artwork", "Black", "White"]'::jsonb, '["XS", "S", "M", "L", "XL", "2XL", "3XL"]'::jsonb, 50, '../assets/product-rashguard.jpg', '../products/rash-guards.html', true),
  ('Grappling Shorts', 'Shorts', 'BN-SHORTS-001', 'Durable and flexible shorts designed for grappling and No-Gi training.', 'Fight and grappling shorts with reinforced stress points, split or slit legs, and a secure drawcord or hook closure.', E'4-way stretch polyester\nMicro polyester twill\nStretch mesh panels', 180, '4-Way Stretch', '["Black", "Navy", "Camo", "Custom"]'::jsonb, '["28", "30", "32", "34", "36", "38"]'::jsonb, 50, '../assets/product-shorts.jpg', '../products/grappling-shorts.html', true),
  ('Kids & Custom Gi', 'BJJ Gis', 'BN-KIDS-001', 'Tailored sizing for youth athletes and full-custom academy batches.', 'Lightweight durable Gis with elastic waistbands for youth athletes and custom academy patch packages.', E'Cotton pearl weave 350 GSM\nElastic waist twill pants\nReinforced knees', 350, 'Pearl Weave', '["White", "Blue", "Black", "Pink"]'::jsonb, '["M00", "M0", "M1", "M2", "M3", "M4"]'::jsonb, 30, '../assets/product-gi.jpg', '../products/custom-bjj-gear.html', true)
ON CONFLICT (sku) DO NOTHING;

-- Seed initial inquiries if empty
INSERT INTO inquiries (name, email, phone, company, country, product_interest, quantity, message, status)
VALUES
  ('Marcus Leite', 'marcus@atlasgrappling.example', '+55 11 9xxx xxxx', 'Atlas Grappling Co.', 'Brazil', 'BJJ Gi', 600, 'Looking for 550 GSM pearl weave in navy and white, our own collar taping and woven labels.', 'new'),
  ('Sofia Novak', 'sofia@northline.example', '+420 7xx xxx xxx', 'Northline Distribution', 'Czech Republic', 'Rash Guards', 1200, 'Full sublimation, four artworks, mixed size run XS-3XL. Need sample within three weeks.', 'in-review'),
  ('David Hayes', 'david@apexcombat.example', '+1 415 xxx xxxx', 'Apex Combat Sports', 'United States', 'Grappling Shorts', 400, '4-way stretch grappling shorts with internal drawcord and silicone waistband.', 'quoted')
ON CONFLICT DO NOTHING;
`;

async function initializeDatabase() {
  console.log('----------------------------------------------------');
  console.log(`🔍 Checking if database "${targetDbName}" exists...`);
  console.log('----------------------------------------------------');

  const rootClient = new Client({
    ...dbConfig,
    database: 'postgres',
  });

  try {
    await rootClient.connect();
    const checkDbRes = await rootClient.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [targetDbName]
    );

    if (checkDbRes.rowCount === 0) {
      console.log(`📦 Database "${targetDbName}" does not exist. Creating it now...`);
      await rootClient.query(`CREATE DATABASE "${targetDbName}"`);
      console.log(`✅ Database "${targetDbName}" created successfully!`);
    } else {
      console.log(`✅ Database "${targetDbName}" already exists.`);
    }
  } catch (err) {
    console.error(`❌ Failed connecting to PostgreSQL:`, err.message);
    process.exit(1);
  } finally {
    await rootClient.end();
  }

  console.log(`\n📄 Syncing tables and seeds in "${targetDbName}"...`);
  const appPool = new Pool({
    ...dbConfig,
    database: targetDbName,
  });

  try {
    await appPool.query(initSql);

    // Seed or update admin user Waleed with encrypted password '8956'
    const passwordHash = await bcrypt.hash('8956', 10);
    await appPool.query(
      `INSERT INTO admin_users (username, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (username) 
       DO UPDATE SET password_hash = EXCLUDED.password_hash`,
      ['Waleed', 'waleed@blueneedle.com', passwordHash, 'admin']
    );

    console.log('✅ Admin user "Waleed" verified in PostgreSQL.');
    console.log('✅ Tables "admin_users", "products", "uploads", and "inquiries" ready!');
    console.log('----------------------------------------------------');
    console.log('🎉 Database initialization complete!');
    console.log('----------------------------------------------------');
  } catch (err) {
    console.error('❌ Error executing table schema:', err.message);
    process.exit(1);
  } finally {
    await appPool.end();
  }
}

if (require.main === module) {
  initializeDatabase();
}

module.exports = { initializeDatabase };
