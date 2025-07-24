const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUsers() {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, email: true, password: true, role: true }
    });
    console.log('Users in database:');
    users.forEach(user => {
      const isHashed = user.password && user.password.startsWith('$2');
      console.log({
        id: user.id,
        email: user.email,
        role: user.role,
        passwordLength: user.password ? user.password.length : 0,
        passwordPrefix: user.password ? user.password.substring(0, 10) : 'none',
        isHashed: isHashed
      });
    });
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}
const bcrypt = require('bcrypt');

async function fixPasswords() {
  try {
    const users = await prisma.user.findMany();
    console.log('Fixing passwords for', users.length, 'users...');
    
    for (const user of users) {
      // Check if password is already hashed
      if (!user.password.startsWith('$2')) {
        console.log('Hashing password for:', user.email);
        const hashedPassword = await bcrypt.hash(user.password, 12);
        
        await prisma.user.update({
          where: { id: user.id },
          data: { password: hashedPassword }
        });
        
        console.log('✅ Updated password for:', user.email);
        console.log('   Original:', user.password);
        console.log('   Hashed length:', hashedPassword.length);
      } else {
        console.log('👍 Password already hashed for:', user.email);
      }
    }
    
    console.log('\n✅ All passwords are now properly hashed!');
    console.log('You can now log in with the original plain text passwords.');
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

fixPasswords();


checkUsers();
