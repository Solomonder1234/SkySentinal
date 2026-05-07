import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Exporting Staff Data to Website ---');

    const staffMembers = await prisma.staffMember.findMany({
        orderBy: [
            { priority: 'desc' },
            { username: 'asc' }
        ]
    });

    const outputDir = path.join(process.cwd(), 'skyalertwx.net', 'data');
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputPath = path.join(outputDir, 'staff.json');

    // Grouping into tiers for easier rendering
    const tiers: Record<string, any[]> = {};

    for (const staff of staffMembers) {
        if (!tiers[staff.tier]) {
            tiers[staff.tier] = [];
        }

        // Map color based on tier
        let color: string = 'gray';
        if (staff.tier === 'Owners') color = 'neonRed';
        else if (staff.tier === 'Founders') color = 'neonBlue';
        else if (staff.tier === 'Co-Founders') color = 'red';
        else if (staff.tier === 'Head of Staff') color = 'yellow';
        else if (staff.tier === 'Senior Admin') color = 'yellow';
        else if (staff.tier === 'Admin') color = 'blue';
        else if (staff.tier === 'Senior Moderator') color = 'blue';
        else if (staff.tier === 'Moderator') color = 'blue';

        // @ts-ignore
        tiers[staff.tier].push({
            name: staff.username,
            role: staff.role,
            clearance: `Level ${Math.floor(staff.priority / 10) + 1}`, // Rough mapping
            color,
            avatar: staff.avatarUrl
        });
    }

    // Convert to the exact StaffTier format the website expects
    const tierPriority = [
        'Owners', 'Founders', 'Co-Founders', 'Executive Board', 
        'Head of Staff', 'Senior Admin', 'Admin', 
        'Senior Moderator', 'Moderator', 'Trial Staff'
    ];

    const result = tierPriority
        .filter(t => tiers[t])
        .map(t => ({
            title: t,
            members: tiers[t]
        }));

    fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
    console.log(`Successfully exported ${staffMembers.length} staff members to ${outputPath}`);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
