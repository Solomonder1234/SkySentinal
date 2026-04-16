import { PermissionFlagsBits, Message } from 'discord.js';
import { Command } from '../../lib/structures/Command';
import { EmbedUtils } from '../../utils/EmbedUtils';

export default {
    name: 'nwssetup',
    description: 'Configure the National Weather Service alert system.',
    permissions: [PermissionFlagsBits.Administrator],
    category: 'Configuration',
    run: async (client, interaction) => {
        if (!interaction.guild || !interaction.member || !(interaction instanceof Message)) return;

        const args = interaction.content.split(' ').slice(1);
        const sub = args[0]?.toLowerCase();

        if (sub === 'channel') {
            const channel = interaction.mentions.channels.first() || interaction.guild.channels.cache.get(args[1] || '');
            if (!channel || !channel.isTextBased()) {
                return interaction.reply({ 
                    embeds: [EmbedUtils.error('Invalid Setup', 'Please mention a text channel or provide a valid channel ID.\nExample: `!nwssetup channel #weather-alerts`')] 
                });
            }

            await client.database.prisma.guildConfig.update({
                where: { id: interaction.guild.id },
                data: { weatherAlertChannelId: channel.id }
            });

            return interaction.reply({ 
                embeds: [EmbedUtils.success('Alert Channel Updated', `Successfuly routed NWS severe weather alerts to ${channel}.`)] 
            });
        }

        if (sub === 'zone') {
            const zone = args.slice(1).join(' ');
            if (!zone) {
                return interaction.reply({ 
                    embeds: [EmbedUtils.error('Invalid Setup', 'Please provide a weather zone or region name.\nExample: `!nwssetup zone NYC` or `!nwssetup zone Miami`')] 
                });
            }

            await client.database.prisma.guildConfig.update({
                where: { id: interaction.guild.id },
                data: { weatherAlertZone: zone }
            });

            return interaction.reply({ 
                embeds: [EmbedUtils.success('Weather Zone Updated', `Successfully set the monitoring zone to **${zone}**.\n*(The bot will now filter alerts containing this keyword or "global" threats)*`)] 
            });
        }

        const helpEmbed = EmbedUtils.info(
            'NWS Setup Help',
            'Use the following subcommands to configure weather alerts:\n\n' +
            '`!nwssetup channel <#Channel>` - Set where severe weather alerts are posted.\n' +
            '`!nwssetup zone <Region>` - Set the keyword to filter alerts (e.g., NYC, Miami, or "global").'
        );

        return interaction.reply({ embeds: [helpEmbed] });
    },
} as Command;
