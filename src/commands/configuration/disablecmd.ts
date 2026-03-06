import { Events, Message, EmbedBuilder } from 'discord.js';
import { Command } from '../../lib/structures/Command';
import { EmbedUtils } from '../../utils/EmbedUtils';

export default {
    name: 'disablecmd',
    description: 'Disables a specific command in this server.',
    category: 'Configuration',
    prefixOnly: true,
    defaultMemberPermissions: 'Administrator',
    aliases: ['disablecommand'],
    run: async (client, message, args) => {
        if (!message.guildId) return;

        const cmdName = args[0]?.toLowerCase();
        if (!cmdName) {
            return message.reply({ embeds: [EmbedUtils.error('Missing Argument', 'Please provide the name of the command to disable, or type `all` to disable everything.\nExample: `!disablecmd all`')] });
        }

        let targetName = cmdName;
        if (cmdName !== 'all') {
            const command = client.commands.get(cmdName) || client.commands.find(cmd => cmd.aliases?.includes(cmdName));
            if (!command) {
                return message.reply({ embeds: [EmbedUtils.error('Invalid Command', `The command \`${cmdName}\` does not exist.`)] });
            }
            targetName = command.name;

            const protectedCommands = ['disablecmd', 'enablecmd', 'help'];
            if (protectedCommands.includes(targetName)) {
                return message.reply({ embeds: [EmbedUtils.error('Permission Denied', `The \`${targetName}\` command is a critical system operation and cannot be disabled.`)] });
            }
        }

        const config = await client.database.prisma.guildConfig.findUnique({
            where: { id: message.guildId }
        });

        if (!config) {
            return message.reply('Server configuration not found.');
        }

        let disabledList: string[] = [];
        try {
            disabledList = JSON.parse(config.disabledCommands || '[]');
        } catch (e) {
            disabledList = [];
        }

        if (disabledList.includes(targetName)) {
            return message.reply({ embeds: [EmbedUtils.error('Already Disabled', `The command \`${targetName}\` is already disabled in this server.`)] });
        }

        disabledList.push(targetName);

        await client.database.prisma.guildConfig.update({
            where: { id: message.guildId },
            data: { disabledCommands: JSON.stringify(disabledList) }
        });

        await message.reply({ embeds: [EmbedUtils.success('Command Disabled', `Successfully disabled ${targetName === 'all' ? '**ALL** commands' : `the \`${targetName}\` command`}.\nUsers in this server can no longer use ${targetName === 'all' ? 'them' : 'it'}.`)] });
    }
} as Command;
