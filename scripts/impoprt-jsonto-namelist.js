#!/usr/bin/env node

// Import names from extracted-names.json and create NameList pages in the database

const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// CONFIG: Set your desired page size here
const NAMES_PER_PAGE = 20;
const START_PAGE = 1;

async function importJsonToNameList() {
  const jsonPath = path.resolve(__dirname, '../extracted-names.json');
  if (!fs.existsSync(jsonPath)) {
    console.error(`File not found: ${jsonPath}`);
    process.exit(1);
  }

  const allNames = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  const totalPages = Math.ceil(allNames.length / NAMES_PER_PAGE);

  console.log(`Importing ${allNames.length} names into ${totalPages} pages...`);

  let importCount = 0;

  for (let i = 0; i < totalPages; i++) {
    const pageNumber = START_PAGE + i;
    const startIdx = i * NAMES_PER_PAGE;
    const endIdx = Math.min(startIdx + NAMES_PER_PAGE, allNames.length);
    const pageNames = allNames.slice(startIdx, endIdx);

    await prisma.nameList.create({
      data: {
        title: `Page ${pageNumber}`,
        names: JSON.stringify(pageNames),
        pageNumber,
        namesCount: pageNames.length,
        description: 'Imported from extracted-names.json',
        //createdBy: 'migration-script',
      }
    });

    importCount += pageNames.length;
    console.log(`  ✅ Imported page ${pageNumber} (${pageNames.length} names)`);
  }

  console.log(`\n🎉 Migration complete! Imported ${importCount} names in ${totalPages} pages.`);

  await prisma.$disconnect();
}

if (require.main === module) {
  importJsonToNameList().catch(e => {
    console.error(e);
    process.exit(1);
  });
}