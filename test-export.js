// Quick test script to check segment filter structure
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const segment = await prisma.segment.findUnique({
    where: { id: 'cmmwdrb3w0001550cjqpg8fzm' }
  });
  
  console.log('Segment found:', segment?.name);
  console.log('Filters type:', typeof segment?.filters);
  console.log('Filters:', JSON.stringify(segment?.filters, null, 2));
  console.log('Is Array?', Array.isArray(segment?.filters));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
