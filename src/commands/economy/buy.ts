import { Command } from '../../lib/structures/Command';
import { ApplicationCommandType, ApplicationCommandOptionType, Message, ChatInputCommandInteraction } from 'discord.js';
import { EmbedUtils } from '../../utils/EmbedUtils';

export default {
    name: 'buy',
    description: 'Buy an item from the shop.',
    category: 'Economy',
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: 'item',
            description: 'Name of the item to buy.',
            type: ApplicationCommandOptionType.String,
            required: true
        }
    ],
    run: async (client, interaction) => {
        if (!interaction.guildId) return interaction.reply({ content: 'This command can only be used in a server.' });

        const user = interaction instanceof Message ? interaction.author : interaction.user;
        let itemName: string;

        if (interaction instanceof Message) {
            const args = interaction.content.split(' ').slice(1);
            if (!args.length) return interaction.reply({ content: 'Please specify an item to buy.' });
            itemName = args.join(' ');
        } else {
            itemName = (interaction as ChatInputCommandInteraction).options.getString('item', true);
        }

        const result = await client.economy.buyItem(user.id, interaction.guildId, itemName);

        if (result.success && result.item) {
            return interaction.reply({
                embeds: [EmbedUtils.success('Purchase Successful', `You bought **${result.item.name}** for **$${result.item.price.toLocaleString()}**! 🛍️`)]
            });
        } else {
            return interaction.reply({
                embeds: [EmbedUtils.error('Purchase Failed', result.message || 'Unknown error.')]
            });
        }
    },
} as Command;
