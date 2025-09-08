#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fullMigration() {
  console.log('Starting full migration to Name table...');
  
  try {
    // Clear existing names
    await prisma.name.deleteMany();
    console.log('Cleared existing Name records');

    // Get all name lists ordered by pageNumber
    const nameLists = await prisma.nameList.findMany({
      orderBy: { pageNumber: 'asc' }
    });

    console.log(`Found ${nameLists.length} name lists to process`);

    let globalImportOrder = 1;
    let totalNamesProcessed = 0;
    const batchSize = 1000; // Process in smaller batches

    for (const nameList of nameLists) {
      console.log(`Processing ${nameList.title}...`);
      
      try {
        // Parse the JSON names
        const namesArray = JSON.parse(nameList.names);
        
        // Create name records in batches
        for (let i = 0; i < namesArray.length; i += batchSize) {
          const batch = namesArray.slice(i, i + batchSize);
          
          const namesToCreate = batch.map((nameEntry) => ({
            name: nameEntry.name,
            importOrder: globalImportOrder++,
            artifactNumber: nameEntry.panelNumber || null,
            blockNumber: nameEntry.blockNumber ? String(nameEntry.blockNumber) : null,
            originalPageId: nameList.id
          }));

          await prisma.name.createMany({
            data: namesToCreate
          });

          totalNamesProcessed += namesToCreate.length;
          
          if (i + batchSize < namesArray.length) {
            console.log(`  - Batch ${Math.floor(i/batchSize) + 1}: ${namesToCreate.length} names (total: ${totalNamesProcessed})`);
          }
        }
        
        console.log(`  ✅ Completed ${nameList.title}: ${namesArray.length} names (total: ${totalNamesProcessed})`);

      } catch (error) {
        console.error(`Error processing ${nameList.title}:`, error.message);
        break; // Stop on first error for debugging
      }
      
      // Progress indicator every 100 pages
      if (nameList.pageNumber % 100 === 0) {
        console.log(`\n📊 Progress: ${nameList.pageNumber}/2089 pages (${totalNamesProcessed} names)\n`);
      }
    }

    // Final verification
    const finalCount = await prisma.name.count();
    console.log(`\n✅ Migration Complete!`);
    console.log(`   Total names created: ${finalCount}`);
    console.log(`   Expected: ~91,897`);
    
    if (finalCount > 90000) {
      console.log('🎉 Migration successful!');
    }

  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fullMigration();