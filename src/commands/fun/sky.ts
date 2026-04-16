import { Command } from '../../lib/structures/Command';
import { ApplicationCommandOptionType, ApplicationCommandType, Message, ChatInputCommandInteraction } from 'discord.js';
import { EmbedUtils } from '../../utils/EmbedUtils';

export default {
    name: 'sky',
    description: 'Chat with the SkySentinel AI core.',
    category: 'Fun',
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: 'prompt',
            description: 'What would you like to ask SkySentinel?',
            type: ApplicationCommandOptionType.String,
            required: true,
        },
    ],
    run: async (client, interaction) => {
        const prompt = interaction instanceof Message 
            ? interaction.content.split(' ').slice(1).join(' ') 
            : (interaction as ChatInputCommandInteraction).options.getString('prompt', true);

        if (!prompt) return interaction.reply({ content: 'Please provide a prompt!' });

        if (!client.ai) {
            return interaction.reply({ content: 'The AI core is currently offline or not configured.' });
        }

        // Defer if slash command
        if (!(interaction instanceof Message)) {
            await interaction.deferReply();
        } else if (interaction.channel?.isTextBased()) {
            // Typing indicator for prefix commands
            await (interaction.channel as any).sendTyping();
        }

        try {
            const systemPrompt = `You are SkySentinel, the advanced artificial intelligence guarding the SkyAlert Network. 
            You are helpful, professional, and slightly futuristic. 
            User: ${interaction.member?.user.username}
            Server: ${interaction.guild?.name}`;

            const fullPrompt = `${systemPrompt}\n\nUser Question: ${prompt}`;
            const result = await client.ai.generateResponse(fullPrompt);

            // Handle function calls if any (Staff actions or Weather)
            if (result.functionCalls) {
                // For now, let the AI service handle the tool execution internally as it does for weather.
                // If there are manual staff tools, we'd handle them here.
            }

            const response = result.text;

            if (interaction instanceof Message) {
                await interaction.reply({ content: response });
            } else {
                await interaction.editReply({ content: response });
            }
        } catch (error) {
            client.logger.error('[AI Command] Error:', error);
            const errorMsg = 'I encountered a glitch while processing that request. 😵‍💫';
            if (interaction instanceof Message) {
                await interaction.reply(errorMsg);
            } else {
                await interaction.editReply(errorMsg);
            }
        }
    },
} as Command;
