import { Command } from '../../lib/structures/Command';
import { ApplicationCommandOptionType, ApplicationCommandType, Message, ChatInputCommandInteraction, PermissionFlagsBits, parseEmoji } from 'discord.js';
import { EmbedUtils } from '../../utils/EmbedUtils';
import { OWNER_IDS } from '../../config';

export default {
    name: 'steal-emoji',
    description: 'Steal an emoji from another server and add it to this one.',
    category: 'Server',
    type: ApplicationCommandType.ChatInput,
    defaultMemberPermissions: PermissionFlagsBits.ManageEmojisAndStickers,
    options: [
        {
            name: 'emoji',
            description: 'The emoji to steal (can be a custom emoji from another server).',
            type: ApplicationCommandOptionType.String,
            required: true,
        },
        {
            name: 'name',
            description: 'Name for the new emoji (optional).',
            type: ApplicationCommandOptionType.String,
            required: false,
        }
    ],
    run: async (client, interaction) => {
        let emojiStr: string;
        let nameStr: string | null = null;
        let member: any;

        if (interaction instanceof Message) {
            const args = interaction.content.split(' ').slice(1);
            emojiStr = args[0] || '';
            nameStr = args[1] || null;
            member = interaction.member;
        } else {
            const chatInteraction = interaction as ChatInputCommandInteraction;
            emojiStr = chatInteraction.options.getString('emoji', true);
            nameStr = chatInteraction.options.getString('name');
            member = chatInteraction.member;
        }

        const userId = interaction instanceof Message ? interaction.author.id : interaction.user.id;

        if (!OWNER_IDS.includes(userId) && !member.permissions.has(PermissionFlagsBits.ManageEmojisAndStickers)) {
            return interaction.reply({
                embeds: [EmbedUtils.error('Permission Denied', 'You need `Manage Emojis` permission to use this command.')],
                ephemeral: true
            });
        }

        if (!emojiStr) return interaction.reply('Please provide an emoji to steal.');

        const parsed = parseEmoji(emojiStr);

        if (!parsed || !parsed.id) {
            return interaction.reply('Invalid emoji. Please provide a valid custom emoji.');
        }

        const extension = parsed.animated ? 'gif' : 'png';
        const url = `https://cdn.discordapp.com/emojis/${parsed.id}.${extension}`;
        const name = nameStr || parsed.name || 'stolen_emoji';

        try {
            const guild = interaction.guild;
            if (!guild) return interaction.reply('This command can only be used in a server.');

            const emoji = await guild.emojis.create({ attachment: url, name: name });
            const embed = EmbedUtils.success('Emoji Stolen', `Successfully added ${emoji} with name **${emoji.name}**!`);

            if (interaction instanceof Message) {
                await interaction.reply({ embeds: [embed] });
            } else {
                await interaction.reply({ embeds: [embed] });
            }

        } catch (error) {
            console.error(error);
            const embed = EmbedUtils.error('Error', 'Failed to steal emoji. The server might be full or I might lack permissions.');
            if (interaction instanceof Message) {
                await interaction.reply({ embeds: [embed] });
            } else {
                await interaction.reply({ embeds: [embed], ephemeral: true });
            }
        }
    },
} as Command;
