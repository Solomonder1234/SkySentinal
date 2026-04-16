import { PermissionFlagsBits, Message, TextChannel, ChannelType } from 'discord.js';
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

        // Determine if we are IN the member's onboarding channel, or if we need to find it
        let onboardingChannel: TextChannel | undefined = undefined;
        const currentChannel = interaction.channel as TextChannel;
        
        if (currentChannel.name === `onboard-${target.user.username.toLowerCase()}`) {
            onboardingChannel = currentChannel;
        } else {
            // Try to find the channel elsewhere in the guild
            onboardingChannel = interaction.guild.channels.cache.find(c => 
                c.name === `onboard-${target.user.username.toLowerCase()}` && c.type === ChannelType.GuildText
            ) as TextChannel;
        }

        await client.onboarding.approve(interaction.member as any, target, onboardingChannel);

        // If command was executed outside the onboarding channel, provide feedback to the moderator
        if (currentChannel.id !== onboardingChannel?.id) {
            return interaction.reply({ 
                embeds: [EmbedUtils.success('Member Approved', `Successfully verified **${target.user.tag}** and synchronized roles.`)] 
            });
        }
    },
} as Command;
