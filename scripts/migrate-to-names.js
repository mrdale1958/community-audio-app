#!/usr/bin/env node

// Migration script to populate Name table from existing NameList data
// This extracts all 91,897 names from the JSON arrays and creates individual Name records

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function migrateToNames() {
  console.log('Starting migration from NameList to Name table...');
  
  try {
    // Get all existing name lists ordered by pageNumber
    const nameLists = await prisma.nameList.findMany({
      orderBy: { pageNumber: 'asc' },
      select: {
        id: true,
        pageNumber: true,
        names: true,
        title: true
      }
    });

    console.log(`Found ${nameLists.length} name lists to process`);

    let totalNamesProcessed = 0;
    let importOrder = 1;

    // Process each name list
    for (const nameList of nameLists) {
      console.log(`Processing ${nameList.title} (${nameList.names.length} names)...`);
      
      try {
        // Parse the JSON names array
        let namesArray;
        if (typeof nameList.names === 'string') {
          namesArray = JSON.parse(nameList.names);
        } else {
          namesArray = nameList.names;
        }

        // Handle both legacy string arrays and new metadata format
        const namesToCreate = namesArray.map((nameEntry) => {
          let nameData = {
            importOrder: importOrder++,
            originalPageId: nameList.id
          };

          if (typeof nameEntry === 'string') {
            // Legacy format: just a string
            nameData.name = nameEntry;
          } else if (typeof nameEntry === 'object' && nameEntry.name) {
            // New format: object with metadata
            nameData.name = nameEntry.name;
            nameData.artifactNumber = nameEntry.panelNumber || nameEntry.originalRecord || null;
            nameData.blockNumber = nameEntry.blockNumber || null;
          } else {
            console.warn(`Unexpected name format in ${nameList.title}:`, nameEntry);
            nameData.name = String(nameEntry);
          }

          return nameData;
        });

        // Batch insert names for this page
        await prisma.name.createMany({
          data: namesToCreate,
          skipDuplicates: true
        });

        totalNamesProcessed += namesToCreate.length;
        console.log(`  ✅ Created ${namesToCreate.length} names (total: ${totalNamesProcessed})`);

      } catch (error) {
        console.error(`Error processing ${nameList.title}:`, error);
        console.error('Error details:', error.message);
        console.error('Names data sample:', nameList.names.substring(0, 200));
        // Continue with next name list
      }
    }

    // Verify the migration
    const totalNames = await prisma.name.count();
    console.log(`\n📊 Migration Summary:`);
    console.log(`  • Total names created: ${totalNames}`);
    console.log(`  • Expected names: ~91,897`);
    console.log(`  • Import order range: 1 to ${importOrder - 1}`);

    if (totalNames > 90000) {
      console.log('✅ Migration appears successful!');
    } else {
      console.log('⚠️  Migration may be incomplete - check for errors above');
    }

  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration if called directly
if (require.main === module) {
  migrateToNames();
}

module.exports = { migrateToNames };