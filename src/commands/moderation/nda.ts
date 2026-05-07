import { Command } from '../../lib/structures/Command';
import { ApplicationCommandType, PermissionFlagsBits, Message, ChatInputCommandInteraction, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from 'discord.js';
import { EmbedUtils } from '../../utils/EmbedUtils';

export default {
    name: 'nda',
    description: 'Administrative Vanguard Non-Disclosure Agreement',
    type: ApplicationCommandType.ChatInput,
    defaultMemberPermissions: PermissionFlagsBits.ManageGuild,
    run: async (client, interaction) => {
        const ndaEmbed = EmbedUtils.premium(
            'SkyAlert • Administrative Vanguard Agreement',
            `### ❖ Non-Disclosure & Operational Standards\n\nThis agreement outlines the professional standards and confidentiality requirements for all SkyAlert Network Staff members.\n\n**1. Confidentiality of Infrastructure**\nYou are strictly prohibited from disclosing Icecast mount points, NWR intercept arrays, or proprietary telemetry coordination methods to unauthorized entities.\n\n**2. Professional Conduct**\nStaff members must uphold the "Vanguard Standard." Public disparagement of the network or internal sabotage will result in immediate demotion.\n\n**3. Administrative Liability**\nUnauthorized leaks of internal documentation or staff chats will result in a Strike III (Permanent Removal) and possible legal action where applicable.\n\n**4. Acceptance**\nBy clicking the button below, you formally acknowledge and sign the SkySentinel Administrative Vanguard Agreement.`
        );

        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
                .setCustomId('nda_sign')
                .setLabel('Sign & Acknowledge Protocols')
                .setStyle(ButtonStyle.Success)
                .setEmoji('🖋️')
        );

        if (interaction instanceof Message) {
            await interaction.reply({ embeds: [ndaEmbed], components: [row as any] });
        } else {
            await interaction.reply({ embeds: [ndaEmbed], components: [row as any] });
        }
    },
} as Command;
