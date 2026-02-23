import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, Message } from 'discord.js';
import { Command } from '../../lib/structures/Command';
import { EmbedUtils } from '../../utils/EmbedUtils';

export default {
    name: 'susmode',
    description: 'Toggle the Imposter Protocol (Sus Mode)',
    category: 'Fun',
    permissions: [PermissionFlagsBits.Administrator],
    slashData: new SlashCommandBuilder()
        .setName('susmode')
        .setDescription('Toggle the Imposter Protocol (Sus Mode)')
        .addStringOption(option =>
            option.setName('state')
                .setDescription('Mode state')
                .setRequired(true)
                .addChoices(
                    { name: 'On', value: 'on' },
                    { name: 'Off', value: 'off' }
                ))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    run: async (client, interaction) => {
        let state: string | null = null;

        if (interaction instanceof ChatInputCommandInteraction) {
            state = interaction.options.getString('state', true);
        } else if (interaction instanceof Message) {
            const args = interaction.content.split(' ').slice(1);
            state = args[0]?.toLowerCase() || null;

            if (!state || !['on', 'off'].includes(state)) {
                return interaction.reply({ content: '⚠️ Please specify a state: `!susmode on` or `!susmode off`' });
            }
        }

        if (!state) return;

        const isActive = state === 'on';

        if (client.ai) {
            client.ai.setSusMode(isActive);
        }

        const embed = isActive
            ? EmbedUtils.premium('IMPOSTER PROTOCOL ACTIVATED', 'Emergency meeting starts now. SkySentinel is looking extremely sus. ඞ')
            : EmbedUtils.success('Protocol Disengaged', 'The imposters have been ejected. SkySentinel has returned to normal operations.');

        return interaction.reply({ embeds: [embed] });
    },
} as Command;
