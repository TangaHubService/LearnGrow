import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main(){
  const levels = await prisma.level.findMany();
  console.log('Levels:', levels.map(l=>l.name+' '+l.category));
}
main().catch(e=>{console.error(e);}).finally(()=>prisma.$disconnect());

