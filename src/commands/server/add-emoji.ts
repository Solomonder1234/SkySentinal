import { Command } from '../../lib/structures/Command';
import { ApplicationCommandOptionType, ApplicationCommandType, Message, ChatInputCommandInteraction, PermissionFlagsBits } from 'discord.js';
import { EmbedUtils } from '../../utils/EmbedUtils';
import { OWNER_IDS } from '../../config';

export default {
    name: 'add-emoji',
    description: 'Add an emoji from a URL.',
    category: 'Server',
    type: ApplicationCommandType.ChatInput,
    defaultMemberPermissions: PermissionFlagsBits.ManageEmojisAndStickers,
    options: [
        {
            name: 'url',
            description: 'The URL of the image to add as an emoji.',
            type: ApplicationCommandOptionType.String,
            required: true,
        },
        {
            name: 'name',
            description: 'Name for the new emoji.',
            type: ApplicationCommandOptionType.String,
            required: true,
        }
    ],
    run: async (client, interaction) => {
        let url: string;
        let name: string;
        let member: any;

        if (interaction instanceof Message) {
            const args = interaction.content.split(' ').slice(1);
            url = args[0] || '';
            name = args[1] || '';
            member = interaction.member;
        } else {
            const chatInteraction = interaction as ChatInputCommandInteraction;
            url = chatInteraction.options.getString('url', true);
            name = chatInteraction.options.getString('name', true);
            member = chatInteraction.member;
        }

        const userId = interaction instanceof Message ? interaction.author.id : interaction.user.id;

        if (!OWNER_IDS.includes(userId) && !member.permissions.has(PermissionFlagsBits.ManageEmojisAndStickers)) {
            return interaction.reply({
                embeds: [EmbedUtils.error('Permission Denied', 'You need `Manage Emojis` permission to use this command.')],
                ephemeral: true
            });
        }

        if (!url || !name) return interaction.reply('Please provide a URL and a name.');

        try {
            const guild = interaction.guild;
            if (!guild) return interaction.reply('This command can only be used in a server.');

            const emoji = await guild.emojis.create({ attachment: url, name: name });
            const embed = EmbedUtils.success('Emoji Added', `Successfully added ${emoji} with name **${emoji.name}**!`);

            if (interaction instanceof Message) {
                await interaction.reply({ embeds: [embed] });
            } else {
                await interaction.reply({ embeds: [embed] });
            }

        } catch (error) {
            console.error(error);
            const embed = EmbedUtils.error('Error', 'Failed to add emoji. Ensure the URL is valid (jpg/png/gif) and manageable in size.');
            if (interaction instanceof Message) {
                await interaction.reply({ embeds: [embed] });
            } else {
                await interaction.reply({ embeds: [embed], ephemeral: true });
            }
        }
    },
} as Command;
