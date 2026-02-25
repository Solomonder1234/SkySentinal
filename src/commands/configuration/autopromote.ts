import { Command } from '../../lib/structures/Command';
import { ApplicationCommandOptionType, ApplicationCommandType, Message, ChatInputCommandInteraction, PermissionFlagsBits } from 'discord.js';
import { EmbedUtils } from '../../utils/EmbedUtils';

export default {
    name: 'autopromote',
    description: 'Configure auto-promotion rules for Staff members based on Activity.',
    category: 'Configuration',
    type: ApplicationCommandType.ChatInput,
    defaultMemberPermissions: PermissionFlagsBits.ManageGuild,
    options: [
        {
            name: 'add',
            description: 'Add a new auto-promotion rule',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: 'type',
                    description: 'The type of requirement',
                    type: ApplicationCommandOptionType.String,
                    required: true,
                    choices: [
                        { name: 'Level (XP System)', value: 'LEVEL' },
                        { name: 'Messages Sent', value: 'MESSAGES' },
                        { name: 'Days in Server', value: 'DAYS' }
                    ]
                },
                {
                    name: 'requirement',
                    description: 'The number required to earn this role',
                    type: ApplicationCommandOptionType.Integer,
                    required: true
                },
                {
                    name: 'role',
                    description: 'The role to award',
                    type: ApplicationCommandOptionType.Role,
                    required: true
                },
                {
                    name: 'prefix',
                    description: 'Optional nickname prefix (e.g. "S-MOD" -> [S-MOD] Username)',
                    type: ApplicationCommandOptionType.String,
                    required: false
                }
            ]
        },
        {
            name: 'remove',
            description: 'Remove an existing auto-promotion rule',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: 'type',
                    description: 'The type of requirement',
                    type: ApplicationCommandOptionType.String,
                    required: true,
                    choices: [
                        { name: 'Level (XP System)', value: 'LEVEL' },
                        { name: 'Messages Sent', value: 'MESSAGES' },
                        { name: 'Days in Server', value: 'DAYS' }
                    ]
                },
                {
                    name: 'requirement',
                    description: 'The exact requirement number to delete',
                    type: ApplicationCommandOptionType.Integer,
                    required: true
                }
            ]
        },
        {
            name: 'list',
            description: 'List all active auto-promotion rules',
            type: ApplicationCommandOptionType.Subcommand
        }
    ],
    run: async (client, interaction) => {
        // Enforce Admin/ManageGuild
        let hasPerms = false;
        if (interaction instanceof Message) {
            hasPerms = interaction.member?.permissions.has(PermissionFlagsBits.ManageGuild) || false;
        } else {
            hasPerms = interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild) || false;
        }

        if (!hasPerms) {
            const err = EmbedUtils.error('Access Denied', 'You need `Manage Server` permissions to bypass standard hierarchy protocols.');
            return interaction.reply(interaction instanceof Message ? { embeds: [err] } : { embeds: [err], ephemeral: true });
        }

        let subcommand = '';
        let type = '';
        let requirement = 0;
        let roleId = '';
        let prefix = '';

        if (interaction instanceof Message) {
            const args = interaction.content.split(' ').slice(1);
            subcommand = args[0]?.toLowerCase() || 'list';
            if (subcommand === 'add') {
                type = args[1]?.toUpperCase() || '';
                requirement = parseInt(args[2] || '0') || 0;
                roleId = args[3]?.replace(/[<@&>]/g, '') || '';
                prefix = args.slice(4).join(' ');
            } else if (subcommand === 'remove') {
                type = args[1]?.toUpperCase() || '';
                requirement = parseInt(args[2] || '0') || 0;
            }
        } else {
            const chatInteraction = interaction as ChatInputCommandInteraction;
            subcommand = chatInteraction.options.getSubcommand();
            if (subcommand === 'add') {
                type = chatInteraction.options.getString('type', true);
                requirement = chatInteraction.options.getInteger('requirement', true);
                roleId = chatInteraction.options.getRole('role', true).id;
                prefix = chatInteraction.options.getString('prefix') || '';
            } else if (subcommand === 'remove') {
                type = chatInteraction.options.getString('type', true);
                requirement = chatInteraction.options.getInteger('requirement', true);
            }
        }

        const guildId = interaction.guildId!;

        // Ensure GuildConfig is present
        await client.database.prisma.guildConfig.upsert({
            where: { id: guildId },
            create: { id: guildId },
            update: {}
        });

        if (subcommand === 'list') {
            const rules = await client.database.prisma.promotionRule.findMany({ where: { guildId } });

            if (rules.length === 0) {
                return interaction.reply({ embeds: [EmbedUtils.info('Promotion Rules', 'There are no automated staff promotion rules configured for this server.')] });
            }

            const ruleDescriptions = rules.map((r: any) => `*   **${r.type} ${r.requirement}:** <@&${r.roleId}> ${r.nicknamePrefix ? `(Prefix: \`[${r.nicknamePrefix}]\`)` : ''}`).join('\n');
            const embed = EmbedUtils.info('Active Promotion Pipeline', `Staff members will automatically receive these roles when they hit the designated milestones:\n\n${ruleDescriptions}`);
            return interaction.reply({ embeds: [embed] });
        }

        if (subcommand === 'add') {
            if (!['LEVEL', 'MESSAGES', 'DAYS'].includes(type) || isNaN(requirement) || !roleId) {
                return interaction.reply({ content: 'Invalid syntax. Example: `!autopromote add LEVEL 10 @role [Prefix]`' });
            }

            try {
                await client.database.prisma.promotionRule.upsert({
                    where: { guildId_type_requirement: { guildId, type, requirement } },
                    update: { roleId, nicknamePrefix: prefix || null },
                    create: { guildId, type, requirement, roleId, nicknamePrefix: prefix || null }
                });

                const embed = EmbedUtils.success('Pipeline Authorized', `Successfully configured promotion rule:\n*   **Condition:** ${type} ${requirement}\n*   **Reward:** <@&${roleId}>\n*   **Prefix:** ${prefix ? `\`[${prefix}]\`` : 'None'}`);
                return interaction.reply({ embeds: [embed] });
            } catch (err) {
                client.logger.error('Failed to add promotion rule:', err);
                return interaction.reply({ embeds: [EmbedUtils.error('Database Error', 'Could not save the promotion rule onto the mainframe.')] });
            }
        }

        if (subcommand === 'remove') {
            if (!['LEVEL', 'MESSAGES', 'DAYS'].includes(type) || isNaN(requirement)) {
                return interaction.reply({ content: 'Invalid syntax. Example: `!autopromote remove LEVEL 10`' });
            }

            try {
                await client.database.prisma.promotionRule.delete({
                    where: { guildId_type_requirement: { guildId, type, requirement } }
                });

                const embed = EmbedUtils.success('Pipeline Terminated', `Successfully deleted promotion trajectory for **${type} ${requirement}**.`);
                return interaction.reply({ embeds: [embed] });
            } catch (err) {
                return interaction.reply({ embeds: [EmbedUtils.error('Not Found', 'Could not locate a rule matching those exact conditions within the schema.')] });
            }
        }
    }
} as Command;
