import { Command } from '../../lib/structures/Command';
import { ApplicationCommandOptionType, ApplicationCommandType, PermissionFlagsBits, Message, ChatInputCommandInteraction } from 'discord.js';
import { EmbedUtils } from '../../utils/EmbedUtils';

export default {
    name: 'setrolereward',
    description: 'Set a role reward for a specific level.',
    category: 'Configuration',
    type: ApplicationCommandType.ChatInput,
    defaultMemberPermissions: PermissionFlagsBits.Administrator,
    options: [
        {
            name: 'add',
            description: 'Add a role reward.',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: 'level',
                    description: 'The level required.',
                    type: ApplicationCommandOptionType.Integer,
                    minValue: 1,
                    required: true,
                },
                {
                    name: 'role',
                    description: 'The role to give.',
                    type: ApplicationCommandOptionType.Role,
                    required: true,
                }
            ]
        },
        {
            name: 'remove',
            description: 'Remove a role reward.',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: 'level',
                    description: 'The level of the reward to remove.',
                    type: ApplicationCommandOptionType.Integer,
                    minValue: 1,
                    required: true,
                }
            ]
        },
        {
            name: 'list',
            description: 'List all role rewards.',
            type: ApplicationCommandOptionType.Subcommand
        }
    ],
    run: async (client, interaction) => {
        const guildId = interaction.guildId!;
        let subcommand: string;
        let level: number | undefined;
        let roleId: string | undefined;

        if (interaction instanceof Message) {
            const args = interaction.content.split(' ').slice(1);
            subcommand = args[0]?.toLowerCase() || '';
            level = parseInt(args[1] || '0');
            const roleMention = interaction.mentions.roles.first();
            roleId = roleMention?.id || args[2];
        } else {
            const chatInteraction = interaction as ChatInputCommandInteraction;
            subcommand = chatInteraction.options.getSubcommand();
            level = chatInteraction.options.getInteger('level')!;
            roleId = chatInteraction.options.getRole('role')?.id;
        }

        const db = (client.database.prisma as any);

        if (subcommand === 'add') {
            if (!level || !roleId) return interaction.reply({ content: 'Missing level or role.' });

            await db.roleReward.upsert({
                where: { guildId_level: { guildId, level } },
                create: { guildId, level, roleId },
                update: { roleId }
            });

            return interaction.reply({ embeds: [EmbedUtils.success('Role Reward Added', `Level **${level}** now grants the <@&${roleId}> role.`)] });

        } else if (subcommand === 'remove') {
            if (!level) return interaction.reply({ content: 'Missing level.' });

            await db.roleReward.delete({
                where: { guildId_level: { guildId, level } }
            }).catch(() => { });

            return interaction.reply({ embeds: [EmbedUtils.success('Role Reward Removed', `Removed role reward for Level **${level}**.`)] });

        } else if (subcommand === 'list') {
            const rewards = await db.roleReward.findMany({
                where: { guildId },
                orderBy: { level: 'asc' }
            });

            if (rewards.length === 0) return interaction.reply({ content: 'No role rewards configured.' });

            const description = rewards.map((r: any) => `Level **${r.level}** -> <@&${r.roleId}>`).join('\n');
            return interaction.reply({ embeds: [EmbedUtils.info('Role Rewards', description)] });
        }
    },
} as Command;
