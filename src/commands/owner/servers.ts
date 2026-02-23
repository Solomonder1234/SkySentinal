import { Command } from '../../lib/structures/Command';
import { ApplicationCommandType, EmbedBuilder, Message } from 'discord.js';
import { EmbedUtils } from '../../utils/EmbedUtils';
import { OWNER_IDS } from '../../config';


export default {
    name: 'servers',
    description: 'List all servers the bot is in.',
    category: 'Owner',
    type: ApplicationCommandType.ChatInput,
    run: async (client, interaction) => {
        const user = (interaction instanceof Message) ? interaction.author : interaction.user;
        if (!OWNER_IDS.includes(user.id)) return;

        const guilds = client.guilds.cache.map(g => `• **${g.name}** (\`${g.id}\`) - ${g.memberCount} members`);
        const totalMembers = client.guilds.cache.reduce((acc, g) => acc + g.memberCount, 0);

        const embed = EmbedUtils.info(`Servers List (${client.guilds.cache.size})`, 'Full directory of all active clusters and user nodes.')
            .setDescription(`\n${guilds.join('\n').substring(0, 4000) || 'None'}\n`)
            .addFields({ name: 'Total Users', value: `\`${totalMembers.toLocaleString()}\``, inline: true })
            .setFooter({ text: `SkySentinel Supreme • Total Nodes: ${client.guilds.cache.size}` });

        return interaction.reply({ embeds: [embed] });
    },
} as Command;
