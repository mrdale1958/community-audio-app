const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://readmyname_user:secure_password@localhost:5432/readmyname_production?schema=public'
    }
  }
});

async function checkData() {
  try {
    const nameListCount = await prisma.nameList.count();
    const userCount = await prisma.user.count();
    const recordingCount = await prisma.recording.count();
    
    console.log('NameLists:', nameListCount);
    console.log('Users:', userCount);
    console.log('Recordings:', recordingCount);
    
    if (nameListCount > 0) {
      const sampleNameLists = await prisma.nameList.findMany({
        take: 3,
        select: {
          id: true,
          title: true,
          pageNumber: true,
          names: true
        }
      });
      
      console.log('\nSample NameLists:');
      sampleNameLists.forEach((nl, i) => {
        const names = JSON.parse(nl.names);
        console.log((i+1) + '. ' + nl.title + ' (Page ' + nl.pageNumber + ') - ' + names.length + ' names');
        console.log('   First few names: ' + names.slice(0, 3).join(', '));
      });
    }
    
    await prisma.();
  } catch (error) {
    console.error('Error:', error.message);
    await prisma.();
  }
}

checkData();
