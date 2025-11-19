import { supabase } from '../src/config/supabase';

const createPharmacyTable = async () => {
  console.log('Creating pharmacy table...');

  const { error } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS pharmacy (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        pharmacy_name VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_pharmacy_email ON pharmacy(email);
    `,
  });

  if (error) {
    console.error('Error creating table:', error);
    console.log('\nPlease run this SQL manually in your Supabase SQL editor:');
    console.log(`
      CREATE TABLE IF NOT EXISTS pharmacy (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        pharmacy_name VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_pharmacy_email ON pharmacy(email);
    `);
    process.exit(1);
  }

  console.log('Pharmacy table created successfully!');
};

createPharmacyTable()
  .then(() => {
    console.log('Migration completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });

