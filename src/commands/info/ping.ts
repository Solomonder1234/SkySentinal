import { Command } from '../../lib/structures/Command';
import { ApplicationCommandType, Message } from 'discord.js';

export default {
    name: 'ping',
    description: 'Replies with Pong!',
    type: ApplicationCommandType.ChatInput,
    run: async (client, interaction) => {
        const content = `Pong! Latency: ${client.database ? 'DB Connected' : 'DB Error'} | WS: ${client.ws.ping}ms`;

        if (interaction instanceof Message) {
            await interaction.reply(content);
        } else {
            await interaction.reply({ content });
        }
    },
} as Command;
