import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const lessons = await prisma.lesson.findMany({
    take: 10,
    select: {
      id: true,
      title: true,
      body: true,
      notes: true,
      description: true
    }
  });

  console.log("Found lessons:", lessons.length);
  for (const lesson of lessons) {
    console.log(`- Title: ${lesson.title}`);
    console.log(`  ID: ${lesson.id}`);
    console.log(`  Body length: ${lesson.body?.length ?? 0}`);
    console.log(`  Notes length: ${lesson.notes?.length ?? 0}`);
    console.log(`  Description length: ${lesson.description?.length ?? 0}`);
    console.log(`  Body preview: "${lesson.body?.slice(0, 100)}"`);
    console.log(`  Notes preview: "${lesson.notes?.slice(0, 100)}"`);
    console.log(`  Description preview: "${lesson.description?.slice(0, 100)}"`);
    console.log("---");
  }
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
