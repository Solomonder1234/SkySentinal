import { Command } from '../../lib/structures/Command';
import { ApplicationCommandOptionType, ApplicationCommandType, PermissionFlagsBits, Message, ChatInputCommandInteraction, User } from 'discord.js';
import { EmbedUtils } from '../../utils/EmbedUtils';

export default {
    name: 'reaction',
    description: 'Toggle persistent reactions for a user.',
    category: 'Troll',
    type: ApplicationCommandType.ChatInput,
    defaultMemberPermissions: PermissionFlagsBits.Administrator,
    options: [
        {
            name: 'type',
            description: 'The type of reaction.',
            type: ApplicationCommandOptionType.String,
            required: true,
            choices: [
                { name: 'Skull 💀', value: 'skull' },
                { name: 'Clown 🤡', value: 'clown' },
                { name: 'Nerd 🤓', value: 'nerd' },
                { name: 'Fish 🐟', value: 'fish' }
            ]
        },
        {
            name: 'action',
            description: 'Enable or disable the reaction.',
            type: ApplicationCommandOptionType.String,
            required: true,
            choices: [
                { name: 'Enable', value: 'enable' },
                { name: 'Disable', value: 'disable' }
            ]
        },
        {
            name: 'user',
            description: 'The user to target.',
            type: ApplicationCommandOptionType.User,
            required: true
        }
    ],
    run: async (client, interaction) => {
        let type: string;
        let action: string;
        let targetUser: User;

        if (interaction instanceof Message) {
            const args = interaction.content.split(' ').slice(1);
            // Expected: !reaction <type> <enable/disable> <user>
            if (args.length < 3) {
                return interaction.reply({ content: 'Usage: `!reaction <skull|clown|nerd|fish> <enable|disable> <@user>`' });
            }

            type = args[0]?.toLowerCase() || '';
            action = args[1]?.toLowerCase() || '';

            if (interaction.mentions.users.size > 0) {
                targetUser = interaction.mentions.users.first()!;
            } else {
                return interaction.reply({ content: 'Please mention a user.' });
            }
        } else {
            const chatInteraction = interaction as ChatInputCommandInteraction;
            type = chatInteraction.options.getString('type', true);
            action = chatInteraction.options.getString('action', true);
            targetUser = chatInteraction.options.getUser('user', true);
        }

        const isEnable = action === 'enable';
        const fieldMap: Record<string, string> = {
            skull: 'isSkulled',
            clown: 'isClowned',
            nerd: 'isNerded',
            fish: 'isFished'
        };

        const field = fieldMap[type];
        if (!field) return interaction.reply({ content: 'Invalid reaction type.', ephemeral: true });

        const profile = await client.database.prisma.userProfile.upsert({
            where: { id: targetUser.id },
            create: { id: targetUser.id, [field]: isEnable },
            update: { [field]: isEnable }
        });

        if (isEnable && profile.isImmune) {
            return interaction.reply({ content: `🛡️ **${targetUser.tag}** is immune to troll reactions.`, ephemeral: true });
        }

        const emojiMap: Record<string, string> = {
            skull: '💀',
            clown: '🤡',
            nerd: '🤓',
            fish: '🐟'
        };

        const title = isEnable ? 'Reaction Activated' : 'Reaction Deactivated';
        const description = isEnable
            ? `${emojiMap[type]} **${targetUser.username}** will now get this reaction on every message.`
            : `${emojiMap[type]} **${targetUser.username}** is no longer being targeted by this reaction.`;

        const embed = EmbedUtils.success(title, description);
        await interaction.reply({ embeds: [embed] });
    },
} as Command;
