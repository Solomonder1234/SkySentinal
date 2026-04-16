import { Command } from '../../lib/structures/Command';
import { ApplicationCommandOptionType, ApplicationCommandType, ChatInputCommandInteraction, Message } from 'discord.js';
import { EmbedUtils } from '../../utils/EmbedUtils';

export default {
    name: 'analyze',
    description: 'Use SkySentinel Vision to analyze an image.',
    category: 'Fun',
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: 'image',
            description: 'The image to analyze (or URL).',
            type: ApplicationCommandOptionType.Attachment,
            required: true,
        },
    ],
    run: async (client, interaction) => {
        if (!client.ai) return interaction.reply('AI features are currently unavailable.');

        const attachment = interaction instanceof Message 
            ? interaction.attachments.first() 
            : (interaction as ChatInputCommandInteraction).options.getAttachment('image', true);

        if (!attachment) return interaction.reply('Please provide an image for analysis!');

        await interaction.deferReply();

        try {
            const results = await client.ai.analyzeImage(attachment.url);

            const resultEmbed = EmbedUtils.info(
                'SkySentinel Vision Analysis',
                `**Assessment:** ${results.safe ? '✅ Pass (General Safety)' : '❌ Fail (Potential Issue)'}\n\n**AI Reasoning:**\n${results.reason || 'Image processed successfully. No major anomalies detected.'}`
            ).setThumbnail(attachment.url);

            await interaction.editReply({ embeds: [resultEmbed] });
        } catch (error) {
            client.logger.error('[Analyze Command] Error:', error);
            await interaction.editReply('I encountered a synchronization error while processing that image data. 😵‍C💫');
        }
    },
} as Command;
