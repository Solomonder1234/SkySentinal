import { Command } from '../../lib/structures/Command';
import { ApplicationCommandType, ApplicationCommandOptionType, EmbedBuilder, ChatInputCommandInteraction, Message } from 'discord.js';
import { EmbedUtils } from '../../utils/EmbedUtils';
import { OWNER_IDS } from '../../config';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

export default {
    name: 'shell',
    description: 'Execute shell commands.',
    category: 'Owner',
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: 'command',
            description: 'The shell command to execute.',
            type: ApplicationCommandOptionType.String,
            required: true,
        },
    ],
    run: async (client, interaction) => {
        const user = (interaction instanceof Message) ? interaction.author : interaction.user;
        if (!OWNER_IDS.includes(user.id)) return;

        let command = '';
        if (interaction instanceof Message) {
            command = interaction.content.split(' ').slice(1).join(' ');
        } else {
            command = (interaction as ChatInputCommandInteraction).options.getString('command', true);
        }

        if (!command) return interaction.reply({ content: 'Please provide a command to execute.', ephemeral: true });

        // Defend against obvious destructive commands (basic safety)
        if (command.includes('rm -rf /') || command.includes(':(){:|:&};:')) {
            return interaction.reply({ content: 'Wait, that looks dangerous. I won\'t do that.', ephemeral: true });
        }

        try {
            const { stdout, stderr } = await execPromise(command);
            const output = stdout || stderr || 'Command executed with no output.';
            const cleanOutput = output.length > 2000 ? `${output.substring(0, 1990)}...` : output;

            const embed = EmbedUtils.premium('Shell Execution', 'Direct system kernel command execution.')
                .addFields(
                    { name: 'Command', value: `\`\`\`bash\n${command}\n\`\`\`` },
                    { name: 'Output', value: `\`\`\`bash\n${cleanOutput}\n\`\`\`` }
                )
                .setFooter({ text: 'SkySentinel Supreme • Kernel Access' });

            return interaction.reply({ embeds: [embed] });
        } catch (error: any) {
            const embed = EmbedUtils.error('Shell Execution - Error', `System process exited with an error.\n\n**Command:**\n\`\`\`bash\n${command}\n\`\`\`\n**Error:**\n\`\`\`bash\n${error.message}\n\`\`\``)
                .setFooter({ text: 'SkySentinel Supreme • Kernel Error' });

            return interaction.reply({ embeds: [embed] });
        }
    },
} as Command;
