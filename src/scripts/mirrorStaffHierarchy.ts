import { Client, GatewayIntentBits, Role } from 'discord.js';
import * as dotenv from 'dotenv';
dotenv.config();

const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildModeration
    ] 
});

const SOURCE_GUILD_ID = '1275838044531855433'; // Main Server
const TARGET_GUILD_ID = '1386826411666309201'; // Staff Guild

// Prefixes to look for
const STAFF_PREFIXES = ['[F]', '[CF]', '[EB]', '[HOS]', '[SRA]', '[A]', '[SRM]', '[MOD]', '[TS]', '[ST]', '[PRM]', '[PRA]', '[FS]'];

client.once('ready', async () => {
    console.log('--- STARTING STAFF HIERARCHY MIRRORING ---');
    
    try {
        const sourceGuild = await client.guilds.fetch(SOURCE_GUILD_ID);
        const targetGuild = await client.guilds.fetch(TARGET_GUILD_ID);

        if (!sourceGuild || !targetGuild) {
            console.error('One or both guilds not found.');
            process.exit(1);
        }

        console.log(`Source: ${sourceGuild.name} (${sourceGuild.id})`);
        console.log(`Target: ${targetGuild.name} (${targetGuild.id})`);

        // 1. Fetch Source Roles
        const sourceRoles = await sourceGuild.roles.fetch();
        const staffRoles = sourceRoles.filter(r => 
            STAFF_PREFIXES.some(px => r.name.toUpperCase().startsWith(px)) || 
            r.name.toLowerCase().includes('head of staff') ||
            r.name.toLowerCase().includes('staffing -')
        ).sort((a, b) => b.position - a.position);

        console.log(`Found ${staffRoles.size} staff-related roles to mirror.`);

        // 2. Mirror Structure in Target
        const roleMap: Map<string, Role> = new Map(); // SourceID -> TargetRole
        
        for (const [, sRole] of staffRoles) {
            let tRole = targetGuild.roles.cache.find(r => r.name === sRole.name);
            
            if (!tRole) {
                console.log(`Creating missing role: ${sRole.name}`);
                tRole = await targetGuild.roles.create({
                    name: sRole.name,
                    color: sRole.color,
                    hoist: true, // Specifically requested to BE HOISTED
                    mentionable: sRole.mentionable,
                    reason: 'Automated Hierarchy Mirroring By SkySentinel'
                });
            } else {
                console.log(`Role exists: ${sRole.name}`);
                // Ensure it's hoisted
                if (!tRole.hoist) {
                    await tRole.setHoist(true).catch(() => {});
                }
            }
            roleMap.set(sRole.id, tRole);
        }

        // 3. Synchronize Members
        console.log('\n--- SYNCHRONIZING MEMBERS ---');
        const targetMembers = await targetGuild.members.fetch();
        const sourceMembers = await sourceGuild.members.fetch();

        let syncCount = 0;
        for (const [, tMember] of targetMembers) {
            if (tMember.user.bot) continue;

            const sMember = sourceMembers.get(tMember.id);
            if (!sMember) continue;

            // Find all staff roles this member has in the source guild
            const rolesToApply = [];
            for (const [sRoleId, tRole] of roleMap) {
                if (sMember.roles.cache.has(sRoleId)) {
                    rolesToApply.push(tRole.id);
                }
            }

            if (rolesToApply.length > 0) {
                console.log(`Syncing roles for ${tMember.user.tag}: [${rolesToApply.length} roles]`);
                await tMember.roles.add(rolesToApply).catch(err => {
                    console.error(` Failed to sync roles for ${tMember.user.tag}: ${err.message}`);
                });
                syncCount++;
            }
        }

        console.log(`\n--- MIRRORING COMPLETE ---`);
        console.log(`Roles Processed: ${staffRoles.size}`);
        console.log(`Members Rolled: ${syncCount}`);
        
    } catch (error) {
        console.error('Fatal Error during mirroring:', error);
    }

    process.exit(0);
});

client.login(process.env.TOKEN);
