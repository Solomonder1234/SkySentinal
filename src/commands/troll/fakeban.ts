import { Command } from '../../lib/structures/Command';
import { ApplicationCommandOptionType, ApplicationCommandType, PermissionFlagsBits, Message, ChatInputCommandInteraction, User, EmbedBuilder } from 'discord.js';
import { EmbedUtils } from '../../utils/EmbedUtils';

export default {
    name: 'fakeban',
    description: 'Fake ban a user (sends them a DM).',
    category: 'Troll',
    type: ApplicationCommandType.ChatInput,
    defaultMemberPermissions: PermissionFlagsBits.Administrator,
    options: [
        {
            name: 'user',
            description: 'The user to fake ban.',
            type: ApplicationCommandOptionType.User,
            required: true,
        },
        {
            name: 'reason',
            description: 'Reason for the ban.',
            type: ApplicationCommandOptionType.String,
            required: false,
        },
    ],
    run: async (client, interaction) => {
        let targetUser: User;
        let reason = 'Violation of Terms of Service';

        if (interaction instanceof Message) {
            const args = interaction.content.split(' ').slice(1);
            if (interaction.mentions.users.size > 0) {
                targetUser = interaction.mentions.users.first()!;
                const reasonArg = args.slice(1).join(' ');
                if (reasonArg) reason = reasonArg;
            } else {
                return interaction.reply({ content: 'Please mention a user.' });
            }
        } else {
            const chatInteraction = interaction as ChatInputCommandInteraction;
            targetUser = chatInteraction.options.getUser('user', true);
            const reasonOption = chatInteraction.options.getString('reason');
            if (reasonOption) reason = reasonOption;
        }

        // Send hyper-realistic ban DM
        try {
            const guildIcon = interaction.guild?.iconURL();
            const banDmEmbed = EmbedUtils.error('Banned from Server', `\n**Server:** ${interaction.guild?.name || 'Unknown Server'}\n**Reason:** ${reason}\n\n**Appeal:** This ban is permanent and cannot be appealed at this time.\n`)
                .setThumbnail(guildIcon || null);

            if (interaction.guild) {
                banDmEmbed.setAuthor({
                    name: interaction.guild.name,
                    iconURL: guildIcon as string
                });
            }

            await targetUser.send({ embeds: [banDmEmbed] });

            const successEmbed = EmbedUtils.success('Deception Success', `The target **${targetUser.username}** has received a hyper-realistic ban notification.`);

            if (interaction instanceof Message) {
                await interaction.reply({ embeds: [successEmbed] });
                // Stealth: Delete user message after 2 seconds
                setTimeout(() => interaction.delete().catch(() => { }), 2000);
            } else {
                await interaction.reply({ embeds: [successEmbed], ephemeral: true });
            }

        } catch (error) {
            const failEmbed = EmbedUtils.error('Delivery Failed', `Could not DM **${targetUser.username}**. They likely have DMs disabled.`);
            if (interaction instanceof Message) {
                await interaction.reply({ embeds: [failEmbed] });
                setTimeout(() => interaction.delete().catch(() => { }), 2000);
            } else {
                await interaction.reply({ embeds: [failEmbed], ephemeral: true });
            }
        }
    },
} as Command;
