import { Command } from '../../lib/structures/Command';
import { ApplicationCommandOptionType, ApplicationCommandType, PermissionFlagsBits, Message, ChatInputCommandInteraction } from 'discord.js';
import { EmbedUtils } from '../../utils/EmbedUtils';

export default {
    name: 'toggleaimod',
    description: 'Toggle AI toxicity detection for this server.',
    category: 'Configuration',
    type: ApplicationCommandType.ChatInput,
    defaultMemberPermissions: PermissionFlagsBits.Administrator,
    options: [
        {
            name: 'enabled',
            description: 'Whether AI Moderation should be enabled.',
            type: ApplicationCommandOptionType.Boolean,
            required: true,
        }
    ],
    run: async (client, interaction) => {
        const guildId = interaction.guildId!;
        let enabled: boolean;

        if (interaction instanceof Message) {
            const args = interaction.content.split(' ').slice(1);
            enabled = args[0]?.toLowerCase() === 'on' || args[0]?.toLowerCase() === 'true';
        } else {
            const chatInteraction = interaction as ChatInputCommandInteraction;
            enabled = chatInteraction.options.getBoolean('enabled')!;
        }

        await client.database.prisma.guildConfig.upsert({
            where: { id: guildId },
            create: { id: guildId, aiModeration: enabled },
            update: { aiModeration: enabled }
        });

        const embed = EmbedUtils.success(
            'AI Moderation Updated',
            `AI Toxicity detection has been **${enabled ? 'enabled' : 'disabled'}** for this server.`
        );

        await interaction.reply({ embeds: [embed] });
    },
} as Command;
