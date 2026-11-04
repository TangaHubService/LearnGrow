import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const id = '3cb27b87-47af-44d1-bd81-a9bcfa72e608';
  const assessment = await prisma.assessment.findUnique({
    where: { id },
    include: { teacher: true }
  });
  console.log(JSON.stringify(assessment, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
