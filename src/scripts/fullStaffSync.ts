import { PrismaClient } from '@prisma/client';
import { Client, GatewayIntentBits } from 'discord.js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

const TIER_MAPPING: Record<string, { name: string, priority: number }> = {
    '1387636546261487770': { name: 'Founders', priority: 80 },
    '1387636614699679754': { name: 'Co-Founders', priority: 70 },
    '1387637435583828129': { name: 'Head of Staff', priority: 60 },
    '1387637479858901092': { name: 'Senior Admin', priority: 50 },
    '1387637516055613460': { name: 'Admin', priority: 40 },
    '1387637559282368655': { name: 'Senior Moderator', priority: 30 },
    '1387637616882487296': { name: 'Moderator', priority: 20 },
    '1387736757394473051': { name: 'Trial Staff', priority: 10 }
};

const OWNER_IDS = [
    '753372101540577431', // VixWx
    '559552595295731746'  // Jasmine (mnrr.6131)
];

const prisma = new PrismaClient();
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers] });

async function run() {
    console.log('--- CRITICAL STAFF SYNC INITIALIZED ---');
    
    await client.login(process.env.TOKEN);
    
    const guildId = '1386826411666309201';
    const guild = await client.guilds.fetch(guildId);
    const members = await guild.members.fetch();
    
    console.log(`Syncing ${members.size} members from Staff Guild...`);
    
    let syncCount = 0;
    for (const [, member] of members) {
        if (member.user.bot) continue;

        let tier = '';
        let priority = 0;
        let roleName = null;

        for (const [roleId, data] of Object.entries(TIER_MAPPING)) {
            if (member.roles.cache.has(roleId)) {
                if (data.priority > priority) {
                    tier = data.name;
                    priority = data.priority;
                }
            }
        }

        if (OWNER_IDS.includes(member.id)) {
            tier = 'Owners';
            priority = 90;
            roleName = 'Owner / Founder';
        }

        if (!tier) continue;
        await syncMember(member.user, tier, roleName, priority);
        syncCount++;
    }

    // Explicitly Sync Owners (Even if not in Staff Guild)
    console.log('Explicitly syncing owners...');
    for (const ownerId of OWNER_IDS) {
        try {
            const ownerUser = await client.users.fetch(ownerId);
            if (ownerUser) {
                await syncMember(ownerUser, 'Owners', 'Owner / Founder', 90);
                syncCount++;
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
                avatarUrl: user.displayAvatarURL({ size: 512, extension: 'png' }),
                tier,
                role: roleName,
                priority,
            },
            create: {
                id: user.id,
                username: user.username,
                avatarUrl: user.displayAvatarURL({ size: 512, extension: 'png' }),
                tier,
                role: roleName,
                priority,
            }
        });
    }
    
    console.log(`Successfully synced ${syncCount} staff members to DB.`);
    
    // Trigger Export
    console.log('Triggering data export to web components...');
    // We'll just run the logic from exportStaff here to be faster
    
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

    const tierOrder = ['Owners', 'Founders', 'Co-Founders', 'Executive Board', 'Head of Staff', 'Senior Admin', 'Admin', 'Senior Moderator', 'Moderator', 'Trial Staff'];
    const result = tierOrder.filter(t => webData[t]).map(t => ({ title: t, members: webData[t] }));

    const outPath = path.join(process.cwd(), 'skyalertwx.net', 'data', 'staff.json');
    fs.writeFileSync(outPath, JSON.stringify(result, null, 2));
    
    console.log('--- SYNC & EXPORT COMPLETE ---');
    process.exit(0);
}

run().catch(console.error);
