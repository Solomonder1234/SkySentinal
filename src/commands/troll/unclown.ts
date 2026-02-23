import { Command } from '../../lib/structures/Command';
import { ApplicationCommandType, Message, User } from 'discord.js';
import { EmbedUtils } from '../../utils/EmbedUtils';

export default {
    name: 'unclown',
    description: 'Stop clown reaction for a user (Prefix Only).',
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
            create: { id: targetUser.id, isClowned: false },
            update: { isClowned: false }
        });

        const embed = EmbedUtils.success('Clown Mode Deactivated', `🤡 **${targetUser.username}** is no longer a certified clown.`);
        await interaction.reply({ embeds: [embed] });
    },
} as Command;
