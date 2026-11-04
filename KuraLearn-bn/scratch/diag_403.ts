import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: { teacher: true }
  });
  console.log('Recent Users and their Teacher records:');
  console.log(JSON.stringify(users, null, 2));

  const assessmentId = '3cb27b87-47af-44d1-bd81-a9bcfa72e608';
  const assessment = await prisma.assessment.findUnique({
    where: { id: assessmentId },
  });
  console.log('\nAssessment schoolId:', assessment?.schoolId);
}

main().catch(console.error).finally(() => prisma.$disconnect());
