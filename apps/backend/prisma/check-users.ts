import 'dotenv/config';
import { prisma } from '../src/lib/prisma.js';

const users = await prisma.user.findMany({ select: { id: true, email: true, createdAt: true } });
console.log(JSON.stringify(users, null, 2));
await prisma.$disconnect();
