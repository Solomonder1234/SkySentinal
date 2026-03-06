import { Events, Message } from 'discord.js';
import { Command } from '../../lib/structures/Command';
import { EmbedUtils } from '../../utils/EmbedUtils';

export default {
    name: 'enablecmd',
    description: 'Enables a previously disabled command in this server.',
    category: 'Configuration',
    prefixOnly: true,
    defaultMemberPermissions: 'Administrator',
    aliases: ['enablecommand'],
    run: async (client, message, args) => {
        if (!message.guildId) return;

        const cmdName = args[0]?.toLowerCase();
        if (!cmdName) {
            return message.reply({ embeds: [EmbedUtils.error('Missing Argument', 'Please provide the name of the command to enable.\nExample: `!enablecmd 8ball`')] });
        }

        let targetName = cmdName;
        if (cmdName !== 'all') {
            const command = client.commands.get(cmdName) || client.commands.find(cmd => cmd.aliases?.includes(cmdName));
            if (!command) {
                return message.reply({ embeds: [EmbedUtils.error('Invalid Command', `The command \`${cmdName}\` does not exist.`)] });
            }
            targetName = command.name;
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

        if (!disabledList.includes(targetName)) {
            return message.reply({ embeds: [EmbedUtils.error('Not Disabled', `The command \`${targetName}\` is not currently disabled.`)] });
        }

        disabledList = disabledList.filter(cmd => cmd !== targetName);

        await client.database.prisma.guildConfig.update({
            where: { id: message.guildId },
            data: { disabledCommands: JSON.stringify(disabledList) }
        });

        await message.reply({ embeds: [EmbedUtils.success('Command Enabled', `Successfully re-enabled the \`${targetName}\` command.`)] });
    }
} as Command;
