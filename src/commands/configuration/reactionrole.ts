import { Command } from '../../lib/structures/Command';
import { ApplicationCommandOptionType, ApplicationCommandType, PermissionFlagsBits, Message, ChatInputCommandInteraction } from 'discord.js';
import { EmbedUtils } from '../../utils/EmbedUtils';

export default {
    name: 'reactionrole',
    description: 'Manage reaction roles.',
    category: 'Configuration',
    type: ApplicationCommandType.ChatInput,
    defaultMemberPermissions: PermissionFlagsBits.Administrator,
    options: [
        {
            name: 'add',
            description: 'Add a reaction role mapping.',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: 'message_id',
                    description: 'The ID of the message to add reactions to.',
                    type: ApplicationCommandOptionType.String,
                    required: true,
                },
                {
                    name: 'emoji',
                    description: 'The emoji to react with.',
                    type: ApplicationCommandOptionType.String,
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
            description: 'Remove a reaction role mapping.',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: 'message_id',
                    description: 'The ID of the message.',
                    type: ApplicationCommandOptionType.String,
                    required: true,
                },
                {
                    name: 'emoji',
                    description: 'The emoji to remove.',
                    type: ApplicationCommandOptionType.String,
                    required: true,
                }
            ]
        },
        {
            name: 'list',
            description: 'List all reaction roles.',
            type: ApplicationCommandOptionType.Subcommand
        }
    ],
    run: async (client, interaction) => {
        const guildId = interaction.guildId!;
        let subcommand: string;
        let messageId: string | undefined;
        let emoji: string | undefined;
        let roleId: string | undefined;

        if (interaction instanceof Message) {
            await (interaction.channel as any).sendTyping();
            const args = interaction.content.split(' ').slice(1);
            subcommand = args[0]?.toLowerCase() || '';
            if (subcommand === 'add') {
                messageId = args[1];
                emoji = args[2];
                // Handle role mention or ID
                const roleMention = interaction.mentions.roles.first();
                roleId = roleMention?.id || args[3];
            } else if (subcommand === 'remove') {
                messageId = args[1];
                emoji = args[2];
            }
        } else {
            await (interaction as any).deferReply();
            const chatInteraction = interaction as ChatInputCommandInteraction;
            subcommand = chatInteraction.options.getSubcommand();
            messageId = chatInteraction.options.getString('message_id')!;
            emoji = chatInteraction.options.getString('emoji')!;
            roleId = chatInteraction.options.getRole('role')?.id;
        }

        if (subcommand === 'add') {
            if (!messageId || !emoji || !roleId) return interaction.reply({ content: 'Missing arguments for add.' });

            await client.database.prisma.reactionRole.create({
                data: {
                    guildId,
                    messageId: messageId as string,
                    emoji: emoji as string,
                    roleId: roleId as string
                }
            });

            // Try to add the reaction to the message
            try {
                const channel = interaction.channel;
                if (channel?.isTextBased()) {
                    const msg = await channel.messages.fetch(messageId);
                    if (msg) await msg.react(emoji);
                }
            } catch (err) {
                console.error('Failed to react to message for RR:', err);
            }

            return interaction.reply({ embeds: [EmbedUtils.success('Reaction Role Added', `Added mapping: ${emoji} -> <@&${roleId}> on message \`${messageId}\``)] });

        } else if (subcommand === 'remove') {
            if (!messageId || !emoji) return interaction.reply({ content: 'Missing arguments for remove.' });

            await client.database.prisma.reactionRole.deleteMany({
                where: {
                    guildId,
                    messageId,
                    emoji
                }
            });

            return interaction.reply({ embeds: [EmbedUtils.success('Reaction Role Removed', `Removed all mappings for ${emoji} on message \`${messageId}\``)] });

        } else if (subcommand === 'list') {
            const rrs = await client.database.prisma.reactionRole.findMany({
                where: { guildId }
            });

            if (rrs.length === 0) return interaction.reply({ content: 'No reaction roles configured.' });

            const description = rrs.map(r => `Message: \`${r.messageId}\` | ${r.emoji} -> <@&${r.roleId}>`).join('\n');
            return interaction.reply({ embeds: [EmbedUtils.info('Reaction Roles', description)] });
        }
    },
} as Command;
