import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { Command } from '../../lib/structures/Command';
import { EmbedUtils } from '../../utils/EmbedUtils';

export default {
    name: 'color',
    description: 'Visualize a hex color and get detailed data.',
    category: 'Utility',
    slashData: new SlashCommandBuilder()
        .setName('color')
        .setDescription('Visualize a hex color and get detailed data.')
        .addStringOption(option =>
            option.setName('hex')
                .setDescription('Hex code (e.g. #FF0000)')
                .setRequired(true)),

    run: async (client, interaction) => {
        if (!(interaction instanceof ChatInputCommandInteraction)) return;

        let hex = interaction.options.getString('hex', true).replace('#', '');

        // Validate hex
        if (!/^[0-9A-F]{6}$/i.test(hex)) {
            return interaction.reply({
                embeds: [EmbedUtils.error('Invalid Hex', 'Please provide a valid 6-character hex code (e.g., #00BFFF).')],
                ephemeral: true
            });
        }

        // Conversions
        const r = parseInt(hex.slice(0, 2), 16);
        const g = parseInt(hex.slice(2, 4), 16);
        const b = parseInt(hex.slice(4, 6), 16);

        // RGB to HSL
        const rNorm = r / 255, gNorm = g / 255, bNorm = b / 255;
        const max = Math.max(rNorm, gNorm, bNorm), min = Math.min(rNorm, gNorm, bNorm);
        let h = 0, s, l = (max + min) / 2;

        if (max === min) {
            h = s = 0;
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case rNorm: h = (gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0); break;
                case gNorm: h = (bNorm - rNorm) / d + 2; break;
                case bNorm: h = (rNorm - gNorm) / d + 4; break;
            }
            h /= 6;
        }

        // RGB to CMYK
        let k = 1 - Math.max(rNorm, gNorm, bNorm);
        let c = (1 - rNorm - k) / (1 - k) || 0;
        let m = (1 - gNorm - k) / (1 - k) || 0;
        let y = (1 - bNorm - k) / (1 - k) || 0;

        const embed = EmbedUtils.info(`Color: #${hex.toUpperCase()}`, `Visualizing your custom palette configuration.`)
            .setColor(`#${hex}`)
            .addFields(
                { name: 'RGB', value: `\`rgb(${r}, ${g}, ${b})\``, inline: true },
                { name: 'HSL', value: `\`${Math.round(h * 360)}°, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%\``, inline: true },
                { name: 'CMYK', value: `\`${Math.round(c * 100)}%, ${Math.round(m * 100)}%, ${Math.round(y * 100)}%, ${Math.round(k * 100)}%\``, inline: true }
            )
            .setThumbnail(`https://singlecolorimage.com/get/${hex}/100x100`);

        return interaction.reply({ embeds: [embed] });
    },
} as Command;
