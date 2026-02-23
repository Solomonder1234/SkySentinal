import { Command } from '../../lib/structures/Command';
import { ApplicationCommandOptionType, ApplicationCommandType, PermissionFlagsBits, Message, ChatInputCommandInteraction, TextChannel } from 'discord.js';
import { EmbedUtils } from '../../utils/EmbedUtils';

export default {
    name: 'purge',
    description: 'Delete a number of messages.',
    type: ApplicationCommandType.ChatInput,
    defaultMemberPermissions: PermissionFlagsBits.ManageMessages,
    options: [
        {
            name: 'amount',
            description: 'The number of messages to delete (1-100).',
            type: ApplicationCommandOptionType.Integer,
            required: true,
        },
    ],
    run: async (client, interaction) => {
        let amount;

        if (interaction instanceof Message) {
            const args = interaction.content.split(' ').slice(1);
            if (!args[0]) return interaction.reply({ content: 'Please provide an amount.' });
            amount = parseInt(args[0]);
        } else {
            const chatInteraction = interaction as ChatInputCommandInteraction;
            amount = chatInteraction.options.getInteger('amount', true);
        }

        if (isNaN(amount) || amount < 1 || amount > 100) {
            const errorEmbed = EmbedUtils.error('Invalid Amount', 'Please provide a number between 1 and 100.');
            if (interaction instanceof Message) return interaction.reply({ embeds: [errorEmbed] });
            return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }

        if (!interaction.channel || !interaction.channel.isTextBased()) return;

        try {
            const messages = await (interaction.channel as TextChannel).bulkDelete(amount, true);
            const successEmbed = EmbedUtils.success('Messages Purged', `Deleted **${messages.size}** messages.`);

            if (interaction instanceof Message) {
                const channel = interaction.channel as TextChannel;
                if (channel) {
                    const reply = await channel.send({ embeds: [successEmbed] });
                    setTimeout(() => reply.delete().catch(() => { }), 5000);
                }
            } else {
                await interaction.reply({ embeds: [successEmbed], ephemeral: true });
            }

        } catch (error) {
            client.logger.error(`Failed to purge messages in ${interaction.channel.id}:`, error);
            const errorEmbed = EmbedUtils.error('Purge Failed', 'An error occurred while deleting messages. Messages older than 14 days cannot be bulk deleted.');
            try {
                if (interaction instanceof Message) {
                    await interaction.reply({ embeds: [errorEmbed] });
                } else {
                    await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
                }
            } catch (e) {
                // Ignore reply errors if channel is gone
            }
        }
    },
} as Command;
