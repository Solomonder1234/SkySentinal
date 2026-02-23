import { Command } from '../../lib/structures/Command';
import { ApplicationCommandOptionType, ApplicationCommandType, PermissionFlagsBits, Message, ChatInputCommandInteraction, TextChannel } from 'discord.js';
import { EmbedUtils } from '../../utils/EmbedUtils';

export default {
    name: 'unlockserver',
    description: 'Unlock the entire server (all text channels).',
    type: ApplicationCommandType.ChatInput,
    defaultMemberPermissions: PermissionFlagsBits.Administrator,
    options: [
        {
            name: 'reason',
            description: 'Reason for unlocking the server.',
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
        let unlockedCount = 0;

        await interaction.reply({ content: `Unlocking ${channels.size} channels... This may take a moment.` });

        for (const [id, channel] of channels) {
            try {
                await (channel as TextChannel).permissionOverwrites.edit(interaction.guild.roles.everyone, {
                    SendMessages: null,
                });
                unlockedCount++;
            } catch (error) {
                client.logger.error(`Failed to unlock channel ${channel.name}:`, error);
            }
        }

        const successEmbed = EmbedUtils.success('Server Unlocked', `🔓 **${unlockedCount}** channels have been unlocked.\nReason: ${reason}`);

        if (interaction instanceof Message) {
            const channel = interaction.channel as TextChannel;
            if (channel) await channel.send({ embeds: [successEmbed] });
        } else {
            await interaction.editReply({ content: '', embeds: [successEmbed] });
        }
    },
} as Command;
