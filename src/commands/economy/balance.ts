import { Command } from '../../lib/structures/Command';
import { ApplicationCommandOptionType, ApplicationCommandType, Message, ChatInputCommandInteraction } from 'discord.js';
import { EmbedUtils } from '../../utils/EmbedUtils';

export default {
    name: 'balance',
    description: 'Check your wallet and bank balance.',
    category: 'Economy',
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: 'user',
            description: 'User to check balance for (optional).',
            type: ApplicationCommandOptionType.User,
            required: false
        }
    ],
    run: async (client, interaction) => {
        let targetUser = interaction instanceof Message ? interaction.author : interaction.user;

        if (interaction instanceof Message) {
            const args = interaction.content.split(' ').slice(1);
            if (interaction.mentions.users.size > 0) {
                targetUser = interaction.mentions.users.first()!;
            }
        } else {
            const userOption = (interaction as ChatInputCommandInteraction).options.getUser('user');
            if (userOption) targetUser = userOption;
        }

        const balance = await client.economy.getBalance(targetUser.id);

        const embed = EmbedUtils.info(
            `💰 Balance: ${targetUser.username}`,
            `**Wallet**: $${balance.wallet.toLocaleString()}\n**Bank**: $${balance.bank.toLocaleString()}\n**Total**: $${(balance.wallet + balance.bank).toLocaleString()}`
        );

        return interaction.reply({ embeds: [embed] });
    },
} as Command;
