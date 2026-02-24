import { Command } from '../../lib/structures/Command';
import { ApplicationCommandOptionType, ApplicationCommandType, PermissionFlagsBits, Message, ChatInputCommandInteraction, Role } from 'discord.js';
import { EmbedUtils } from '../../utils/EmbedUtils';

export default {
    name: 'autopromote',
    description: 'Manage auto-promotion rules for active members.',
    category: 'Configuration',
    type: ApplicationCommandType.ChatInput,
    defaultMemberPermissions: PermissionFlagsBits.ManageGuild,
    options: [
        {
            name: 'add',
            description: 'Add a new promotion rule.',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: 'type',
                    description: 'The requirement type.',
                    type: ApplicationCommandOptionType.String,
                    required: true,
                    choices: [
                        { name: 'Level', value: 'LEVEL' },
                        { name: 'Messages', value: 'MESSAGES' },
                        { name: 'Days in Server', value: 'DAYS' }
                    ]
                },
                {
                    name: 'requirement',
                    description: 'The number required (Level #, Message count, or Days).',
                    type: ApplicationCommandOptionType.Integer,
                    required: true
                },
                {
                    name: 'role',
                    description: 'The role to award.',
                    type: ApplicationCommandOptionType.Role,
                    required: true
                },
                {
                    name: 'prefix',
                    description: 'Optional nickname prefix (e.g., "MOD").',
                    type: ApplicationCommandOptionType.String,
                    required: false
                }
            ]
        },
        {
            name: 'remove',
            description: 'Remove a promotion rule.',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: 'id',
                    description: 'The rule ID to remove (see /autopromote list).',
                    type: ApplicationCommandOptionType.Integer,
                    required: true
                }
            ]
        },
        {
            name: 'list',
            description: 'List all promotion rules.',
            type: ApplicationCommandOptionType.Subcommand
        },
        {
            name: 'setting',
            description: 'Update auto-promotion settings.',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: 'stack_promotions',
                    description: 'Whether to keep old promotion roles (stacking) or remove them.',
                    type: ApplicationCommandOptionType.Boolean,
                    required: true
                }
            ]
        }
    ],
    run: async (client, interaction, args) => {
        const guildId = interaction.guildId!;

        const isSlash = interaction instanceof ChatInputCommandInteraction;
        const subcommand = isSlash ? interaction.options.getSubcommand() : args[0]?.toLowerCase();

        if (!subcommand) {
            return interaction.reply({ content: '❌ Please specify a subcommand: `add`, `remove`, `list`, or `setting`.' });
        }

        if (subcommand === 'add') {
            let type: string | null = null;
            let requirement: number | null = null;
            let roleId: string | null = null;
            let prefix: string | null = null;

            if (isSlash) {
                const chatInt = interaction as ChatInputCommandInteraction;
                type = chatInt.options.getString('type', true);
                requirement = chatInt.options.getInteger('requirement', true);
                roleId = chatInt.options.getRole('role', true).id;
                prefix = chatInt.options.getString('prefix');
            } else {
                // Positional: !autopromote add <type> <req> <@role/id> [prefix]
                type = (args[1] || '').toUpperCase();
                requirement = parseInt(args[2] || '');
                roleId = (args[3] || '').replace(/[<@&>]/g, '');
                prefix = args[4] || null;

                if (!type || !['LEVEL', 'MESSAGES', 'DAYS'].includes(type)) return interaction.reply({ content: '❌ Invalid type. Use `LEVEL`, `MESSAGES`, or `DAYS`.' });
                if (isNaN(requirement)) return interaction.reply({ content: '❌ Requirement must be a number.' });
                if (!roleId) return interaction.reply({ content: '❌ Please provide a role or role ID.' });
            }

            await (client.database.prisma.promotionRule as any).upsert({
                where: {
                    guildId_type_requirement: {
                        guildId,
                        type,
                        requirement
                    }
                },
                create: {
                    guildId,
                    type,
                    requirement,
                    roleId,
                    nicknamePrefix: prefix
                },
                update: {
                    roleId,
                    nicknamePrefix: prefix
                }
            });

            return interaction.reply({
                embeds: [EmbedUtils.success('Rule Added', `Successfully ${prefix ? `added **[${prefix}]**` : 'added'} promotion rule:\n**Type:** ${type}\n**Requirement:** ${requirement}\n**Role:** <@&${roleId}>`)]
            });
        }

        if (subcommand === 'remove') {
            const id = isSlash ? (interaction as ChatInputCommandInteraction).options.getInteger('id', true) : parseInt(args[1] || '');

            if (isNaN(id)) return interaction.reply({ content: '❌ Please provide a valid Rule ID.' });

            try {
                await (client.database.prisma.promotionRule as any).delete({
                    where: { id, guildId }
                });
                return interaction.reply({ embeds: [EmbedUtils.success('Rule Removed', `Successfully deleted rule ID: \`${id}\``)] });
            } catch (e) {
                return interaction.reply({ content: '❌ Rule not found or does not belong to this guild.' });
            }
        }

        if (subcommand === 'list') {
            const rules = await (client.database.prisma.promotionRule as any).findMany({
                where: { guildId },
                orderBy: { requirement: 'asc' }
            });

            const config = await (client.database.prisma.guildConfig as any).findUnique({ where: { id: guildId } });

            if (rules.length === 0) {
                return interaction.reply({ content: 'No promotion rules configured for this server.' });
            }

            const ruleList = (rules as any[]).map(r => `ID: \`${r.id}\` | **${r.type} ${r.requirement}** -> <@&${r.roleId}>${r.nicknamePrefix ? ` (Prefix: \`${r.nicknamePrefix}\`)` : ''}`).join('\n');

            const embed = EmbedUtils.info('Promotion Rules', ruleList)
                .addFields({ name: 'Role Stacking', value: (config as any)?.stackPromotions ? '✅ Enabled' : '❌ Disabled', inline: true });

            return interaction.reply({ embeds: [embed] });
        }

        if (subcommand === 'setting') {
            const stack = isSlash ? (interaction as ChatInputCommandInteraction).options.getBoolean('stack_promotions', true) : (args[1] || '').toLowerCase() === 'true';

            await (client.database.prisma.guildConfig as any).update({
                where: { id: guildId },
                data: { stackPromotions: stack }
            });

            return interaction.reply({
                embeds: [EmbedUtils.success('Setting Updated', `Role stacking is now **${stack ? 'ENABLED' : 'DISABLED'}**.`)]
            });
        }
    },
} as Command;
