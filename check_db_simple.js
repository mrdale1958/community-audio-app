const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkData() {
  try {
    const nameListCount = await prisma.nameList.count();
    const userCount = await prisma.user.count();
    const recordingCount = await prisma.recording.count();
    
    console.log('Database counts:');
    console.log('NameLists:', nameListCount);
    console.log('Users:', userCount);
    console.log('Recordings:', recordingCount);
    
    if (nameListCount > 0) {
      const firstNameList = await prisma.nameList.findFirst({
        select: {
          id: true,
          title: true,
          pageNumber: true,
          names: true
        }
      });
      
      if (firstNameList) {
        const names = JSON.parse(firstNameList.names);
        console.log('Sample NameList:', firstNameList.title);
        console.log('Names count:', names.length);
        console.log('First 3 names:', names.slice(0, 3));
      }
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.();
  }
}

checkData();
