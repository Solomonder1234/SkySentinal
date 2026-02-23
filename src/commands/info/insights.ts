import { Command } from '../../lib/structures/Command';
import { ApplicationCommandType, PermissionFlagsBits, TextChannel, Message } from 'discord.js';
import { SkyClient } from '../../lib/structures/SkyClient';
import { EmbedUtils } from '../../utils/EmbedUtils';

export default {
    name: 'insights',
    description: 'Get an AI-generated summary of recent server activity and vibe.',
    category: 'Info',
    type: ApplicationCommandType.ChatInput,
    defaultMemberPermissions: PermissionFlagsBits.ManageMessages,
    run: async (client, interaction) => {
        const aiService = (client as SkyClient).ai;
        if (!aiService) return interaction.reply('AI services are currently disabled. Please contact the bot owner.');

        await interaction.reply({ content: '📊 Analyzing server pulse... this may take a moment.' });

        try {
            const channel = interaction.channel as TextChannel;
            const messages = await channel.messages.fetch({ limit: 50 });

            const context = messages
                .filter(m => !m.author.bot)
                .map(m => `${m.author.username}: ${m.content}`)
                .reverse()
                .join('\n');

            if (!context) {
                return (interaction as any).editReply('I couldn\'t find enough recent activity to analyze.');
            }

            const prompt = `You are SkySentinel's data analyst. Analyze the following recent chat history and provide a concise, professional report on:
1. The general vibe/tone of the conversation.
2. The main topics being discussed.
3. Any notable activity or potential issues.
Keep it under 1024 characters.

Chat History:
${context}`;

            const response = await aiService.generateResponse(prompt);

            const embed = EmbedUtils.premium('SkySentinel Server Insights', 'Advanced AI-driven analysis of recent atmospheric data.')
                .setThumbnail(interaction.guild?.iconURL() || null)
                .setDescription(response.text)
                .setFooter({ text: 'Powered by SkySentinel AI • Last 50 messages analyzed' });

            return (interaction as any).editReply({ content: null, embeds: [embed] });
        } catch (err: any) {
            console.error('[Insights] Error:', err);
            return (interaction as any).editReply(`❌ Failed to generate insights: ${err.message}`);
        }
    },
} as Command;
