import { Command } from '../../lib/structures/Command';
import { ApplicationCommandOptionType, ApplicationCommandType, PermissionFlagsBits, Message, ChatInputCommandInteraction, GuildMember } from 'discord.js';
import { EmbedUtils } from '../../utils/EmbedUtils';

export default {
    name: 'ban',
    description: 'Bans a user from the server.',
    type: ApplicationCommandType.ChatInput,
    defaultMemberPermissions: PermissionFlagsBits.BanMembers,
    options: [
        {
            name: 'user',
            description: 'The user to ban.',
            type: ApplicationCommandOptionType.User,
            required: true,
        },
        {
            name: 'reason',
            description: 'The reason for the ban.',
            type: ApplicationCommandOptionType.String,
            required: false,
        },
    ],
    run: async (client, interaction) => {
        let user;
        let reason = 'No reason provided';
        let member;

        if (interaction instanceof Message) {
            const args = interaction.content.split(' ').slice(1);
            const userId = args[0]?.replace(/[<@!>]/g, '');
            if (!userId) return interaction.reply({ content: 'Please provide a user to ban.' });

            try {
                user = await client.users.fetch(userId);
                member = await interaction.guild?.members.fetch(userId);
                reason = args.slice(1).join(' ') || reason;
            } catch (e) {
                return interaction.reply({ content: 'User not found.' });
            }
        } else {
            const chatInteraction = interaction as ChatInputCommandInteraction;
            user = chatInteraction.options.getUser('user', true);
            member = chatInteraction.options.getMember('user');
            reason = chatInteraction.options.getString('reason') || reason;
        }

        if (!member) {
            // Try to find if user is cached or fetch if straightforward, but usually command options handle this for slash.
            // For message, we tried fetching above.
            // If member is not bannable (e.g. superior role), catch error below.
        }

        if (member instanceof GuildMember && !member.bannable) {
            const errorEmbed = EmbedUtils.error('Ban Failed', 'I cannot ban this user. They may have a higher role than me.');
            if (interaction instanceof Message) return interaction.reply({ embeds: [errorEmbed] });
            return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }

        try {
            await interaction.guild?.members.ban(user, { reason });
            const successEmbed = EmbedUtils.success('User Banned', `**${user.tag}** has been banned.\nReason: ${reason}`);

            if (interaction instanceof Message) {
                await interaction.reply({ embeds: [successEmbed] });
            } else {
                await interaction.reply({ embeds: [successEmbed] });
            }
        } catch (error) {
            client.logger.error(`Failed to ban user ${user.tag} (${user.id}):`, error);
            const errorEmbed = EmbedUtils.error('Ban Failed', 'An error occurred while trying to ban the user.');
            if (interaction instanceof Message) {
                await interaction.reply({ embeds: [errorEmbed] });
            } else {
                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
        }
    },
} as Command;
