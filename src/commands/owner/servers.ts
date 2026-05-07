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

        if (!(interaction instanceof Message)) {
            await interaction.deferReply();
        }

        const guildList: string[] = [];
        const totalMembers = client.guilds.cache.reduce((acc, g) => acc + g.memberCount, 0);

        for (const guild of client.guilds.cache.values()) {
            let inviteStr = "[No Permissions]";

            try {
                // Try to find an existing permanent invite first
                const invites = await guild.invites.fetch().catch(() => null);
                let invite = invites?.find(i => !i.expiresAt);

                if (!invite) {
                    // Try to create a temporary one
                    const channel = guild.rulesChannel || guild.channels.cache.find(c => c.isTextBased());
                    if (channel && 'createInvite' in channel) {
                        invite = await (channel as any).createInvite({ maxAge: 86400, maxUses: 1 }).catch(() => null);
                    }
                }

                if (invite) {
                    inviteStr = `[Join Link](${invite.url})`;
                }
            } catch (e) {
                // Silently fail if no perms
            }

            guildList.push(`• **${guild.name}** (\`${guild.id}\`)\n  └ Users: \`${guild.memberCount.toLocaleString()}\` | ${inviteStr}`);
        }

        const embed = EmbedUtils.info(`Servers List (${client.guilds.cache.size})`, 'Full directory of all active clusters and user nodes.')
            .setDescription(`\n${guildList.join('\n\n').substring(0, 4000) || 'None'}\n`)
            .addFields({ name: 'Total Users', value: `\`${totalMembers.toLocaleString()}\``, inline: true })
            ;

        if (interaction instanceof Message) {
            return interaction.reply({ embeds: [embed] });
        } else {
            return interaction.editReply({ embeds: [embed] });
        }
    },
} as Command;
