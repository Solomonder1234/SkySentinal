import { Command } from '../../lib/structures/Command';
import { ApplicationCommandOptionType, ApplicationCommandType, PermissionFlagsBits, Message, EmbedBuilder, ChatInputCommandInteraction, GuildMember } from 'discord.js';
import { EmbedUtils } from '../../utils/EmbedUtils';

export default {
    name: 'kick',
    description: 'Kicks a user from the server.',
    type: ApplicationCommandType.ChatInput,
    defaultMemberPermissions: PermissionFlagsBits.KickMembers,
    options: [
        {
            name: 'user',
            description: 'The user to kick.',
            type: ApplicationCommandOptionType.User,
            required: true,
        },
        {
            name: 'reason',
            description: 'The reason for the kick.',
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
            if (!userId) return interaction.reply({ content: 'Please provide a user to kick.' });

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
            member = interaction.guild?.members.cache.get(user.id);
            reason = chatInteraction.options.getString('reason') || reason;
        }

        if (!member) {
            return interaction.reply({ content: 'User is not in the server.', ephemeral: true });
        }

        if (member instanceof GuildMember && !member.kickable) {
            const errorEmbed = EmbedUtils.error('Kick Failed', 'I cannot kick this user. They may have a higher role than me.');
            if (interaction instanceof Message) return interaction.reply({ embeds: [errorEmbed] });
            return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }

        try {
            await member.kick(reason);
            const successEmbed = EmbedUtils.success('User Kicked', `**${user.tag}** has been kicked.\nReason: ${reason}`);

            if (interaction instanceof Message) {
                await interaction.reply({ embeds: [successEmbed] });
            } else {
                await interaction.reply({ embeds: [successEmbed] });
            }
        } catch (error) {
            client.logger.error(`Failed to kick user ${user.tag} (${user.id}):`, error);
            const errorEmbed = EmbedUtils.error('Kick Failed', 'An error occurred while trying to kick the user.');
            if (interaction instanceof Message) {
                await interaction.reply({ embeds: [errorEmbed] });
            } else {
                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
        }
    },
} as Command;
