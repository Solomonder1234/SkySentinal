import { Command } from '../../lib/structures/Command';
import { ApplicationCommandOptionType, ApplicationCommandType, PermissionFlagsBits, Message, ChatInputCommandInteraction } from 'discord.js';
import { EmbedUtils } from '../../utils/EmbedUtils';

export default {
    name: 'poll',
    description: 'Create a simple poll.',
    category: 'Utility',
    type: ApplicationCommandType.ChatInput,
    defaultMemberPermissions: PermissionFlagsBits.SendMessages,
    options: [
        {
            name: 'question',
            description: 'The question for the poll.',
            type: ApplicationCommandOptionType.String,
            required: true,
        },
    ],
    run: async (client, interaction) => {
        let question: string;

        if (interaction instanceof Message) {
            question = interaction.content.split(' ').slice(1).join(' ');
            if (!question) return interaction.reply({ content: 'Please provide a question.' });
        } else {
            const chatInteraction = interaction as ChatInputCommandInteraction;
            question = chatInteraction.options.getString('question', true);
        }

        const embed = EmbedUtils.info('📊 Poll', question)
            ;

        const reply = await interaction.reply({ embeds: [embed], fetchReply: true });

        await reply.react('👍');
        await reply.react('👎');
    },
} as Command;
