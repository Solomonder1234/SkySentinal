import { Command } from '../../lib/structures/Command';
import { ApplicationCommandType, PermissionFlagsBits, Message, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { OWNER_IDS } from '../../config';
import { EmbedUtils, Colors } from '../../utils/EmbedUtils';


export default {
    name: 'mod',
    description: 'Show the moderation menu.',
    aliases: ['modmenu', 'moderation'],
    type: ApplicationCommandType.ChatInput,
    defaultMemberPermissions: PermissionFlagsBits.ModerateMembers,
    run: async (client, interaction) => {
        // Double check for permissions in case of message command
        const userId = interaction instanceof Message ? interaction.author.id : interaction.user.id;
        if (interaction instanceof Message && !OWNER_IDS.includes(userId) && !interaction.member?.permissions.has(PermissionFlagsBits.ModerateMembers)) {
            return interaction.reply({ content: 'You do not have permission to view the moderation menu.' });
        }

        const modCommands = client.commands.filter(c => c.category === 'Moderation');

        const embed = EmbedUtils.info('Moderation Menu', 'Comprehensive suite of administrative and moderation tools.')
            .setThumbnail(client.user?.displayAvatarURL() || null)
            .setFooter({ text: `SkySentinel • Total Mod Commands: ${modCommands.size} • AV Edition` });

        // Group by type for better readability
        const standard = ['ban', 'kick', 'timeout', 'untimeout', 'warn', 'warnings', 'clearwarns', 'delwarn'];
        const management = ['lock', 'unlock', 'lockserver', 'unlockserver', 'slowmode', 'nick', 'dm'];
        const advanced = ['banid', 'unban', 'softban', 'tempban', 'purge', 'nuke', 'addrole', 'removerole', 'roleall'];

        const standardCmds = modCommands.filter(c => standard.includes(c.name)).map(c => `\`${c.name}\``).join(', ');
        const managementCmds = modCommands.filter(c => management.includes(c.name)).map(c => `\`${c.name}\``).join(', ');
        const advancedCmds = modCommands.filter(c => advanced.includes(c.name)).map(c => `\`${c.name}\``).join(', ');
        const otherCmds = modCommands.filter(c => !standard.includes(c.name) && !management.includes(c.name) && !advanced.includes(c.name)).map(c => `\`${c.name}\``).join(', ');

        if (standardCmds) embed.addFields({ name: '🔨 Standard', value: standardCmds });
        if (managementCmds) embed.addFields({ name: '🔒 Management', value: managementCmds });
        if (advancedCmds) embed.addFields({ name: '⚡ Advanced', value: advancedCmds });
        if (otherCmds) embed.addFields({ name: '🔍 Other', value: otherCmds });

        if (interaction instanceof Message) {
            await interaction.reply({ embeds: [embed] });
        } else {
            await interaction.reply({ embeds: [embed] });
        }
    },
} as Command;
