import { Command } from '../../lib/structures/Command';
import { ApplicationCommandType, ApplicationCommandOptionType, EmbedBuilder, ChatInputCommandInteraction, Message } from 'discord.js';
import { EmbedUtils } from '../../utils/EmbedUtils';
import { OWNER_IDS } from '../../config';
import { inspect } from 'util';

export default {
    name: 'eval',
    description: 'Execute TypeScript/JavaScript code.',
    category: 'Owner',
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: 'code',
            description: 'The code to execute.',
            type: ApplicationCommandOptionType.String,
            required: true,
        },
    ],
    run: async (client, interaction) => {
        const user = (interaction instanceof Message) ? interaction.author : interaction.user;
        if (!OWNER_IDS.includes(user.id)) return;

        let code = '';
        if (interaction instanceof Message) {
            code = interaction.content.split(' ').slice(1).join(' ');
        } else {
            code = (interaction as ChatInputCommandInteraction).options.getString('code', true);
        }

        if (!code) return interaction.reply({ content: 'Please provide code to execute.', ephemeral: true });

        try {
            let evaled = eval(code);

            if (evaled instanceof Promise) {
                evaled = await evaled;
            }

            const output = inspect(evaled, { depth: 1 });
            const cleanOutput = output.length > 2000 ? `${output.substring(0, 1990)}...` : output;

            const embed = EmbedUtils.premium('Eval Execution', 'Direct JavaScript/TypeScript environment execution.')
                .addFields(
                    { name: 'Input', value: `\`\`\`ts\n${code}\n\`\`\`` },
                    { name: 'Output', value: `\`\`\`ts\n${cleanOutput}\n\`\`\`` }
                )
                .setFooter({ text: 'SkySentinel Supreme • Evaluator' });

            return interaction.reply({ embeds: [embed] });
        } catch (error: any) {
            const embed = EmbedUtils.error('Eval Execution - Error', `Code execution encountered an exception.\n\n**Input:**\n\`\`\`ts\n${code}\n\`\`\`\n**Error:**\n\`\`\`ts\n${error.message}\n\`\`\``)
                .setFooter({ text: 'SkySentinel Supreme • Error Debugger' });

            return interaction.reply({ embeds: [embed] });
        }
    },
} as Command;
