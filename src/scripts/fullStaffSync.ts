import { PrismaClient } from '@prisma/client';
import { Client, GatewayIntentBits } from 'discord.js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

/**
 * SOURCE CONFIGURATION (MAIN SERVER)
 */
const MAIN_GUILD_ID = '1275838044531855433';
const STAFF_ROLE_ID = '1276037406696538112';

// Roles that negate staff status (Excluding Public Relations)
const EXCLUDED_PR_ROLE_IDS = [
    '1474510020350578778', // [PRM] | Public Relations Manager
    '1474509849218781204', // [PRA] | Public Relations Associate
    '1473861192941568271'  // Staffing - Public Relations Manager
];

/**
 * RANK PREFIX MAPPING (Maintain Manual Hierarchy)
 */
const PREFIX_MAPPING: Record<string, { name: string, priority: number }> = {
    '[F]': { name: 'Founders', priority: 80 },
    '[CF]': { name: 'Co-Founders', priority: 70 },
    '[CF/EB]': { name: 'Co-Founders', priority: 70 },
    '[EB]': { name: 'Executive Board', priority: 65 },
    '[HOS]': { name: 'Head of Staff', priority: 60 },
    '[HOS/S]': { name: 'Head of Staff', priority: 60 },
    '[SRA]': { name: 'Senior Admin', priority: 50 },
    '[A]': { name: 'Admin', priority: 40 },
    '[SRM]': { name: 'Senior Moderator', priority: 30 },
    '[MOD]': { name: 'Moderator', priority: 20 },
    '[TS]': { name: 'Trial Staff', priority: 10 }
};

const OWNER_IDS = [
    '753372101540577431', // VixWx
    '559552595295731746', // Jasmine
    '1279672537873252405'  // equinoxicon.0 (GermanyIsCountry) - Co-Founder
];

const prisma = new PrismaClient();
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers] });

async function run() {
    console.log('--- SYNCING SELECTIVE STAFF FROM MAIN SERVER ---');

    await client.login(process.env.TOKEN);

    const guild = await client.guilds.fetch(MAIN_GUILD_ID);
    const members = await guild.members.fetch();

    console.log(`Analyzing ${members.size} members from Main Server for Staff/PR filters...`);

    let syncCount = 0;
    for (const [, member] of members) {
        if (member.user.bot) continue;

        // Inclusion Check: Has "Staff" role?
        const isStaff = member.roles.cache.has(STAFF_ROLE_ID);

        // Exclusion Check: Is in "Public Relations"?
        const isPR = member.roles.cache.some(r => 
            EXCLUDED_PR_ROLE_IDS.includes(r.id) || 
            r.name.toLowerCase().includes("public relations")
        );

        // Owners bypass filters
        const isOwner = OWNER_IDS.includes(member.id);

        if (!isOwner && (!isStaff || isPR)) continue;

        let tier = 'Network Staff'; // Group inclusive but non-prefixed staff
        let priority = 5;
        let roleDisplayName = 'Staff Member';

        const nickname = (member.nickname || member.user.username).toString();

        // Priority 1: Match Prefix
        for (const [prefix, data] of Object.entries(PREFIX_MAPPING)) {
            const cleanPrefix = prefix.replace(']', ''); // e.g., '[A'

            // Rule: If nickname has a /, the first prefix is the role
            if (nickname.includes(prefix) || (nickname.includes('/') && nickname.includes(cleanPrefix + '/'))) {
                tier = data.name;
                priority = data.priority;
                roleDisplayName = tier;
                break;
            }
        }

        // Priority 2: Hard-set Owners
        if (isOwner) {
            tier = 'Owners';
            priority = 90;
            roleDisplayName = 'Owner / Founder';
        }

        await syncMember(member.user, tier, roleDisplayName, priority);
        syncCount++;
    }

    // Explicitly Sync Owners to ensure they are always present
    for (const ownerId of OWNER_IDS) {
        try {
            const ownerUser = await client.users.fetch(ownerId);
            if (ownerUser) {
                await syncMember(ownerUser, 'Owners', 'Owner / Founder', 90);
            }
        } catch (e: any) {
            console.error(`Failed to fetch owner ${ownerId}: ${e.message}`);
        }
    }

    async function syncMember(user: any, tier: string, roleName: string | null, priority: number) {
        await prisma.staffMember.upsert({
            where: { id: user.id },
            update: {
                username: user.username,
                tier,
                role: roleName,
                priority,
                avatarUrl: user.displayAvatarURL({ size: 512, extension: 'png' })
            },
            create: {
                id: user.id,
                username: user.username,
                tier,
                role: roleName,
                priority,
                avatarUrl: user.displayAvatarURL({ size: 512, extension: 'png' })
            }
        });
    }

    // EXPORT
    const allStaff = await prisma.staffMember.findMany({
        orderBy: [{ priority: 'desc' }, { username: 'asc' }]
    });

    const webData: Record<string, any[]> = {};
    for (const s of allStaff) {
        if (!webData[s.tier]) {
            webData[s.tier] = [];
        }

        let color = 'gray';
        if (s.tier === 'Owners') color = 'neonRed';
        else if (s.tier === 'Founders') color = 'neonBlue';
        else if (s.tier === 'Co-Founders') color = 'red';
        else if (s.tier === 'Executive Board') color = 'red';
        else if (s.tier === 'Head of Staff') color = 'yellow';
        else if (s.tier === 'Senior Admin') color = 'yellow';
        else if (s.tier === 'Admin') color = 'blue';
        else if (s.tier === 'Senior Moderator') color = 'blue';
        else if (s.tier === 'Moderator') color = 'blue';

        // @ts-ignore
        webData[s.tier].push({
            name: s.username,
            role: s.role,
            clearance: `Level ${Math.floor(s.priority / 10) + 1}`,
            color,
            avatar: s.avatarUrl
        });
    }

    const tierOrder = ['Owners', 'Founders', 'Co-Founders', 'Executive Board', 'Head of Staff', 'Senior Admin', 'Admin', 'Senior Moderator', 'Moderator', 'Trial Staff', 'Network Staff'];
    const result = tierOrder.filter(t => webData[t] && webData[t].length > 0).map(t => ({ title: t, members: webData[t] }));

    const outPath = path.join(process.cwd(), 'skyalertwx.net', 'data', 'staff.json');
    fs.writeFileSync(outPath, JSON.stringify(result, null, 2));

    console.log(`--- SELECTIVE SYNC COMPLETE: ${syncCount} MEMBERS EXPORTED ---`);
    process.exit(0);
}

run().catch(console.error);
