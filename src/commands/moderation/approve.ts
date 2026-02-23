import { PermissionFlagsBits, Message, TextChannel } from 'discord.js';
import { Command } from '../../lib/structures/Command';
import { EmbedUtils } from '../../utils/EmbedUtils';

export default {
    name: 'approve',
    description: 'Approve a member and grant access to the server.',
    defaultMemberPermissions: PermissionFlagsBits.ManageRoles,
    aliases: ['verify'],
    category: 'Moderation',
    run: async (client, interaction) => {
        const author = (interaction instanceof Message) ? interaction.author : interaction.user;
        client.logger.info(`[Approve] Command triggered by ${author.username} in channel ${interaction.channelId}`);
        if (!interaction.guild || !interaction.member || !(interaction instanceof Message)) return;

        const args = interaction.content.split(' ').slice(1);
        const target = interaction.mentions.members?.first() || interaction.guild.members.cache.get(args[0] || '');
        if (!target) {
            return interaction.reply({ embeds: [EmbedUtils.error('Invalid Member', 'Please mention a valid member to approve.')] });
        }

        const channel = interaction.channel as TextChannel;
        if (!channel.name.startsWith('onboard-')) {
            return interaction.reply({ embeds: [EmbedUtils.error('Invalid Channel', 'This command can only be used in an onboarding channel.')] });
        }

        await client.onboarding.approve(interaction.member as any, target, channel);
    },
} as Command;
