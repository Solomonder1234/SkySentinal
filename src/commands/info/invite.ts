import { Command } from '../../lib/structures/Command';
import { ApplicationCommandType, PermissionFlagsBits, Message, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { EmbedUtils } from '../../utils/EmbedUtils';

export default {
    name: 'invite',
    description: 'Get the bot\'s invite link.',
    type: ApplicationCommandType.ChatInput,
    run: async (client, interaction) => {
        const inviteUrl = `https://discord.com/api/oauth2/authorize?client_id=${client.user?.id}&permissions=8&scope=bot%20applications.commands`;
        const embed = EmbedUtils.info('Invite Me', `[Click here to invite me!](${inviteUrl})`);

        if (interaction instanceof Message) {
            await interaction.reply({ embeds: [embed] });
        } else {
            await interaction.reply({ embeds: [embed] });
        }
    },
} as Command;
