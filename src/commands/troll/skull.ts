import { Command } from '../../lib/structures/Command';
import { ApplicationCommandType, Message, User } from 'discord.js';
import { EmbedUtils } from '../../utils/EmbedUtils';

export default {
    name: 'skull',
    description: 'Toggle skull reaction for a user (Prefix Only).',
    category: 'Troll',
    type: ApplicationCommandType.ChatInput,
    prefixOnly: true,
    run: async (client, interaction) => {
        let targetUser: User;

        if (interaction instanceof Message) {
            if (interaction.mentions.users.size > 0) {
                targetUser = interaction.mentions.users.first()!;
            } else {
                return interaction.reply({ content: 'Please mention a user.' });
            }
        } else {
            return interaction.reply({ content: 'This command is only available as a prefix command. Use `/reaction` for slash commands.', ephemeral: true });
        }

        const profile = await client.database.prisma.userProfile.upsert({
            where: { id: targetUser.id },
            create: { id: targetUser.id, isSkulled: true },
            update: { isSkulled: true }
        });

        if (profile.isImmune) {
            return interaction.reply({ content: `🛡️ **${targetUser.tag}** is immune to troll reactions.` });
        }

        const embed = EmbedUtils.success('Skull Mode Activated', `💀 **${targetUser.username}** will now get a skull reaction on every message.`);
        await interaction.reply({ embeds: [embed] });
    },
} as Command;
