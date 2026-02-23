import { Command } from '../../lib/structures/Command';
import { ApplicationCommandType, Message, ChatInputCommandInteraction } from 'discord.js';
import { EmbedUtils } from '../../utils/EmbedUtils';

export default {
    name: 'stats',
    description: 'Get bot statistics.',
    type: ApplicationCommandType.ChatInput,
    run: async (client, interaction) => {
        const embed = EmbedUtils.info('Statistics', 'Live technical metrics and operations summary.')
            .addFields(
                { name: 'Servers', value: `\`${client.guilds.cache.size}\``, inline: true },
                { name: 'Users', value: `\`${client.users.cache.size}\``, inline: true },
                { name: 'Channels', value: `\`${client.channels.cache.size}\``, inline: true },
                { name: 'Commands', value: `\`${client.commands.size}\``, inline: true }
            )
            .setFooter({ text: 'SkySentinel Supreme • Live Metrics' });

        if (interaction instanceof Message) {
            await interaction.reply({ embeds: [embed] });
        } else {
            await interaction.reply({ embeds: [embed] });
        }
    },
} as Command;
