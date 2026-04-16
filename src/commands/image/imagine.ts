import { Command } from '../../lib/structures/Command';
import { ApplicationCommandOptionType, ApplicationCommandType, Message, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { EmbedUtils } from '../../utils/EmbedUtils';

export default {
    name: 'imagine',
    description: 'Generate an AI image using DALL-E 3.',
    category: 'Fun',
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: 'prompt',
            description: 'The description of the image you want to create.',
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

        // Defer because DALL-E takes 10-15 seconds
        if (!(interaction instanceof Message)) {
            await interaction.deferReply();
        } else {
            await interaction.reply({ embeds: [EmbedUtils.info('Generating...', 'I am painting your masterpiece. This usually takes 10-15 seconds. 🎨')] });
        }

        try {
            const imageUrl = await client.ai.generateImage(prompt);

            if (imageUrl.startsWith('http')) {
                const embed = new EmbedBuilder()
                    .setTitle('AI Generated Artwork')
                    .setDescription(`**Prompt:** ${prompt}`)
                    .setImage(imageUrl)
                    .setColor('#6A0DAD')
                    .setFooter({ text: `Requested by ${interaction.member?.user.username} | Powered by DALL-E 3` })
                    .setTimestamp();

                if (interaction instanceof Message) {
                    await (interaction.channel as any).send({ embeds: [embed] });
                } else {
                    await interaction.editReply({ embeds: [embed] });
                }
            } else {
                // Return error from the service
                if (interaction instanceof Message) {
                    await (interaction.channel as any).send(imageUrl);
                } else {
                    await interaction.editReply(imageUrl);
                }
            }
        } catch (error) {
            client.logger.error('[Imagine Command] Error:', error);
            const errorMsg = 'I could not generate that image. It might violate safety guidelines or the API is overloaded.';
            if (interaction instanceof Message) {
                await (interaction.channel as any).send(errorMsg);
            } else {
                await interaction.editReply(errorMsg);
            }
        }
    },
} as Command;
