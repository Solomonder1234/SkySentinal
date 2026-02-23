import { Command } from '../../lib/structures/Command';
import { ApplicationCommandOptionType, ApplicationCommandType, PermissionFlagsBits, ChatInputCommandInteraction, Message, EmbedBuilder } from 'discord.js';
import { EmbedUtils } from '../../utils/EmbedUtils';

export default {
    name: 'role',
    description: 'Manage server roles.',
    category: 'Moderation',
    type: ApplicationCommandType.ChatInput,
    defaultMemberPermissions: PermissionFlagsBits.ManageRoles,
    options: [
        {
            name: 'create',
            description: 'Create a new role.',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: 'name',
                    description: 'The name of the role.',
                    type: ApplicationCommandOptionType.String,
                    required: true,
                },
                {
                    name: 'color',
                    description: 'The hex color of the role (e.g. #ff0000).',
                    type: ApplicationCommandOptionType.String,
                    required: false,
                },
                {
                    name: 'hoist',
                    description: 'Whether to display the role separately.',
                    type: ApplicationCommandOptionType.Boolean,
                    required: false,
                }
            ]
        },
        {
            name: 'delete',
            description: 'Delete a role.',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: 'role',
                    description: 'The role to delete.',
                    type: ApplicationCommandOptionType.Role,
                    required: true,
                },
                {
                    name: 'reason',
                    description: 'The reason for deletion.',
                    type: ApplicationCommandOptionType.String,
                    required: false,
                }
            ]
        },
        {
            name: 'modify',
            description: 'Modify an existing role.',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: 'role',
                    description: 'The role to modify.',
                    type: ApplicationCommandOptionType.Role,
                    required: true,
                },
                {
                    name: 'name',
                    description: 'New name for the role.',
                    type: ApplicationCommandOptionType.String,
                    required: false,
                },
                {
                    name: 'color',
                    description: 'New hex color for the role.',
                    type: ApplicationCommandOptionType.String,
                    required: false,
                }
            ]
        }
    ],
    run: async (client, interaction) => {
        let subcommand: string;
        let roleName: string | undefined;
        let roleColor: string | undefined;
        let roleHoist: boolean | undefined;
        let targetRole: any;
        let reason = 'No reason provided';

        if (interaction instanceof Message) {
            const args = interaction.content.split(' ').slice(1);
            subcommand = args[0]?.toLowerCase() || '';

            if (subcommand === 'create') {
                roleName = args[1] || '';
                roleColor = args[2] || '';
            } else if (subcommand === 'delete') {
                const mention = interaction.mentions.roles.first();
                targetRole = mention || interaction.guild?.roles.cache.get(args[1] || '');
                reason = args.slice(2).join(' ') || reason;
            } else if (subcommand === 'modify') {
                const mention = interaction.mentions.roles.first();
                targetRole = mention || interaction.guild?.roles.cache.get(args[1] || '');
                roleName = args[2] || '';
                roleColor = args[3] || '';
            }
        } else {
            const chatInteraction = interaction as ChatInputCommandInteraction;
            subcommand = chatInteraction.options.getSubcommand();
            roleName = chatInteraction.options.getString('name')!;
            roleColor = chatInteraction.options.getString('color')!;
            roleHoist = chatInteraction.options.getBoolean('hoist')!;
            targetRole = chatInteraction.options.getRole('role');
            reason = chatInteraction.options.getString('reason') || reason;
        }

        if (subcommand === 'create') {
            if (!roleName) return interaction.reply({ content: 'Please provide a role name.' });
            try {
                const newRole = await interaction.guild?.roles.create({
                    name: roleName,
                    color: (roleColor as any) || 'Default',
                    hoist: roleHoist || false,
                    reason: `Created by ${(interaction.member as any)?.user?.tag || 'Unknown'}`
                });
                return interaction.reply({ embeds: [EmbedUtils.success('Role Created', `Successfully created ${newRole}.`)] });
            } catch (err: any) {
                return interaction.reply({ embeds: [EmbedUtils.error('Creation Failed', err.message)] });
            }
        }

        if (subcommand === 'delete') {
            if (!targetRole) return interaction.reply({ content: 'Invalid role.' });
            if (targetRole.managed) return interaction.reply({ content: 'Cannot delete a managed role.' });
            try {
                const name = targetRole.name;
                await targetRole.delete(reason);
                return interaction.reply({ embeds: [EmbedUtils.success('Role Deleted', `Successfully deleted role \`${name}\`.\nReason: ${reason}`)] });
            } catch (err: any) {
                return interaction.reply({ embeds: [EmbedUtils.error('Deletion Failed', err.message)] });
            }
        }

        if (subcommand === 'modify') {
            if (!targetRole) return interaction.reply({ content: 'Invalid role.' });
            try {
                await targetRole.edit({
                    name: roleName || targetRole.name,
                    color: (roleColor as any) || targetRole.color
                });
                return interaction.reply({ embeds: [EmbedUtils.success('Role Modified', `Successfully modified role ${targetRole}.`)] });
            } catch (err: any) {
                return interaction.reply({ embeds: [EmbedUtils.error('Modification Failed', err.message)] });
            }
        }
    },
} as Command;
