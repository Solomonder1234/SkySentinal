import { Command } from '../../lib/structures/Command';
import { ApplicationCommandOptionType, ApplicationCommandType, ChatInputCommandInteraction, Message } from 'discord.js';
import { SkyClient } from '../../lib/structures/SkyClient';
import { EmbedUtils } from '../../utils/EmbedUtils';

export default {
    name: 'generate',
    description: 'Generate an image using AI (OpenAI DALL-E).',
    category: 'Image',
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: 'prompt',
            description: 'The description of the image you want to generate.',
            type: ApplicationCommandOptionType.String,
            required: true,
        }
    ],
    run: async (client, interaction) => {
        let prompt: string;
        if (interaction instanceof Message) {
            prompt = interaction.content.split(' ').slice(1).join(' ');
        } else {
            prompt = (interaction as ChatInputCommandInteraction).options.getString('prompt', true);
        }

        if (!prompt) return interaction.reply('Please provide a prompt for the image.');

        const aiService = (client as SkyClient).ai;
        if (!aiService) return interaction.reply('AI services are currently disabled. Please contact the bot owner.');

        await interaction.reply({ content: `🎨 Sketching it out... **"${prompt}"**` });

        try {
            const imageUrl = await aiService.generateImage(prompt);

            if (imageUrl.startsWith('http')) {
                const embed = EmbedUtils.premium('SkySentinel Art Generation', `**Prompt:** ${prompt}`)
                    .setImage(imageUrl)
                    .setFooter({ text: `Generated for ${interaction.member?.user.username} • SkySentinel AV Art` });

                return (interaction as any).editReply({ content: null, embeds: [embed] });
            } else {
                return (interaction as any).editReply({ content: imageUrl });
            }
        } catch (err: any) {
            console.error('[Generate] Error:', err);
            return (interaction as any).editReply(`❌ Image generation failed: ${err.message}`);
        }
    },
} as Command;
