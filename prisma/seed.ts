import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting seed...')
  console.log('DATABASE_URL:', process.env.DATABASE_URL)
  
  // Test simple user creation
  try {
    const user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        name: 'Test User',
      },
    })
    console.log('User created:', user)
  } catch (error) {
    console.error('Error creating user:', error)
  }
}

main()
  .then(async () => {
    console.log('Seed completed')
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('Seed failed:', e)
    await prisma.$disconnect()
    process.exit(1)
  })