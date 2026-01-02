
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const count = await prisma.criterion.count();
    console.log(`Criterion Count: ${count}`);
    const indicators = await prisma.indicator.count();
    console.log(`Indicator Count: ${indicators}`);
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
