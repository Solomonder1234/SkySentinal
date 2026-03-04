import { Command } from '../../lib/structures/Command';
import { ApplicationCommandType, ApplicationCommandOptionType, Message, ChatInputCommandInteraction, TextChannel } from 'discord.js';
import { EmbedUtils } from '../../utils/EmbedUtils';

export default {
    name: 'alliance',
    description: 'Post an alliance announcement mentioning @here',
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: 'message',
            description: 'The alliance announcement message.',
            type: ApplicationCommandOptionType.String,
            required: true
        }
    ],
    run: async (client, interaction) => {
        const member = interaction.member as any;
        const user = interaction instanceof Message ? interaction.author : interaction.user;
        const isAdmin = member?.permissions?.has('ManageMessages') || member?.permissions?.has('Administrator');
        const isGlobalAdmin = user.id === '753372101540577431';

        if (!isAdmin && interaction.guild?.ownerId !== member.id && !isGlobalAdmin) {
            return interaction.reply({ content: 'You do not have permission to post alliance announcements.', ephemeral: true });
        }

        let contentMsg = '';
        if (interaction instanceof Message) {
            contentMsg = interaction.content.split(' ').slice(1).join(' ');
        } else {
            contentMsg = (interaction as ChatInputCommandInteraction).options.getString('message', true);
        }

        if (!contentMsg) {
            return interaction.reply({ content: 'Please provide the announcement message. Usage: `!alliance <message>`', ephemeral: true });
        }

        const embed = EmbedUtils.premium(
            '🤝 Official Alliance Announcement',
            contentMsg
        ).setFooter({ text: 'SkyAlert Network Partnerships', iconURL: interaction.guild?.iconURL() || undefined });

        if (interaction.channel && interaction.channel.isTextBased()) {
            await (interaction.channel as TextChannel).send({ content: '@here', embeds: [embed] });

            if (interaction instanceof Message) {
                await interaction.delete().catch(() => null);
            } else {
                await interaction.reply({ content: 'Alliance announcement posted.', ephemeral: true });
            }
        }
    }
} as Command;
