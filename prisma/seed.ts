import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { UserRole } from '../types/prisma';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clear existing data (optional - remove if you want to keep existing data)
  console.log('🧹 Clearing existing users...');
  await prisma.user.deleteMany();

  // Hash password for all test users
  const password = 'password123';
  const hashedPassword = await bcrypt.hash(password, 10);

  const users = [
    // Contributors
    {
      email: 'contributor1@example.com',
      name: 'Alice Contributor',
      role: UserRole.CONTRIBUTOR,
      password: hashedPassword
    },
    {
      email: 'contributor2@example.com',
      name: 'Bob Contributor',
      role: UserRole.CONTRIBUTOR,
      password: hashedPassword
    },
    
    // Managers
    {
      email: 'manager1@example.com',
      name: 'Carol Manager',
      role: UserRole.MANAGER,
      password: hashedPassword
    },
    {
      email: 'manager2@example.com',
      name: 'David Manager',
      role: UserRole.MANAGER,
      password: hashedPassword
    },
    
    // Observers
    {
      email: 'observer1@example.com',
      name: 'Eve Observer',
      role: UserRole.OBSERVER,
      password: hashedPassword
    },
    {
      email: 'observer2@example.com',
      name: 'Frank Observer',
      role: UserRole.OBSERVER,
      password: hashedPassword
    },
    
    // Gallerists
    {
      email: 'gallerist1@example.com',
      name: 'Grace Gallerist',
      role: UserRole.GALLERIST,
      password: hashedPassword
    },
    {
      email: 'gallerist2@example.com',
      name: 'Henry Gallerist',
      role: UserRole.GALLERIST,
      password: hashedPassword
    },
    
    // Admins
    {
      email: 'admin1@example.com',
      name: 'Iris Admin',
      role: UserRole.ADMIN,
      password: hashedPassword
    },
    {
      email: 'admin2@example.com',
      name: 'Jack Admin',
      role: UserRole.ADMIN,
      password: hashedPassword
    }
  ];

  console.log('👥 Creating test users...');
  
  for (const userData of users) {
    const user = await prisma.user.create({
      data: userData
    });
    console.log(`✅ Created ${user.role}: ${user.name} (${user.email})`);
  }

  // Create some sample name lists
  console.log('📝 Creating sample name lists...');
  
  const nameLists = [
    {
      title: 'Memorial Wall - Section A',
      pageNumber: 1,
      names: JSON.stringify([
        'John Smith (1945-2020)',
        'Mary Johnson (1952-2021)', 
        'Robert Williams (1938-2019)',
        'Patricia Brown (1960-2022)',
        'Michael Davis (1955-2020)'
      ])
    },
    {
      title: 'Memorial Wall - Section B', 
      pageNumber: 2,
      names: JSON.stringify([
        'Jennifer Wilson (1970-2021)',
        'William Moore (1942-2020)',
        'Elizabeth Taylor (1965-2022)',
        'David Anderson (1948-2019)',
        'Sarah Thomas (1975-2021)'
      ])
    },
    {
      title: 'Memorial Wall - Section C',
      pageNumber: 3, 
      names: JSON.stringify([
        'Christopher Jackson (1958-2020)',
        'Jessica White (1962-2021)',
        'Matthew Harris (1950-2019)',
        'Ashley Martin (1980-2022)',
        'Daniel Thompson (1945-2020)'
      ])
    }
  ];

  for (const nameListData of nameLists) {
    const nameList = await prisma.nameList.create({
      data: nameListData
    });
    console.log(`✅ Created name list: ${nameList.title}`);
  }

  console.log('🎉 Database seeded successfully!');
  console.log('\n📋 Test user credentials:');
  console.log('Email: [role][1-2]@example.com (e.g., admin1@example.com)');
  console.log('Password: password123');
  console.log('\nAvailable roles:');
  console.log('- contributor1@example.com / contributor2@example.com');
  console.log('- manager1@example.com / manager2@example.com'); 
  console.log('- observer1@example.com / observer2@example.com');
  console.log('- gallerist1@example.com / gallerist2@example.com');
  console.log('- admin1@example.com / admin2@example.com');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });