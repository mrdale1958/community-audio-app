// scripts/import-from-filemaker.js - Import names from FileMaker Pro via Data API

const fs = require('fs');
const fetch = require('node-fetch'); // You might need: npm install node-fetch@2
const bcrypt = require('bcrypt'); // Add bcrypt for password hashing
const { PrismaClient } = require('@prisma/client');

// Import from local config file
const { CONFIG, PageHelpers } = require('./config');

const prisma = new PrismaClient();

// FileMaker configuration
const FM_CONFIG = {
  baseUrl: 'https://aidsquilt.360works.com/fmi/data/v1/databases/PMDB',
  credentials: 'RGF0YUFQSUFjY2VzczpRdWlsdGVyczIwMjAr', // Your existing auth
  layout: 'DataAPI' // Adjust if needed
};

class FileMakerImporter {
  constructor() {
    this.authToken = null;
    this.importStats = {
      totalRecords: 0,
      totalNames: 0,
      pagesCreated: 0,
      excludedRecords: 0,
      errors: []
    };
  }

  /**
   * Authenticate with FileMaker
   */
  async authenticate() {
    console.log('🔑 Authenticating with FileMaker...');
    
    const response = await fetch(`${FM_CONFIG.baseUrl}/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${FM_CONFIG.credentials}`
      }
    });

    const result = await response.json();
    
    if (result.response && result.response.token) {
      this.authToken = result.response.token;
      console.log('✅ Authentication successful');
      return true;
    } else {
      console.error('❌ Authentication failed:', result);
      return false;
    }
  }

  /**
   * Ensure user exists, create if not
   */
  async ensureUser(userId) {
    try {
      // Check if user exists
      const existingUser = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (existingUser) {
        console.log(`✅ Using existing user: ${existingUser.name} (${existingUser.email})`);
        return existingUser;
      }

      // Create user if doesn't exist
      console.log(`👤 Creating user with ID: ${userId}`);
      
      // Hash the password properly
      const hashedPassword = await bcrypt.hash('temp-import-password', 12);
      
      const newUser = await prisma.user.create({
        data: {
          id: userId,
          email: `${userId}@import.local`.toLowerCase(), // Normalize email
          name: `Import User ${userId}`,
          password: hashedPassword, // Use hashed password
          role: 'ADMIN'
        }
      });

      console.log(`✅ Created new user: ${newUser.name} (${newUser.email})`);
      return newUser;

    } catch (error) {
      console.error('❌ Error with user setup:', error);
      throw new Error(`Failed to ensure user exists: ${error.message}`);
    }
  }

  /**
   * Get all records from FileMaker
   */
  async getAllRecords() {
    if (!this.authToken) {
      throw new Error('Not authenticated. Call authenticate() first.');
    }

    console.log('📡 Fetching all records from FileMaker...');
    
    const allRecords = [];
    let offset = 1;
    const limit = 100; // Fetch in batches
    let hasMore = true;

    while (hasMore) {
      try {
        console.log(`📥 Fetching batch starting at record ${offset}...`);
        
        const response = await fetch(`${FM_CONFIG.baseUrl}/layouts/${FM_CONFIG.layout}/records?_offset=${offset}&_limit=${limit}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.authToken}`
          }
        });

        const result = await response.json();
        
        if (result.response && result.response.data) {
          const records = result.response.data;
          allRecords.push(...records);
          
          console.log(`   Got ${records.length} records (total so far: ${allRecords.length})`);
          
          // Check if we have more records
          if (records.length < limit) {
            hasMore = false;
          } else {
            offset += limit;
          }
        } else {
          console.error('❌ Error fetching records:', result);
          hasMore = false;
        }
      } catch (error) {
        console.error('❌ Network error:', error);
        hasMore = false;
      }
    }

    this.importStats.totalRecords = allRecords.length;
    console.log(`✅ Fetched ${allRecords.length} total records`);
    return allRecords;
  }

  /**
   * Extract names from FileMaker records with panel and block metadata
   */
  extractNames(records) {
    console.log('🔍 Extracting names from records...');
    
    const names = [];
    let excludedCount = 0;

    for (const record of records) {
      const fieldData = record.fieldData;
      
      // Check if OFR is set - exclude this record if it is
      const ofrField = fieldData['OFR'] || fieldData['ofr'] || '';
      if (ofrField && ofrField.toString().trim() !== '') {
        excludedCount++;
        this.importStats.excludedRecords++;
        continue; // Skip this record entirely
      }
      
      // Get panel and block information
      const panelNumber = fieldData['Panel number'] || fieldData['panelNumber'] || fieldData['Panel Number'] || '';
      const blockNumber = fieldData['Block #'] || fieldData['blockNumber'] || fieldData['Block Number'] || '';
      
      // Extract panel listing (adjust field name as needed)
      const panelListing = fieldData['Panel Listing'] || fieldData['panelListing'] || '';
      
      if (panelListing && typeof panelListing === 'string') {
        // Split panel listing into individual names
        // Common separators: newlines, semicolons, etc.
        const namesInPanel = panelListing
          .split(/[\n\r;]+/) // Split on newlines or semicolons
          .map(name => name.trim())
          .filter(name => name.length > 0);

        // Add ALL names with metadata (including duplicates)
        for (const nameText of namesInPanel) {
          names.push({
            name: nameText,
            panelNumber: panelNumber || undefined,
            blockNumber: blockNumber || undefined,
            originalRecord: record.recordId || `record_${names.length}`
          });
        }
      }
      
      // Also check for individual name fields if they exist
      const firstName = fieldData['First Name'] || fieldData['firstName'] || '';
      const lastName = fieldData['Last Name'] || fieldData['lastName'] || '';
      
      if (firstName || lastName) {
        const fullName = `${firstName} ${lastName}`.trim();
        if (fullName) {
          names.push({
            name: fullName,
            panelNumber: panelNumber || undefined,
            blockNumber: blockNumber || undefined,
            originalRecord: record.recordId || `record_${names.length}`
          });
        }
      }
    }

    this.importStats.totalNames = names.length;
    console.log(`✅ Extracted ${names.length} names with metadata (${excludedCount} records excluded due to OFR)`);
    
    // Log some sample data for verification
    if (names.length > 0) {
      console.log('📋 Sample extracted data:');
      const samples = names.slice(0, 3).map(item => ({
        name: item.name,
        panel: item.panelNumber,
        block: item.blockNumber
      }));
      console.log(samples);
    }
    
    return names;
  }

  /**
   * Save names to file for review
   */
  async saveNamesToFile(names, filename = 'extracted-names.txt') {
    console.log(`💾 Saving names to ${filename}...`);
    console.log(`📁 Current working directory: ${process.cwd()}`);
    
    try {
      // Create both a simple text file and a detailed JSON file
      const simpleContent = names.map(item => item.name).join('\n');
      fs.writeFileSync(filename, simpleContent, 'utf8');
      console.log(`✅ Saved ${names.length} names to ${filename}`);
      
      // Also save detailed metadata as JSON
      const jsonFilename = filename.replace('.txt', '.json');
      const detailedContent = JSON.stringify(names, null, 2);
      fs.writeFileSync(jsonFilename, detailedContent, 'utf8');
      console.log(`✅ Saved detailed metadata to ${jsonFilename}`);
      
      // Verify files exist
      const textExists = fs.existsSync(filename);
      const jsonExists = fs.existsSync(jsonFilename);
      console.log(`📋 File verification: ${filename} ${textExists ? '✅' : '❌'}, ${jsonFilename} ${jsonExists ? '✅' : '❌'}`);
      
    } catch (error) {
      console.error('❌ Error saving files:', error);
      throw error;
    }
  }

  /**
   * Import names into the database as pages
   */
  async importToDatabase(names, userId, options = {}) {
    const {
      seriesId = 'filemaker-import',
      seriesTitle = 'FileMaker Import',
      dryRun = false
    } = options;

    console.log(`📊 Importing ${names.length} names to database...`);
    console.log(`   Names per page: ${CONFIG.PAGE.NAMES_PER_PAGE}`);
    
    const totalPages = PageHelpers.calculateTotalPages(names.length);
    console.log(`   Will create ${totalPages} pages`);

    if (dryRun) {
      console.log('🔍 DRY RUN - No actual database changes will be made');
      this.importStats.pagesCreated = totalPages;
      return { success: true, pagesCreated: totalPages, dryRun: true };
    }

    try {
      const pages = [];
      
      for (let i = 0; i < totalPages; i++) {
        const pageNumber = CONFIG.PAGE.DEFAULT_START_PAGE + i;
        const startIndex = i * CONFIG.PAGE.NAMES_PER_PAGE;
        const endIndex = Math.min(startIndex + CONFIG.PAGE.NAMES_PER_PAGE, names.length);
        const pageNames = names.slice(startIndex, endIndex);
        
        console.log(`📄 Creating page ${pageNumber} with ${pageNames.length} names...`);
        
        const page = await prisma.nameList.create({
          data: {
            title: PageHelpers.getPageTitle(pageNumber),
            names: JSON.stringify(pageNames),
            pageNumber,
            totalPages,
            namesCount: pageNames.length,
            seriesId,
            description: `Imported from FileMaker - ${seriesTitle}`,
            createdBy: userId,
          }
        });

        pages.push(page);
        this.importStats.pagesCreated++;
      }

      console.log(`✅ Successfully created ${pages.length} pages`);
      return { success: true, pages, pagesCreated: pages.length };

    } catch (error) {
      console.error('❌ Database import error:', error);
      this.importStats.errors.push(error.message);
      throw error;
    }
  }

  /**
   * Disconnect from FileMaker
   */
  async disconnect() {
    if (this.authToken) {
      try {
        await fetch(`${FM_CONFIG.baseUrl}/sessions/${this.authToken}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${this.authToken}`
          }
        });
        console.log('🔌 Disconnected from FileMaker');
      } catch (error) {
        console.log('⚠️  Error disconnecting from FileMaker:', error.message);
      }
    }
  }

  /**
   * Full import process
   */
  async fullImport(userId, options = {}) {
    const startTime = Date.now();
    console.log('🚀 Starting FileMaker import process...\n');

    try {
      // Step 1: Authenticate
      const authenticated = await this.authenticate();
      if (!authenticated) {
        throw new Error('Authentication failed');
      }

      // Step 1.5: Ensure user exists
      await this.ensureUser(userId);

      // Step 2: Get all records
      const records = await this.getAllRecords();
      if (records.length === 0) {
        throw new Error('No records found');
      }

      // Step 3: Extract names
      const names = this.extractNames(records);
      if (names.length === 0) {
        throw new Error('No names found in records');
      }

      // Step 4: Save to file for review
      await this.saveNamesToFile(names);

      // Step 5: Import to database
      const result = await this.importToDatabase(names, userId, options);

      // Step 6: Cleanup
      await this.disconnect();

      // Final report
      const duration = (Date.now() - startTime) / 1000;
      console.log('\n📈 IMPORT SUMMARY:');
      console.log(`   Records processed: ${this.importStats.totalRecords}`);
      console.log(`   Records excluded (OFR): ${this.importStats.excludedRecords}`);
      console.log(`   Names extracted: ${this.importStats.totalNames}`);
      console.log(`   Pages created: ${this.importStats.pagesCreated}`);
      console.log(`   Duration: ${duration.toFixed(2)} seconds`);
      console.log(`   Names per page: ${CONFIG.PAGE.NAMES_PER_PAGE}`);

      if (this.importStats.errors.length > 0) {
        console.log(`   Errors: ${this.importStats.errors.length}`);
        this.importStats.errors.forEach(error => console.log(`     - ${error}`));
      }

      return {
        success: true,
        stats: this.importStats,
        result
      };

    } catch (error) {
      console.error('\n❌ IMPORT FAILED:', error.message);
      await this.disconnect();
      throw error;
    } finally {
      await prisma.$disconnect();
    }
  }
}

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const userId = args.find(arg => arg.startsWith('--user='))?.split('=')[1] || 'cli-import-user';

  const importer = new FileMakerImporter();
  
  importer.fullImport(userId, { 
    dryRun,
    seriesId: 'aids-quilt-import',
    seriesTitle: 'AIDS Quilt Memorial Names'
  })
  .then(result => {
    console.log('\n✅ Import completed successfully!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Import failed:', error.message);
    process.exit(1);
  });
}

module.exports = FileMakerImporter;