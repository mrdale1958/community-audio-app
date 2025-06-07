import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting seed...')
  
  // Create a test user
  const user = await prisma.user.create({
    data: {
      email: 'test@example.com',
      name: 'Test User',
      password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewMNPQWoLNWs', // "password"
    },
  })

  // Create a name list
  const nameList = await prisma.nameList.create({
    data: {
      title: 'Sample Names Page 1',
      pageNumber: 1,
      names: JSON.stringify([
        'Alice Johnson',
        'Bob Smith', 
        'Carol Davis',
        'David Wilson',
        'Emma Brown'
      ]),
      totalNames: 5,
      category: 'Test Data',
    },
  })

  console.log('Seed completed successfully!')
  console.log('User:', user.email)
  console.log('Name List:', nameList.title)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('Seed failed:', e)
    await prisma.$disconnect()
    process.exit(1)
  })