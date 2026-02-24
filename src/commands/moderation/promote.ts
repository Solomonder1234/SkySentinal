import { Command } from '../../lib/structures/Command';
import { ApplicationCommandOptionType, ApplicationCommandType, Message, ChatInputCommandInteraction } from 'discord.js';
import { EmbedUtils } from '../../utils/EmbedUtils';

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
                { roleName: 'Trial Staff', prefix: 'TS' },
                { roleName: 'Moderator', prefix: 'MOD' },
                { roleName: 'Sr. Moderator', prefix: 'SRM' },
                { roleName: 'Admin', prefix: 'A' },
                { roleName: 'Sr. Admin', prefix: 'SRA' },
                { roleName: 'Head of Staff', prefix: 'HOS' }
            ];

            // 1. Determine Current Rank
            let currentRankIndex = -1;
            for (let i = 0; i < rankHierarchy.length; i++) {
                const rankDef = rankHierarchy[i];
                if (rankDef && targetMember.roles.cache.some((r: any) => r.name.toLowerCase() === rankDef.roleName.toLowerCase())) {
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
                currentRoleObj = guild.roles.cache.find((r: any) => r.name.toLowerCase() === currentRank.roleName.toLowerCase());
            }
            const nextRoleObj = guild.roles.cache.find((r: any) => r.name.toLowerCase() === nextRank.roleName.toLowerCase());

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
                const logChannel = await interaction.guild.channels.fetch(logChannelId);
                if (logChannel && logChannel.isTextBased()) {
                    const staffRole = interaction.guild.roles.cache.find((r: any) => r.name.toLowerCase() === 'staff');
                    const pingText = staffRole ? `<@&${staffRole.id}>` : '@Staff';
                    await logChannel.send({ content: pingText, embeds: [successEmbed] });
                }
            } catch (err) {
                client.logger.error('Failed to send promotion log to defined channel:', err);
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
