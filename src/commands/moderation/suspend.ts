import { Command } from '../../lib/structures/Command';
import { ApplicationCommandOptionType, ApplicationCommandType, Message, ChatInputCommandInteraction } from 'discord.js';
import { EmbedUtils } from '../../utils/EmbedUtils';

export default {
    name: 'suspend',
    description: 'Suspends a staff member by granting them the suspended role and changing their prefix to [S].',
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: 'user',
            description: 'The staff member to suspend.',
            type: ApplicationCommandOptionType.User,
            required: true,
        },
        {
            name: 'reason',
            description: 'The reason for suspension.',
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

            // Find the Head of Staff role to get its baseline position
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

            // 1. Remove ALL existing roles (that we can remove)
            const rolesToRemove = targetMember.roles.cache.filter((r: any) =>
                r.id !== guild.id && // Don't remove @everyone
                r.id !== suspendRoleId && // Don't remove the role we're about to add
                !r.managed // Don't try to remove managed roles (like bot roles)
            );

            if (rolesToRemove.size > 0) {
                // We attempt to remove roles. We use try/catch in case some are above the bot's hierarchy.
                try {
                    await targetMember.roles.remove(rolesToRemove);
                } catch (e) {
                    client.logger.warn(`Failed to remove some roles from ${user.tag} (likely hierarchy issue):`, e);
                }
            }

            // 2. Assign Suspended Role
            await targetMember.roles.add(suspendRoleId);

            // 2. Change Nickname to [S] prefix
            const currentName = targetMember.displayName;
            let newName = currentName;

            // Strip existing prefix if any
            if (currentName.startsWith('[')) {
                newName = currentName.replace(/^\[.*?\]\s*/, '');
            }

            // Add [S] prefix
            newName = `[S] ${newName}`;

            // Discord name limit is 32
            await targetMember.setNickname(newName.substring(0, 32));

            // Save to database
            const moderatorId = interaction instanceof Message ? interaction.author.id : interaction.user.id;

            const suspensionRecord = await client.database.prisma.suspension.create({
                data: {
                    guildId: guild.id,
                    userId: user.id,
                    moderatorId: moderatorId,
                    reason: reason,
                    originalName: currentName,
                    roles: JSON.stringify(rolesToRemove.map((r: any) => r.id)),
                    active: true
                }
            });

            const successEmbed = EmbedUtils.success(
                'Staff Member Suspended',
                `<@${user.id}> has been officially suspended.\n\n**Case ID:** #${suspensionRecord.id}\n**Action Details:**\n- Role <@&${suspendRoleId}> granted.\n- Nickname updated to \`${newName.substring(0, 32)}\`.\n- Reason: ${reason}`
            );

            if (interaction instanceof Message) {
                await interaction.reply({ embeds: [successEmbed] });
            } else {
                await interaction.reply({ embeds: [successEmbed] });
            }

            // Try to DM the user
            try {
                const dmEmbed = EmbedUtils.error(
                    'Staff Suspension Notice',
                    `You have been suspended from your staff position in **${guild.name}**.\n\n**Reason:** ${reason}\n\nYour roles have been updated pending further administrative review.`
                );
                await user.send({ embeds: [dmEmbed] });
            } catch (e) {
                // Ignore DM failure
            }

        } catch (error) {
            client.logger.error('Error in suspend command:', error);
            const errorEmbed = EmbedUtils.error('Update Failed', 'An error occurred while trying to suspend this user. Please ensure my role is higher than theirs and I have Manage Nicknames + Manage Roles permissions.');
            if (interaction instanceof Message) {
                return interaction.reply({ embeds: [errorEmbed] });
            } else {
                return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
        }
    }
} as Command;
