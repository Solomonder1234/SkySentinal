import { Command } from '../../lib/structures/Command';
import { PermissionFlagsBits, Message, ChatInputCommandInteraction } from 'discord.js';
import { EmbedUtils } from '../../utils/EmbedUtils';
import { STAFF_GUILD_ID } from '../../config';

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

const OWNER_IDS = ['753372101540577431', '1275816912387129344']; // VixWx and Jasmine (Example IDs, should use names if IDs unknown)

export default {
    name: 'syncstaff',
    description: 'Synchronizes staff members from the Staff Guild to the website database.',
    defaultMemberPermissions: PermissionFlagsBits.Administrator,
    run: async (client, interaction) => {
        const guild = client.guilds.cache.get(STAFF_GUILD_ID);
        if (!guild) {
            return interaction.reply({ embeds: [EmbedUtils.error('Sync Failed', 'Staff Guild not found.')] });
        }

        await interaction.reply({ embeds: [EmbedUtils.info('Sync Started', 'Synchronizing staff profiles from Discord to database...')] });

        try {
            const members = await guild.members.fetch();
            let syncCount = 0;

            // Clear existing staff members first (or update them)
            // For simplicity, we'll update or create
            
            for (const [, member] of members) {
                if (member.user.bot) continue;

                let tier = '';
                let priority = 0;
                let roleName = null;

                // Determine Tier based on roles
                for (const [roleId, data] of Object.entries(TIER_MAPPING)) {
                    if (member.roles.cache.has(roleId)) {
                        if (data.priority > priority) {
                            tier = data.name;
                            priority = data.priority;
                        }
                    }
                }

                // Handle Owners (High Priority)
                if (OWNER_IDS.includes(member.id)) {
                    tier = 'Owners';
                    priority = 90;
                    roleName = 'Owner / Founder';
                }

                if (!tier) continue; // Not a staff member

                await client.database.prisma.staffMember.upsert({
                    where: { id: member.id },
                    update: {
                        username: member.user.username,
                        avatarUrl: member.user.displayAvatarURL({ size: 512, extension: 'png' }),
                        tier,
                        role: roleName,
                        priority,
                    },
                    create: {
                        id: member.id,
                        username: member.user.username,
                        avatarUrl: member.user.displayAvatarURL({ size: 512, extension: 'png' }),
                        tier,
                        role: roleName,
                        priority,
                    }
                });
                syncCount++;
            }

            await interaction.editReply({ 
                embeds: [EmbedUtils.success('Sync Complete', `Successfully synchronized **${syncCount}** staff members to the database.`)] 
            });

        } catch (error) {
            client.logger.error('SyncStaff Error:', error);
            await interaction.editReply({ 
                embeds: [EmbedUtils.error('Sync Error', 'An unexpected error occurred during synchronization.')] 
            });
        }
    },
} as Command;
