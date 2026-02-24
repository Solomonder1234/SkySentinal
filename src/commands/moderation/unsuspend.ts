import { Command } from '../../lib/structures/Command';
import { ApplicationCommandOptionType, ApplicationCommandType, Message, ChatInputCommandInteraction } from 'discord.js';
import { EmbedUtils } from '../../utils/EmbedUtils';

export default {
    name: 'unsuspend',
    description: 'Unsuspends a staff member, restoring their original prefix and staff roles.',
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: 'user',
            description: 'The staff member to unsuspend.',
            type: ApplicationCommandOptionType.User,
            required: true,
        },
        {
            name: 'reason',
            description: 'The reason for unsuspension.',
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

            const hosRole = guildRoles.find((r: any) => r.name.toLowerCase() === 'head of staff' || r.name.toLowerCase() === 'hos');

            if (memberRoles.cache && memberRoles.cache.some((r: any) => r.permissions && r.permissions.has('Administrator'))) {
                hasPermission = true;
            }

            if (hosRole && memberRoles.highest && memberRoles.highest.position >= hosRole.position) {
                hasPermission = true;
            }

            if (memberRoles.cache && memberRoles.cache.some((r: any) => ['founder', 'head of staff', 'hos', 'senior admin', 'sr. admin', 'admin'].includes(r.name.toLowerCase()))) {
                hasPermission = true;
            }
        }

        if (!hasPermission) {
            const errorEmbed = EmbedUtils.error('Access Denied', 'This command is restricted to high-ranking Administrators and Founders.');
            if (interaction instanceof Message) {
                return interaction.reply({ embeds: [errorEmbed] });
            } else {
                return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
        }

        let user;
        let reason = 'No reason provided.';

        if (interaction instanceof Message) {
            const args = interaction.content.split(' ').slice(1);
            if (interaction.mentions.users.size > 0) {
                user = interaction.mentions.users.first();
                args.shift();
                if (args.length > 0) reason = args.join(' ');
            } else if (args[0]) {
                try { user = await client.users.fetch(args[0]); } catch (e) { }
                args.shift();
                if (args.length > 0) reason = args.join(' ');
            }
        } else {
            const chatInteraction = interaction as ChatInputCommandInteraction;
            user = chatInteraction.options.getUser('user', true);
            const r = chatInteraction.options.getString('reason');
            if (r) reason = r;
        }

        if (!user) {
            return interaction.reply({ content: 'Please mention a valid user or provide a valid user ID.' });
        }

        const guild = interaction.guild;
        if (!guild) return;

        try {
            const targetMember = await guild.members.fetch(user.id);
            const suspendRoleId = '1373474789653741649';

            // 1. Find active suspension in database
            const activeSuspension = await client.database.prisma.suspension.findFirst({
                where: {
                    guildId: guild.id,
                    userId: user.id,
                    active: true
                },
                orderBy: {
                    suspendedAt: 'desc'
                }
            });

            if (!activeSuspension) {
                const noSuspensionEmbed = EmbedUtils.error('Not Suspended', `<@${user.id}> does not have an active suspension on record.`);
                if (interaction instanceof Message) {
                    return interaction.reply({ embeds: [noSuspensionEmbed] });
                } else {
                    return interaction.reply({ embeds: [noSuspensionEmbed], ephemeral: true });
                }
            }

            // 2. Restore Roles
            const rolesToRestore = JSON.parse(activeSuspension.roles);
            if (rolesToRestore && rolesToRestore.length > 0) {
                // Filter out invalid roles to prevent crashes
                const validRoles = rolesToRestore.filter((id: string) => guild.roles.cache.has(id));
                if (validRoles.length > 0) {
                    await targetMember.roles.add(validRoles);
                }
            }

            // 3. Remove Suspended Role
            await targetMember.roles.remove(suspendRoleId);

            // 4. Restore Nickname (if they haven't manually changed it significantly)
            const currentName = targetMember.displayName;
            if (currentName.includes('[S]')) {
                // Restore to original name saved in DB
                await targetMember.setNickname(activeSuspension.originalName.substring(0, 32));
            }

            // 5. Mark suspension as inactive
            await client.database.prisma.suspension.update({
                where: { id: activeSuspension.id },
                data: { active: false }
            });

            const successEmbed = EmbedUtils.success(
                'Staff Member Unsuspended',
                `<@${user.id}> has been officially unsuspended.\n\n**Case ID:** #${activeSuspension.id} Resolved\n**Action Details:**\n- Suspended role removed.\n- Original staff roles restored.\n- Prefix restored to \`${activeSuspension.originalName}\`.\n- Reason: ${reason}`
            );

            if (interaction instanceof Message) {
                await interaction.reply({ embeds: [successEmbed] });
            } else {
                await interaction.reply({ embeds: [successEmbed] });
            }

            // Try to DM the user
            try {
                const dmEmbed = EmbedUtils.success(
                    'Staff Unsuspension Notice',
                    `Your suspension in **${guild.name}** has been lifted.\n\n**Reason:** ${reason}\n\nYour original roles and prefix have been restored. Welcome back.`
                );
                await user.send({ embeds: [dmEmbed] });
            } catch (e) {
                // Ignore DM failure
            }

        } catch (error) {
            client.logger.error('Error in unsuspend command:', error);
            const errorEmbed = EmbedUtils.error('Update Failed', 'An error occurred while trying to unsuspend this user. They may have left the server, or I lack Manage Roles/Nicknames permissions.');
            if (interaction instanceof Message) {
                return interaction.reply({ embeds: [errorEmbed] });
            } else {
                return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
        }
    }
} as Command;
