import { Command } from '../../lib/structures/Command';
import { ApplicationCommandOptionType, ApplicationCommandType, PermissionFlagsBits, Message, ChatInputCommandInteraction } from 'discord.js';
import { EmbedUtils } from '../../utils/EmbedUtils';

export default {
    name: 'fun',
    description: 'Fun commands.',
    category: 'Fun',
    type: ApplicationCommandType.ChatInput,
    defaultMemberPermissions: PermissionFlagsBits.SendMessages,
    options: [
        {
            name: 'coinflip',
            description: 'Flip a coin.',
            type: ApplicationCommandOptionType.Subcommand,
        },
        {
            name: '8ball',
            description: 'Ask the magic 8ball a question.',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: 'question',
                    description: 'Question to ask.',
                    type: ApplicationCommandOptionType.String,
                    required: true,
                }
            ]
        }
    ],
    run: async (client, interaction) => {
        let subcommand: string;

        if (interaction instanceof Message) {
            const args = interaction.content.split(' ').slice(1);
            if (!args[0]) return interaction.reply({ content: 'Please provide a subcommand: `coinflip`, `8ball`' });
            subcommand = args[0];
        } else {
            const chatInteraction = interaction as ChatInputCommandInteraction;
            subcommand = chatInteraction.options.getSubcommand();
        }

        if (subcommand === 'coinflip') {
            const result = Math.random() < 0.5 ? 'Heads' : 'Tails';
            const embed = EmbedUtils.info('Coin Flip', `🪙 The coin landed on **${result}**!`);
            await interaction.reply({ embeds: [embed] });

        } else if (subcommand === '8ball') {
            let question: string;
            if (interaction instanceof Message) {
                question = interaction.content.split(' ').slice(2).join(' ');
                if (!question) return interaction.reply({ content: 'Please ask a question.' });
            } else {
                const chatInteraction = interaction as ChatInputCommandInteraction;
                question = chatInteraction.options.getString('question', true);
            }

            const responses = [
                'It is certain.', 'It is decidedly so.', 'Without a doubt.', 'Yes - definitely.',
                'You may rely on it.', 'As I see it, yes.', 'Most likely.', 'Outlook good.',
                'Yes.', 'Signs point to yes.', 'Reply hazy, try again.', 'Ask again later.',
                'Better not tell you now.', 'Cannot predict now.', 'Concentrate and ask again.',
                'Don\'t count on it.', 'My reply is no.', 'My sources say no.', 'Outlook not so good.',
                'Very doubtful.'
            ];

            const response = responses[Math.floor(Math.random() * responses.length)];
            const embed = EmbedUtils.info('🎱 Magic 8-Ball', `**Q:** ${question}\n**A:** ${response}`);
            await interaction.reply({ embeds: [embed] });
        }
    },
} as Command;
