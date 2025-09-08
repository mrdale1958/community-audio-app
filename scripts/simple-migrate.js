#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function simpleMigrate() {
  console.log('Starting simple migration...');
  
  try {
    // Get first nameList to test
    const firstList = await prisma.nameList.findFirst();
    console.log('First list pageNumber:', firstList.pageNumber);
    console.log('Names field type:', typeof firstList.names);
    
    // Parse the JSON
    const namesArray = JSON.parse(firstList.names);
    console.log('Parsed array length:', namesArray.length);
    console.log('First name:', namesArray[0]);
    
    // Create just the first 5 names as a test
    const testNames = namesArray.slice(0, 5).map((nameEntry, index) => ({
      name: nameEntry.name,
      importOrder: index + 1,
      artifactNumber: nameEntry.panelNumber || null,
      blockNumber: nameEntry.blockNumber || null,
      originalPageId: firstList.id
    }));
    
    console.log('Test names to create:', testNames);
    
    const result = await prisma.name.createMany({
      data: testNames
    });
    
    console.log('Created names:', result);
    
    // Check count
    const count = await prisma.name.count();
    console.log('Total names in DB:', count);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

simpleMigrate();