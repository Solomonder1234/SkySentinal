import { Command } from '../../lib/structures/Command';
import { ApplicationCommandType, Message, ChatInputCommandInteraction, ApplicationCommandOptionType } from 'discord.js';
import { EmbedUtils } from '../../utils/EmbedUtils';

export default {
    name: 'inventory',
    description: 'View your inventory.',
    category: 'Economy',
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: 'user',
            description: 'User to check inventory for (optional).',
            type: ApplicationCommandOptionType.User,
            required: false
        }
    ],
    run: async (client, interaction) => {
        let targetUser = interaction instanceof Message ? interaction.author : interaction.user;

        if (interaction instanceof Message) {
            if (interaction.mentions.users.size > 0) {
                targetUser = interaction.mentions.users.first()!;
            }
        } else {
            const userOption = (interaction as ChatInputCommandInteraction).options.getUser('user');
            if (userOption) targetUser = userOption;
        }

        const inventory = await client.economy.getInventory(targetUser.id);

        if (inventory.length === 0) {
            return interaction.reply({
                embeds: [EmbedUtils.info('Inventory', `${targetUser.username} has no items.`)]
            });
        }

        // Group items
        const grouped: { [key: string]: number } = {};
        inventory.forEach(item => {
            grouped[item.name] = (grouped[item.name] || 0) + item.amount;
        });

        const embed = EmbedUtils.info(`📦 Inventory: ${targetUser.username}`, 'Owned Items');

        for (const [name, amount] of Object.entries(grouped)) {
            embed.addFields({ name: name, value: `Amount: **${amount}**`, inline: true });
        }

        return interaction.reply({ embeds: [embed] });
    },
} as Command;
