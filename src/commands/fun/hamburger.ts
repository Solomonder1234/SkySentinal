import { Command } from '../../lib/structures/Command';
import { ApplicationCommandType } from 'discord.js';
import { EmbedUtils } from '../../utils/EmbedUtils';

export default {
    name: 'hamburger',
    description: 'Here is a delicious hamburger!',
    type: ApplicationCommandType.ChatInput,
    prefixOnly: true,
    run: async (client, interaction) => {
        if ('reply' in interaction) {
            await interaction.reply({
                content: '🍔 **Hamburger Delivered! Enjoy your digital meal!**\n\nhttps://tenor.com/view/burger-cheeseburger-hamburger-bobs-burgers-food-gif-20534292'
            });
        }
    },
} as Command;
