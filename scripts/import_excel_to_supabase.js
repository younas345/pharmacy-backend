const XLSX = require('xlsx');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// File paths
const productFile = path.join(__dirname, '../files/product.xls');
const packageFile = path.join(__dirname, '../files/package.xls');

// Helper function to truncate string to max length
function truncate(str, maxLength) {
  if (!str) return null;
  const s = String(str);
  return s.length > maxLength ? s.substring(0, maxLength) : s;
}

// Helper function to transform product row
function transformProductRow(row) {
  return {
    product_ndc: truncate(row.PRODUCTNDC, 20) || null,
    product_type_name: truncate(row.PRODUCTTYPENAME, 100) || null,
    proprietary_name: truncate(row.PROPRIETARYNAME, 255) || null,
  };
}

// Helper function to transform package row
function transformPackageRow(row) {
  return {
    product_ndc: truncate(row.PRODUCTNDC, 20) || null,
    ndc_package_code: truncate(row.NDCPACKAGECODE, 20) || null,
    package_description: row.PACKAGEDESCRIPTION || null,
  };
}

// Insert data in batches
async function insertBatch(tableName, data, batchSize = 1000) {
  const totalBatches = Math.ceil(data.length / batchSize);
  let successCount = 0;
  let errorCount = 0;

  console.log(`\n📦 Inserting ${data.length} records into ${tableName} in ${totalBatches} batches...`);

  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize);
    const batchNumber = Math.floor(i / batchSize) + 1;

    try {
      const { error } = await supabase
        .from(tableName)
        .insert(batch);

      if (error) {
        console.error(`❌ Batch ${batchNumber}/${totalBatches} failed:`, error.message);
        errorCount += batch.length;
      } else {
        successCount += batch.length;
        const progress = ((batchNumber / totalBatches) * 100).toFixed(1);
        process.stdout.write(`\r✅ Progress: ${batchNumber}/${totalBatches} batches (${progress}%) - ${successCount} records inserted`);
      }
    } catch (err) {
      console.error(`\n❌ Batch ${batchNumber}/${totalBatches} error:`, err.message);
      errorCount += batch.length;
    }

    // Small delay to avoid overwhelming the database
    if (i + batchSize < data.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  console.log(`\n\n📊 ${tableName} Import Summary:`);
  console.log(`   ✅ Success: ${successCount} records`);
  console.log(`   ❌ Errors: ${errorCount} records`);
  
  return { successCount, errorCount };
}

// Main import function
async function importData() {
  console.log('🚀 Starting Excel to Supabase Import...\n');
  console.log('📖 Reading Excel files...');

  // Read product.xls
  console.log('   Reading product.xls...');
  const productWorkbook = XLSX.readFile(productFile);
  const productSheetName = productWorkbook.SheetNames[0];
  const productData = XLSX.utils.sheet_to_json(productWorkbook.Sheets[productSheetName]);
  console.log(`   ✅ Found ${productData.length} product records`);

  // Read package.xls
  console.log('   Reading package.xls...');
  const packageWorkbook = XLSX.readFile(packageFile);
  const packageSheetName = packageWorkbook.SheetNames[0];
  const packageData = XLSX.utils.sheet_to_json(packageWorkbook.Sheets[packageSheetName]);
  console.log(`   ✅ Found ${packageData.length} package records`);

  // Transform data
  console.log('\n🔄 Transforming data...');
  const transformedProducts = productData.map(transformProductRow);
  const transformedPackages = packageData.map(transformPackageRow);
  console.log('   ✅ Data transformation complete');

  // Ask for confirmation
  console.log('\n⚠️  Ready to import:');
  console.log(`   - ${transformedProducts.length} products → ndc_products table`);
  console.log(`   - ${transformedPackages.length} packages → ndc_packages table`);
  console.log('\n💡 This will insert data directly into Supabase. Make sure tables are created first!');
  console.log('   Press Ctrl+C to cancel, or wait 5 seconds to continue...\n');

  await new Promise(resolve => setTimeout(resolve, 5000));

  // Import products
  const productResults = await insertBatch('ndc_products', transformedProducts);

  // Import packages
  const packageResults = await insertBatch('ndc_packages', transformedPackages);

  // Final summary
  console.log('\n' + '='.repeat(60));
  console.log('📈 FINAL IMPORT SUMMARY');
  console.log('='.repeat(60));
  console.log(`Products:  ${productResults.successCount} inserted, ${productResults.errorCount} errors`);
  console.log(`Packages:  ${packageResults.successCount} inserted, ${packageResults.errorCount} errors`);
  console.log(`Total:     ${productResults.successCount + packageResults.successCount} records inserted`);
  console.log('='.repeat(60));
  console.log('\n✅ Import complete!');
}

// Run the import
importData().catch((error) => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});

