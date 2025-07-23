// scripts/create-admin.ts
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function createAdmin() {
  const email = process.argv[2]
  const password = process.argv[3]
  const name = process.argv[4]

  if (!email || !password || !name) {
    console.log('Usage: npx tsx scripts/create-admin.ts <email> <password> <name>')
    console.log('Example: npx tsx scripts/create-admin.ts admin@example.com password123 "Admin User"')
    process.exit(1)
  }

  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      // Update existing user to admin
      const updatedUser = await prisma.user.update({
        where: { email },
        data: { role: 'ADMIN' },
        select: { id: true, email: true, name: true, role: true }
      })
      
      console.log('✅ Updated existing user to admin:')
      console.log(updatedUser)
    } else {
      // Create new admin user
      const hashedPassword = await bcrypt.hash(password, 12)
      
      const newUser = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          role: 'ADMIN'
        },
        select: { id: true, email: true, name: true, role: true }
      })
      
      console.log('✅ Created new admin user:')
      console.log(newUser)
    }
  } catch (error) {
    console.error('❌ Error creating admin user:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

createAdmin()