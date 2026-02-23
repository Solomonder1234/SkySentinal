import { Command } from '../../lib/structures/Command';
import { ApplicationCommandOptionType, ApplicationCommandType, PermissionFlagsBits, Message, ChatInputCommandInteraction, GuildMember, Role } from 'discord.js';
import { EmbedUtils } from '../../utils/EmbedUtils';

export default {
    name: 'addrole',
    description: 'Add a role to a user.',
    type: ApplicationCommandType.ChatInput,
    defaultMemberPermissions: PermissionFlagsBits.ManageRoles,
    options: [
        {
            name: 'user',
            description: 'The user to give the role to.',
            type: ApplicationCommandOptionType.User,
            required: true,
        },
        {
            name: 'role',
            description: 'The role to give.',
            type: ApplicationCommandOptionType.Role,
            required: true,
        },
        {
            name: 'reason',
            description: 'Reason for adding the role.',
            type: ApplicationCommandOptionType.String,
            required: false,
        },
    ],
    run: async (client, interaction) => {
        let user;
        let role: Role;
        let reason = 'No reason provided';
        let member: GuildMember | undefined;

        if (interaction instanceof Message) {
            const args = interaction.content.split(' ').slice(1);
            const userId = args[0]?.replace(/[<@!>]/g, '');
            const roleId = args[1]?.replace(/[<@&>]/g, '');

            if (!userId || !roleId) return interaction.reply({ content: 'Please provide a user and a role.' });

            try {
                user = await client.users.fetch(userId);
                member = await interaction.guild?.members.fetch(userId);
                role = interaction.guild?.roles.cache.get(roleId) as Role;
                reason = args.slice(2).join(' ') || reason;
            } catch (e) {
                return interaction.reply({ content: 'User or Role not found.' });
            }
        } else {
            const chatInteraction = interaction as ChatInputCommandInteraction;
            user = chatInteraction.options.getUser('user', true);
            member = interaction.guild?.members.cache.get(user.id);
            role = chatInteraction.options.getRole('role', true) as Role;
            reason = chatInteraction.options.getString('reason') || reason;
        }

        if (!member || !role) {
            const errorEmbed = EmbedUtils.error('Failed', 'Member or Role not found.');
            if (interaction instanceof Message) return interaction.reply({ embeds: [errorEmbed] });
            return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }

        try {
            if (interaction.guild?.members.me?.roles.highest.position! <= role.position) {
                const errorEmbed = EmbedUtils.error('Failed', 'I cannot add this role. It is higher than or equal to my highest role.');
                if (interaction instanceof Message) return interaction.reply({ embeds: [errorEmbed] });
                return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }

            await member.roles.add(role, reason);
            const successEmbed = EmbedUtils.success('Role Added', `Added **${role.name}** to **${user.tag}**.\nReason: ${reason}`);

            if (interaction instanceof Message) {
                await interaction.reply({ embeds: [successEmbed] });
            } else {
                await interaction.reply({ embeds: [successEmbed] });
            }

        } catch (error) {
            client.logger.error(`Failed to add role to ${user.tag}:`, error);
            const errorEmbed = EmbedUtils.error('Error', 'An error occurred while adding the role. Check my permissions hierarchy.');
            if (interaction instanceof Message) {
                await interaction.reply({ embeds: [errorEmbed] });
            } else {
                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
        }
    },
} as Command;
