import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// Test user credentials that match what we use in our Cypress tests
const TEST_USER = {
  email: 'test@example.com',
  password: 'password123',
  name: 'Test User',
  role: 'CONTRIBUTOR' // Using string value from schema default
}

export async function setupTestUser() {
  const hashedPassword = await bcrypt.hash(TEST_USER.password, 10)
  
  // Delete the test user if it exists
  await prisma.user.deleteMany({
    where: {
      email: TEST_USER.email
    }
  })
  
  // Create the test user
  return prisma.user.create({
    data: {
      email: TEST_USER.email,
      password: hashedPassword,
      name: TEST_USER.name,
      role: TEST_USER.role
    }
  })
}

export async function cleanupTestUser() {
  await prisma.user.deleteMany({
    where: {
      email: TEST_USER.email
    }
  })
}

export { TEST_USER }
