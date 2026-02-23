import { Command } from '../../lib/structures/Command';
import { ApplicationCommandOptionType, ApplicationCommandType, PermissionFlagsBits, Message, ChatInputCommandInteraction, TextChannel } from 'discord.js';
import { EmbedUtils } from '../../utils/EmbedUtils';

export default {
    name: 'say',
    description: 'Make the bot say something.',
    category: 'Troll',
    type: ApplicationCommandType.ChatInput,
    defaultMemberPermissions: PermissionFlagsBits.Administrator,
    options: [
        {
            name: 'message',
            description: 'The message to say.',
            type: ApplicationCommandOptionType.String,
            required: true,
        },
    ],
    run: async (client, interaction) => {
        let messageContent: string;

        if (interaction instanceof Message) {
            messageContent = interaction.content.split(' ').slice(1).join(' ');
            if (!messageContent) return interaction.reply({ content: 'Please provide a message.' });

            await interaction.delete().catch(() => { });
            if (interaction.channel && interaction.channel.isTextBased()) {
                await (interaction.channel as TextChannel).send(messageContent);
            }
        } else {
            const chatInteraction = interaction as ChatInputCommandInteraction;
            messageContent = chatInteraction.options.getString('message', true);

            await chatInteraction.reply({ content: 'Sent!', ephemeral: true });
            if (interaction.channel && interaction.channel.isTextBased()) {
                await (interaction.channel as TextChannel).send(messageContent);
            }
        }
    },
} as Command;
