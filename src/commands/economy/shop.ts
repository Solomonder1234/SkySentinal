import { Command } from '../../lib/structures/Command';
import { ApplicationCommandType } from 'discord.js';
import { EmbedUtils } from '../../utils/EmbedUtils';

export default {
    name: 'shop',
    description: 'View items available for purchase.',
    category: 'Economy',
    type: ApplicationCommandType.ChatInput,
    run: async (client, interaction) => {
        if (!interaction.guildId) return interaction.reply({ content: 'This command can only be used in a server.' });

        // Seed shop if empty (lazy init)
        await client.economy.seedShop(interaction.guildId);

        const items = await client.economy.getShopItems(interaction.guildId);

        if (items.length === 0) {
            return interaction.reply({
                embeds: [EmbedUtils.info('Shop', 'The shop is currently empty.')]
            });
        }

        const embed = EmbedUtils.info('🛒 Server Shop', 'Use `/buy <item>` to purchase.');

        items.forEach(item => {
            embed.addFields({
                name: `${item.name} — $${item.price.toLocaleString()}`,
                value: item.description || 'No description.',
                inline: false
            });
        });

        return interaction.reply({ embeds: [embed] });
    },
} as Command;
