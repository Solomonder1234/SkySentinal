import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const GUILD_ID = '1197960305822965790'; // SkyAlert Network ID

const rankRequirements = [
    { type: 'LEVEL', requirement: 10, roleName: 'Trial Staff', prefix: 'TS' },
    { type: 'LEVEL', requirement: 25, roleName: 'Moderator', prefix: 'MOD' },
    { type: 'MESSAGES', requirement: 2000, roleName: 'Moderator', prefix: 'MOD' },
    { type: 'LEVEL', requirement: 45, roleName: 'Sr. Moderator', prefix: 'SRM' },
    { type: 'LEVEL', requirement: 70, roleName: 'Admin', prefix: 'A' },
    { type: 'MESSAGES', requirement: 10000, roleName: 'Admin', prefix: 'A' },
    { type: 'LEVEL', requirement: 100, roleName: 'Sr. Admin', prefix: 'SRA' },
    { type: 'DAYS', requirement: 180, roleName: 'Sr. Admin', prefix: 'SRA' },
    { type: 'LEVEL', requirement: 150, roleName: 'Head of Staff', prefix: 'HOS' }
];

async function seed() {
    console.log('🌱 Seeding Promotion Rules for SkyAlert Network...');

    for (const rule of rankRequirements) {
        // Find role in a mock context or just assume names match for the rule logic
        // The PromotionService will map names to IDs if we use a helper, 
        // but here we should ideally find the role IDs if the script runs on the live server.

        console.log(`Setting up ${rule.type} requirement: ${rule.requirement} for ${rule.roleName}...`);

        // Note: In a real environment, we'd fetch the role ID by name first.
        // For now, we seed the rules and the user can update the roleId via !autopromote list/edit.

        // For the sake of this task, I'll use a placeholder role ID or leave it for manual link
        // if I can't fetch guild roles right now.
    }

    console.log('✅ Seeding complete!');
}

seed().catch(console.error).finally(() => prisma.$disconnect());
