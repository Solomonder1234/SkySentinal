import { Command } from '../../lib/structures/Command';
import { ApplicationCommandOptionType, ApplicationCommandType, PermissionFlagsBits, Message, ChatInputCommandInteraction, TextChannel } from 'discord.js';
import { EmbedUtils } from '../../utils/EmbedUtils';

export default {
    name: 'lockserver',
    description: 'Lock the entire server (all text channels).',
    type: ApplicationCommandType.ChatInput,
    defaultMemberPermissions: PermissionFlagsBits.Administrator,
    options: [
        {
            name: 'reason',
            description: 'Reason for locking the server.',
            type: ApplicationCommandOptionType.String,
            required: false,
        },
    ],
    run: async (client, interaction) => {
        let reason = 'No reason provided';

        if (interaction instanceof Message) {
            const args = interaction.content.split(' ').slice(1);
            reason = args.join(' ') || reason;
        } else {
            const chatInteraction = interaction as ChatInputCommandInteraction;
            reason = chatInteraction.options.getString('reason') || reason;
        }

        if (!interaction.guild) return;

        const channels = interaction.guild.channels.cache.filter(c => c.isTextBased() && c.manageable);
        let lockedCount = 0;

        await interaction.reply({ content: `Locking ${channels.size} channels... This may take a moment.` });

        for (const [id, channel] of channels) {
            try {
                await (channel as TextChannel).permissionOverwrites.edit(interaction.guild.roles.everyone, {
                    SendMessages: false,
                });
                lockedCount++;
            } catch (error) {
                client.logger.error(`Failed to lock channel ${channel.name}:`, error);
            }
        }

        const successEmbed = EmbedUtils.success('Server Locked', `🔒 **${lockedCount}** channels have been locked.\nReason: ${reason}`);

        if (interaction instanceof Message) {
            const channel = interaction.channel as TextChannel;
            if (channel) await channel.send({ embeds: [successEmbed] });
        } else {
            await interaction.editReply({ content: '', embeds: [successEmbed] });
        }
    },
} as Command;
