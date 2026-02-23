import { Command } from '../../lib/structures/Command';
import { ApplicationCommandType, Message, EmbedBuilder } from 'discord.js';
import axios from 'axios';
import { EmbedUtils } from '../../utils/EmbedUtils';

export default {
    name: 'meme',
    description: 'Get a random meme from Reddit.',
    category: 'Fun',
    type: ApplicationCommandType.ChatInput,
    run: async (client, interaction) => {
        try {
            if (interaction instanceof Message) await (interaction.channel as any).sendTyping();
            else await interaction.deferReply();

            const response = await axios.get('https://meme-api.com/gimme');
            const data = response.data;

            const embed = EmbedUtils.info(data.title, `Fresh from **r/${data.subreddit}**`)
                .setURL(data.postLink)
                .setImage(data.url)
                .setFooter({ text: `r/${data.subreddit} | 👍 ${data.ups} • SkySentinel Supreme Edition` });

            if (interaction instanceof Message) {
                await interaction.reply({ embeds: [embed] });
            } else {
                await interaction.editReply({ embeds: [embed] });
            }
        } catch (error) {
            console.error('Meme Command Error:', error);
            const msg = 'Failed to fetch a meme. Try again later!';
            if (interaction instanceof Message) await interaction.reply(msg);
            else await interaction.editReply(msg);
        }
    },
} as Command;
