import { Command } from '../../lib/structures/Command';
import { ApplicationCommandOptionType, ApplicationCommandType, Message, ChatInputCommandInteraction, PermissionFlagsBits } from 'discord.js';
import { EmbedUtils } from '../../utils/EmbedUtils';

export default {
    name: 'demote',
    description: 'Demotes a user to a specific staff rank and updates their nickname prefix.',
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: 'user',
            description: 'The user to demote.',
            type: ApplicationCommandOptionType.User,
            required: true,
        },
        {
            name: 'role',
            description: 'The target role to demote them to.',
            type: ApplicationCommandOptionType.Role,
            required: true,
        },
        {
            name: 'reason',
            description: 'The reason for demotion.',
            type: ApplicationCommandOptionType.String,
            required: false,
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
            const hosRole = guildRoles.find(r => r.name.toLowerCase() === 'head of staff' || r.name.toLowerCase() === 'hos');

            if (memberRoles.cache && memberRoles.cache.some((r: any) => r.permissions && r.permissions.has(PermissionFlagsBits.Administrator))) {
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
            return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }

        let user;
        let targetRole;
        let reason = 'No reason provided';

        if (interaction instanceof Message) {
            const args = interaction.content.split(' ').slice(1);
            if (interaction.mentions.users.size > 0) {
                user = interaction.mentions.users.first();
            } else if (args[0]) {
                try { user = await client.users.fetch(args[0]); } catch (e) { }
            }

            if (interaction.mentions.roles.size > 0) {
                targetRole = interaction.mentions.roles.first();
            } else if (args[1]) {
                try { targetRole = await interaction.guild?.roles.fetch(args[1]); } catch (e) { }
            }

            if (args.length > 2) {
                reason = args.slice(2).join(' ');
            }
        } else {
            const chatInteraction = interaction as ChatInputCommandInteraction;
            user = chatInteraction.options.getUser('user', true);
            targetRole = chatInteraction.options.getRole('role', true) as any;
            reason = chatInteraction.options.getString('reason') || 'No reason provided';
        }

        if (!user || !targetRole) {
            const usage = 'Usage: `!demote @user @role [reason]`';
            if (interaction instanceof Message) {
                return interaction.reply(usage);
            } else {
                return interaction.reply({ content: usage, ephemeral: true });
            }
        }

        const guild = interaction.guild;
        if (!guild) return;

        try {
            const targetMember = await guild.members.fetch(user.id);

            // Define the hierarchical rank list
            const rankHierarchy = [
                { roleName: 'Trial Staff', prefix: 'TS' },
                { roleName: 'Moderator', prefix: 'MOD' },
                { roleName: 'Sr. Moderator', prefix: 'SRM' },
                { roleName: 'Admin', prefix: 'A' },
                { roleName: 'Sr. Admin', prefix: 'SRA' },
                { roleName: 'Head of Staff', prefix: 'HOS' }
            ];

            // 1. Identify Target Rank Definition
            const targetRankDef = rankHierarchy.find(r => r.roleName.toLowerCase() === targetRole.name.toLowerCase());

            // 2. Clear ALL existing staff roles from hierarchy (Derank)
            const rolesToRemove = [];
            for (const rank of rankHierarchy) {
                const role = guild.roles.cache.find(r => r.name.toLowerCase() === rank.roleName.toLowerCase());
                if (role && targetMember.roles.cache.has(role.id)) {
                    rolesToRemove.push(role.id);
                }
            }

            if (rolesToRemove.length > 0) {
                await targetMember.roles.remove(rolesToRemove);
            }

            // 3. Add the New Role
            await targetMember.roles.add(targetRole.id);

            // 4. Update Nickname Prefix
            const currentNickname = targetMember.nickname || targetMember.user.username;
            let baseName = currentNickname.replace(/^\[.*?\]\s*|\{.*?\}\s*|\|.*?\|\s*/g, '').trim();

            let newNickname = baseName;
            if (targetRankDef) {
                newNickname = `[${targetRankDef.prefix}] ${baseName}`.substring(0, 32);
            }

            try {
                if (targetMember.nickname !== newNickname) {
                    await targetMember.setNickname(newNickname);
                }
            } catch (err) {
                client.logger.warn(`Could not set nickname for ${user.tag}, lack of hierarchy permissions.`);
            }

            const successEmbed = EmbedUtils.success(
                'Staff Demotion Authorized',
                `<@${user.id}> has been demoted to **${targetRole.name}**.\n\n**Reason:** ${reason}`
            );

            // Log to staff-logs
            try {
                const logChannelId = '1473466436449210511';
                const logChannel = await guild.channels.fetch(logChannelId);
                if (logChannel && logChannel.isTextBased()) {
                    await logChannel.send({ embeds: [successEmbed] });
                }
            } catch (err) {
                client.logger.error('Failed to send demotion log:', err);
            }

            return interaction.reply({ embeds: [successEmbed] });

        } catch (error) {
            client.logger.error('Demotion error:', error);
            return interaction.reply({
                embeds: [EmbedUtils.error('Error', 'An error occurred while attempting to demote the user.')],
                ephemeral: true
            });
        }
    },
} as Command;
