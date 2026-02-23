import { Command } from '../../lib/structures/Command';
import { ApplicationCommandType, ApplicationCommandOptionType, EmbedBuilder, ChatInputCommandInteraction, Message } from 'discord.js';
import { EmbedUtils } from '../../utils/EmbedUtils';
import { OWNER_IDS } from '../../config';

import { CommandHandler } from '../../lib/handlers/CommandHandler';

export default {
    name: 'reload',
    description: 'Reload bot commands.',
    category: 'Owner',
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: 'target',
            description: 'What to reload (commands/events/all).',
            type: ApplicationCommandOptionType.String,
            required: false,
            choices: [
                { name: 'Commands', value: 'commands' },
                { name: 'Events', value: 'events' },
                { name: 'All', value: 'all' }
            ]
        }
    ],
    run: async (client, interaction) => {
        const user = (interaction instanceof Message) ? interaction.author : interaction.user;
        if (!OWNER_IDS.includes(user.id)) return;

        let target = 'all';
        if (interaction instanceof Message) {
            target = interaction.content.split(' ').slice(1)[0] || 'all';
        } else {
            target = (interaction as ChatInputCommandInteraction).options.getString('target') || 'all';
        }

        try {
            if (target === 'commands' || target === 'all') {
                client.commands.clear();
                await client.commandHandler.load();
            }

            if (target === 'events' || target === 'all') {
                client.removeAllListeners();
                await client.eventHandler.load();
            }

            const embed = EmbedUtils.success('System Reload', `Successfully reloaded database and core logic for **${target}**.`)
                .setFooter({ text: 'SkySentinel AV • System Maintenance' });

            return interaction.reply({ embeds: [embed] });
        } catch (error: any) {
            const embed = EmbedUtils.error('Reload Failed', `System reload interrupted.\n\n\`\`\`ts\n${error.message}\n\`\`\``)
                .setFooter({ text: 'SkySentinel AV • Recovery Mode' });

            return interaction.reply({ embeds: [embed] });
        }
    },
} as Command;
