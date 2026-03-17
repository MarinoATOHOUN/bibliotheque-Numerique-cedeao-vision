import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

import dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

async function main() {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const email = 'admin@cedeao.int';

    const user = await prisma.user.upsert({
        where: { email },
        update: {},
        create: {
            email,
            password: hashedPassword,
            role: 'ADMIN',
            status: 'ACTIVE',
        },
    });

    console.log('Admin user created/verified:', user.email);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
