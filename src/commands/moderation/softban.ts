import { Command } from '../../lib/structures/Command';
import { ApplicationCommandOptionType, ApplicationCommandType, PermissionFlagsBits, Message, ChatInputCommandInteraction, GuildMember } from 'discord.js';
import { EmbedUtils } from '../../utils/EmbedUtils';

export default {
    name: 'softban',
    description: 'Softban a user (ban and unban to clear messages).',
    type: ApplicationCommandType.ChatInput,
    defaultMemberPermissions: PermissionFlagsBits.BanMembers,
    options: [
        {
            name: 'user',
            description: 'The user to softban.',
            type: ApplicationCommandOptionType.User,
            required: true,
        },
        {
            name: 'reason',
            description: 'Reason for the softban.',
            type: ApplicationCommandOptionType.String,
            required: false,
        },
    ],
    run: async (client, interaction) => {
        let user;
        let member: GuildMember | undefined;
        let reason = 'No reason provided';

        if (interaction instanceof Message) {
            const args = interaction.content.split(' ').slice(1);
            const userId = args[0]?.replace(/[<@!>]/g, '');
            if (!userId) return interaction.reply({ content: 'Please provide a user.' });

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

        if (member && !member.bannable) {
            const errorEmbed = EmbedUtils.error('Softban Failed', 'I cannot ban this user. They may have a higher role than me.');
            if (interaction instanceof Message) return interaction.reply({ embeds: [errorEmbed] });
            return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }

        try {
            await interaction.guild?.members.ban(user, { reason: `Softban: ${reason}`, deleteMessageSeconds: 604800 }); // Delete 7 days
            await interaction.guild?.members.unban(user, 'Softban complete');

            const successEmbed = EmbedUtils.success('User Softbanned', `**${user.tag}** has been softbanned (messages deleted).\nReason: ${reason}`);

            if (interaction instanceof Message) {
                await interaction.reply({ embeds: [successEmbed] });
            } else {
                await interaction.reply({ embeds: [successEmbed] });
            }
        } catch (error) {
            client.logger.error(`Failed to softban user ${user.tag}:`, error);
            const errorEmbed = EmbedUtils.error('Softban Failed', 'An error occurred.');
            if (interaction instanceof Message) {
                await interaction.reply({ embeds: [errorEmbed] });
            } else {
                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
        }
    },
} as Command;
