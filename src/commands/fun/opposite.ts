import { Command } from '../../lib/structures/Command';
import { ApplicationCommandOptionType, ApplicationCommandType, PermissionFlagsBits, Message, ChatInputCommandInteraction } from 'discord.js';
import { EmbedUtils } from '../../utils/EmbedUtils';

export default {
    name: 'opposite',
    description: 'Replies with the semantic opposite of your message.',
    category: 'Fun',
    type: ApplicationCommandType.ChatInput,
    defaultMemberPermissions: PermissionFlagsBits.SendMessages,
    options: [
        {
            name: 'message',
            description: 'The message to find the opposite of.',
            type: ApplicationCommandOptionType.String,
            required: true,
        }
    ],
    run: async (client, interaction) => {
        let input: string;

        if (interaction instanceof Message) {
            input = interaction.content.split(' ').slice(1).join(' ');
            if (!input) return interaction.reply({ content: '❌ Please provide a message to find the opposite of!' });
        } else {
            const chatInteraction = interaction as ChatInputCommandInteraction;
            input = chatInteraction.options.getString('message', true);
            await chatInteraction.deferReply();
        }

        if (!client.ai) {
            return interaction.reply({ content: '❌ The AI Service is currently unavailable. Please contact an administrator.', ephemeral: true });
        }

        try {
            const prompt = `Reply with ONLY the exact opposite meaning of the following text, keeping the tone similar but the semantic meaning reversed. Do not add any preamble or explanations. Just the opposite text.\n\nText: "${input}"`;

            const response = await client.ai.generateResponse(prompt);

            const embed = EmbedUtils.info('🔄 Semantic Opposite', `**Original:** ${input}\n**Opposite:** ${response.text}`);

            if (interaction instanceof Message) {
                await interaction.reply({ embeds: [embed] });
            } else {
                await (interaction as ChatInputCommandInteraction).editReply({ embeds: [embed] });
            }
        } catch (error) {
            client.logger.error('[OppositeCommand] Error generating response:', error);
            const errorContent = '❌ Failed to generate an opposite response. Please try again later.';
            if (interaction instanceof Message) {
                await interaction.reply({ content: errorContent });
            } else {
                await (interaction as ChatInputCommandInteraction).editReply({ content: errorContent });
            }
        }
    },
} as Command;
