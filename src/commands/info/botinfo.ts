import { Command } from '../../lib/structures/Command';
import { ApplicationCommandType, PermissionFlagsBits, Message, ChatInputCommandInteraction, EmbedBuilder, version as djsVersion } from 'discord.js';
import { EmbedUtils, Colors } from '../../utils/EmbedUtils';
import os from 'os';

export default {
    name: 'botinfo',
    description: 'Get information about the bot.',
    type: ApplicationCommandType.ChatInput,
    run: async (client, interaction) => {
        const uptime = process.uptime();
        const days = Math.floor(uptime / 86400);
        const hours = Math.floor(uptime / 3600) % 24;
        const minutes = Math.floor(uptime / 60) % 60;
        const seconds = Math.floor(uptime % 60);

        const embed = EmbedUtils.info('SkySentinel Info', 'Detailed bot statistics and system information.')
            .setThumbnail(client.user?.displayAvatarURL() || null)
            .addFields(
                { name: 'Developer', value: 'Google Deepmind', inline: true },
                { name: 'Version', value: `v${require('../../../package.json').version}`, inline: true },
                { name: 'Library', value: `Discord.js v${djsVersion}`, inline: true },
                { name: 'Node.js', value: process.version, inline: true },
                { name: 'Uptime', value: `${days}d ${hours}h ${minutes}m ${seconds}s`, inline: true },
                { name: 'Servers', value: `${client.guilds.cache.size}`, inline: true },
                { name: 'Users', value: `${client.users.cache.size}`, inline: true },
                { name: 'Memory', value: `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`, inline: true },
                { name: 'System Badges', value: '💻 `Active Developer`\n🔮 `Early Verified`\n👑 `Server Owner`\n🌟 `HypeSquad`\n🛡️ `Head of Staff`', inline: true },
                { name: 'OS', value: `${os.type()} ${os.release()}`, inline: true }
            );

        if (interaction instanceof Message) {
            await interaction.reply({ embeds: [embed] });
        } else {
            await interaction.reply({ embeds: [embed] });
        }
    },
} as Command;
