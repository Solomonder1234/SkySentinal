import { Command } from '../../lib/structures/Command';
import { ApplicationCommandOptionType, ApplicationCommandType, EmbedBuilder, Message, ChatInputCommandInteraction } from 'discord.js';
import { EmbedUtils } from '../../utils/EmbedUtils';
import axios from 'axios';

const ACTIONS = ['hug', 'kiss', 'slap', 'pat', 'bonk', 'cuddle', 'poke', 'bite'];

export default {
    name: 'interact',
    description: 'Interact with other users (hug, kiss, slap, etc.)',
    category: 'Image',
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: 'action',
            description: 'The interaction to perform.',
            type: ApplicationCommandOptionType.String,
            required: true,
            choices: ACTIONS.map(a => ({ name: a.charAt(0).toUpperCase() + a.slice(1), value: a })),
        },
        {
            name: 'user',
            description: 'The user to interact with.',
            type: ApplicationCommandOptionType.User,
            required: true,
        }
    ],
    run: async (client, interaction) => {
        let action = 'hug';
        let targetUser: any;

        if (interaction instanceof Message) {
            const args = interaction.content.split(' ').slice(1);
            action = args[0]?.toLowerCase() || '';

            if (!ACTIONS.includes(action)) {
                return interaction.reply(`Invalid action. Available: ${ACTIONS.join(', ')}`);
            }

            if (interaction.mentions.users.size > 0) {
                targetUser = interaction.mentions.users.first()!;
            } else {
                return interaction.reply('Please mention a user.');
            }
        } else {
            const chatInteraction = interaction as ChatInputCommandInteraction;
            action = chatInteraction.options.getString('action', true);
            targetUser = chatInteraction.options.getUser('user', true);
        }

        // Self-interaction check
        const authorId = interaction instanceof Message ? interaction.author.id : interaction.user.id;
        if (targetUser.id === authorId) {
            return interaction.reply(`You can't ${action} yourself! (Well, maybe you can, but I won't help you with that)`);
        }

        try {
            let apiEndpoint = `https://api.waifu.pics/sfw/${action}`;

            const res = await axios.get(apiEndpoint);
            const url = res.data.url;

            const descriptions: { [key: string]: string } = {
                hug: `**${targetUser.username}** got a big hug! 🤗`,
                kiss: `**${targetUser.username}** got a kiss! 💋`,
                slap: `**${targetUser.username}** got slapped! 👋`,
                pat: `**${targetUser.username}** got a headpat! 💆`,
                bonk: `**${targetUser.username}** got bonked! 🔨`,
                cuddle: `**${targetUser.username}** is getting cuddled! 🧸`,
                poke: `**${targetUser.username}** got poked! 👉`,
                bite: `**${targetUser.username}** got bitten! 🦷`,
            };

            const authorName = interaction instanceof Message ? interaction.author.username : interaction.user.username;
            const embed = EmbedUtils.info(`${action.charAt(0).toUpperCase() + action.slice(1)}!`, descriptions[action] || `**${targetUser.username}** got ${action}ed!`)
                .setImage(url)
                .setFooter({ text: `From ${authorName} • SkySentinel Supreme` });

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error(error);
            interaction.reply('Failed to fetch interaction image.');
        }
    },
} as Command;
