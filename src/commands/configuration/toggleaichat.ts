import { Command } from '../../lib/structures/Command';
import { ApplicationCommandType, ApplicationCommandOptionType, PermissionsBitField, ChatInputCommandInteraction, Message } from 'discord.js';
import { EmbedUtils } from '../../utils/EmbedUtils';

export default {
    name: 'toggleaichat',
    description: 'Toggle global AI chat (respond to all messages in the server).',
    category: 'Configuration',
    type: ApplicationCommandType.ChatInput,
    userPermissions: [PermissionsBitField.Flags.ManageGuild],
    options: [
        {
            name: 'enabled',
            description: 'Enable or disable global AI chat.',
            type: ApplicationCommandOptionType.Boolean,
            required: true
        }
    ],
    run: async (client, interaction) => {
        if (!interaction.guildId) return;

        let enabled: boolean;

        if (interaction instanceof Message) {
            const args = interaction.content.split(' ').slice(1);
            if (!args.length) return interaction.reply({ content: 'Usage: `!toggleaichat <true/false>`' });

            const arg = (args[0] || '').toLowerCase();
            if (arg === 'true' || arg === 'on' || arg === 'enable') enabled = true;
            else if (arg === 'false' || arg === 'off' || arg === 'disable') enabled = false;
            else return interaction.reply({ content: 'Invalid argument. Use `true` or `false`.' });

        } else {
            enabled = (interaction as ChatInputCommandInteraction).options.getBoolean('enabled', true);
        }

        await client.database.prisma.guildConfig.upsert({
            where: { id: interaction.guildId },
            create: { id: interaction.guildId, aiGlobalChat: enabled },
            update: { aiGlobalChat: enabled }
        });

        return interaction.reply({
            embeds: [EmbedUtils.success('Configuration Updated', `Global AI Chat has been **${enabled ? 'ENABLED' : 'DISABLED'}**. ${enabled ? '\nThe bot will now reply to every message in this server!' : ''}`)]
        });
    },
} as Command;
