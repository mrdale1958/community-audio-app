// scripts/seed.ts
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Create sample name lists
  const sampleNameLists = [
    {
      title: 'Call My Name Project Wall - Section A',
      names: [
        'John Smith', 'Mary Johnson', 'Robert Williams', 'Patricia Brown',
        'Michael Davis', 'Linda Miller', 'William Wilson', 'Elizabeth Moore',
        'David Taylor', 'Barbara Anderson', 'Richard Thomas', 'Susan Jackson',
        'Joseph White', 'Jessica Harris', 'Thomas Martin', 'Sarah Thompson'
      ],
      pageNumber: 1
    },
    {
      title: 'Call My Name Project Wall - Section B', 
      names: [
        'Christopher Garcia', 'Karen Martinez', 'Daniel Robinson', 'Nancy Clark',
        'Matthew Rodriguez', 'Lisa Lewis', 'Anthony Lee', 'Betty Walker',
        'Mark Hall', 'Helen Allen', 'Donald Young', 'Sandra Hernandez',
        'Steven King', 'Donna Wright', 'Paul Lopez', 'Carol Hill'
      ],
      pageNumber: 2
    },
    {
      title: 'Community Leaders',
      names: [
        'Dr. Amanda Chen', 'Rev. James Washington', 'Mayor Sarah Rodriguez',
        'Prof. Michael O\'Brien', 'Coach Lisa Martinez', 'Principal David Kim',
        'Nurse Patricia Adams', 'Captain Robert Jones', 'Teacher Maria Lopez',
        'Volunteer John Thompson'
      ],
      pageNumber: 3
    }
  ]

  for (const nameListData of sampleNameLists) {
    await prisma.nameList.create({
      data: {
        title: nameListData.title,
        names: JSON.stringify(nameListData.names),
        pageNumber: nameListData.pageNumber
      }
    })
    console.log(`Created name list: ${nameListData.title}`)
  }

  console.log('Seeding completed!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })