import { Command } from '../../lib/structures/Command';
import { ApplicationCommandType, Message, User } from 'discord.js';
import { EmbedUtils } from '../../utils/EmbedUtils';

export default {
    name: 'unnerd',
    description: 'Stop nerd reaction for a user (Prefix Only).',
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

        await client.database.prisma.userProfile.upsert({
            where: { id: targetUser.id },
            create: { id: targetUser.id, isNerded: false },
            update: { isNerded: false }
        });

        const embed = EmbedUtils.success('Nerd Mode Deactivated', `🤓 **${targetUser.username}** is no longer a nerd.`);
        await interaction.reply({ embeds: [embed] });
    },
} as Command;
