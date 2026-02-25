import { Command } from '../../lib/structures/Command';
import { ApplicationCommandOptionType, ApplicationCommandType, Message, ChatInputCommandInteraction } from 'discord.js';
import { EmbedUtils } from '../../utils/EmbedUtils';
import { STAFF_ROLE_MAP } from '../../config';

export default {
    name: 'promote',
    description: 'Promotes a user to the next staff rank and updates their nickname prefix.',
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: 'user',
            description: 'The user to promote.',
            type: ApplicationCommandOptionType.User,
            required: true,
        }
    ],
    run: async (client, interaction) => {
        // Enforce HOS (Head of Staff) to Founder Roles Only
        let hasPermission = false;
        if (interaction.member?.user.id === interaction.guild?.ownerId) {
            hasPermission = true;
        } else if (interaction.member && interaction.guild) {
            const memberRoles = interaction.member.roles as any;
            const guildRoles = interaction.guild.roles.cache;

            // Find the Head of Staff role to get its baseline position
            const hosRole = guildRoles.find((r: any) => r.name.toLowerCase() === 'head of staff' || r.name.toLowerCase() === 'hos');

            if (memberRoles.cache && memberRoles.cache.some((r: any) => r.permissions && r.permissions.has('Administrator'))) {
                hasPermission = true;
            }

            if (hosRole && memberRoles.highest && memberRoles.highest.position >= hosRole.position) {
                hasPermission = true;
            }

            if (memberRoles.cache && memberRoles.cache.some((r: any) => ['founder', 'head of staff', 'hos'].includes(r.name.toLowerCase()))) {
                hasPermission = true;
            }
        }

        if (!hasPermission) {
            const errorEmbed = EmbedUtils.error('Access Denied', 'This command is restricted to the **Head of Staff** and **Founder** roles.');
            if (interaction instanceof Message) {
                return interaction.reply({ embeds: [errorEmbed] });
            } else {
                return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
        }

        let user;

        if (interaction instanceof Message) {
            const args = interaction.content.split(' ').slice(1);
            if (interaction.mentions.users.size > 0) {
                user = interaction.mentions.users.first();
            } else if (args[0]) {
                try { user = await client.users.fetch(args[0]); } catch (e) { }
            }
        } else {
            const chatInteraction = interaction as ChatInputCommandInteraction;
            user = chatInteraction.options.getUser('user', true);
        }

        if (!user) {
            return interaction.reply({ content: 'Please mention a valid user or provide a valid user ID.' });
        }

        const guild = interaction.guild;
        if (!guild) return;

        try {
            const targetMember = await guild.members.fetch(user.id);

            // Define the hierarchical promotion list (lowest to highest)
            const rankHierarchy = [
                { roleName: 'Trial staff', prefix: 'TS', mainId: '1366099517740552265', staffId: '1387736757394473051' },
                { roleName: 'Moderator', prefix: 'MOD', mainId: '1275838245468639385', staffId: '1387637616882487296' },
                { roleName: 'Sr. Moderator', prefix: 'SRM', mainId: '1366097955676749844', staffId: '1387637559282368655' },
                { roleName: 'Admin', prefix: 'A', mainId: '1275838130498568334', staffId: '1387637516055613460' },
                { roleName: 'Sr Admin', prefix: 'SRA', mainId: '1366077117376364625', staffId: '1387637479858901092' },
                { roleName: 'Head Of Staff', prefix: 'HOS', mainId: '1366096466010968177', staffId: '1387637435583828129' },
                { roleName: 'Co founder', prefix: 'CF', mainId: '1282527079828815944', staffId: '1387636614699679754' }
            ];

            // 1. Determine Current Rank
            let currentRankIndex = -1;
            for (let i = 0; i < rankHierarchy.length; i++) {
                const rankDef = rankHierarchy[i];
                if (rankDef && targetMember.roles.cache.some((r: any) => {
                    return r.id === rankDef.mainId || r.id === rankDef.staffId ||
                        r.name.toUpperCase() === rankDef.roleName.toUpperCase() ||
                        r.name.toUpperCase() === rankDef.prefix.toUpperCase();
                })) {
                    currentRankIndex = i;
                }
            }

            if (currentRankIndex >= rankHierarchy.length - 1) {
                const errorEmbed = EmbedUtils.error('Promotion Failed', `<@${user.id}> is already at the highest recognized staff rank.`);
                return interaction.reply({ embeds: [errorEmbed] });
            }

            let nextRankIndex = 0;
            if (currentRankIndex !== -1) {
                nextRankIndex = currentRankIndex + 1;
            }

            if (nextRankIndex >= rankHierarchy.length) return;

            const currentRank = currentRankIndex !== -1 ? rankHierarchy[currentRankIndex] : null;
            const nextRank = rankHierarchy[nextRankIndex];

            if (!nextRank) return;

            // 2. Find Roles in Guild
            let currentRoleObj: any = undefined;
            if (currentRank && currentRank.roleName) {
                currentRoleObj = guild.roles.cache.find((r: any) => {
                    return r.id === currentRank.mainId || r.id === currentRank.staffId ||
                        r.name.toUpperCase() === currentRank.roleName.toUpperCase() ||
                        r.name.toUpperCase() === currentRank.prefix.toUpperCase();
                });
            }
            // 3. Find Role Object for Next Rank
            const nextRoleObj = guild.roles.cache.find((r: any) => {
                return r.id === nextRank.mainId || r.id === nextRank.staffId ||
                    r.name.toUpperCase() === nextRank.roleName.toUpperCase() ||
                    r.name.toUpperCase() === nextRank.prefix.toUpperCase();
            });

            if (!nextRoleObj) {
                const errorEmbed = EmbedUtils.error('Role Not Found', `Cannot promote user. The role **${nextRank.roleName}** does not exist in this server. Please create it first.`);
                return interaction.reply({ embeds: [errorEmbed] });
            }

            // 3. Apply Role Changes
            if (currentRoleObj) await targetMember.roles.remove(currentRoleObj);
            await targetMember.roles.add(nextRoleObj);

            // 4. Update Nickname
            const currentNickname = targetMember.nickname || targetMember.user.username;
            let baseName = currentNickname;

            // Regex to strip any existing bracketed prefix like [TS], {MOD}, |SRM|
            baseName = baseName.replace(/^\[.*?\]\s*|\{.*?\}\s*|\|.*?\|\s*/g, '').trim();

            const newNickname = `[${nextRank.prefix}] ${baseName}`.substring(0, 32);

            try {
                await targetMember.setNickname(newNickname);
            } catch (err) {
                client.logger.warn(`Could not set nickname for ${user.tag}, lack of hierarchy permissions.`);
            }

            const previousRankText = currentRank ? currentRank.roleName : 'None (Unranked)';

            const ansiContent = `\`\`\`ansi\n\u001b[1;36mOfficial Rank Advancement\u001b[0m\n\u001b[0;34mPrevious Rank:\u001b[0m \u001b[1;37m${previousRankText}\u001b[0m\n\u001b[0;34mNew Rank:\u001b[0m \u001b[1;37m${nextRank.roleName}\u001b[0m\n\n\u001b[1;36mSystem Update\u001b[0m\n\u001b[0;34mTheir database profile and nickname have been updated to reflect their new station: \u001b[0m\u001b[1;37m${newNickname}\u001b[0m\n\`\`\``;

            const successEmbed = EmbedUtils.success(
                'Staff Promotion Authorized',
                `<@${user.id}> has been officially promoted!\n${ansiContent}`
            );

            // Log to specific channel
            try {
                const logChannelId = '1473466436449210511';
                const logChannel = await client.channels.fetch(logChannelId);
                if (logChannel && logChannel.isTextBased() && 'guild' in logChannel) {
                    // Explicit Staff Server Role lookup because log channel is probably in staff server
                    const staffRole = await logChannel.guild.roles.fetch().then((roles: any) => roles.find((r: any) => r.name.toLowerCase() === 'staff' || r.name.toLowerCase() === 'staff team')).catch(() => null);
                    const pingText = staffRole ? `<@&${staffRole.id}>` : '@Staff';
                    await logChannel.send({ content: pingText, embeds: [successEmbed] });
                }
            } catch (err: any) {
                client.logger.error(`Failed to send promotion log to defined channel: ${err.message}`);
            }

            if (interaction instanceof Message) {
                await interaction.reply({ embeds: [successEmbed] });
            } else {
                await interaction.reply({ embeds: [successEmbed] });
            }

        } catch (error) {
            client.logger.error('Promotion error:', error);
            const errorEmbed = EmbedUtils.error('Error', 'An error occurred while attempting to promote the user.');
            if (interaction instanceof Message) {
                await interaction.reply({ embeds: [errorEmbed] });
            } else {
                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
        }
    },
} as Command;
