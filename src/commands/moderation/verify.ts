import { Command } from '../../lib/structures/Command';
import { ApplicationCommandOptionType, ApplicationCommandType, PermissionFlagsBits, Message, ChatInputCommandInteraction, GuildMember } from 'discord.js';
import { EmbedUtils } from '../../utils/EmbedUtils';
import { Logger } from '../../utils/Logger';

export default {
    name: 'verify',
    description: 'Manually issues a captcha challenge to a user.',
    type: ApplicationCommandType.ChatInput,
    defaultMemberPermissions: PermissionFlagsBits.ManageMessages,
    options: [
        {
            name: 'user',
            description: 'The user to challenge with a captcha.',
            type: ApplicationCommandOptionType.User,
            required: true,
        }
    ],
    run: async (client, interaction) => {
        let user;
        let member;

        if (interaction instanceof Message) {
            const args = interaction.content.split(' ').slice(1);
            const userId = args[0]?.replace(/[<@!>]/g, '');
            if (!userId) return interaction.reply({ content: 'Please provide a user to verify.' });

            try {
                user = await client.users.fetch(userId);
                member = await interaction.guild?.members.fetch(userId);
            } catch (e) {
                return interaction.reply({ content: 'User not found.' });
            }
        } else {
            const chatInteraction = interaction as ChatInputCommandInteraction;
            user = chatInteraction.options.getUser('user', true);
            member = interaction.guild?.members.cache.get(user.id);
        }

        if (!member) {
            return interaction.reply({ content: 'User is not in the server.', ephemeral: true });
        }

        try {
            const auditMessage = `An administrative audit has been triggered for your account on **${interaction.guild?.name}**.\n\nTo maintain network integrity, please solve the security challenge below.\n\n**Type the code shown in the image below into this DM.**`;
            await client.captcha.initiateGateway(member, auditMessage);
            
            const successEmbed = EmbedUtils.success(
                'Captcha Issued',
                `A manual security verification challenge has been sent to **${user.tag}**.`
            );

            // Audit Log
            if (interaction.guild) {
                await Logger.modLog(
                    interaction.guild,
                    'Manual Captcha Issued',
                    interaction.author || interaction.user,
                    user,
                    'Manual security verification request.',
                    [],
                    'Blue'
                );
            }

            if (interaction instanceof Message) {
                await interaction.reply({ embeds: [successEmbed] });
            } else {
                await interaction.reply({ embeds: [successEmbed] });
            }
        } catch (error) {
            client.logger.error(`Failed to issue manual captcha to ${user.tag}:`, error);
            const errorEmbed = EmbedUtils.error('Process Failed', 'An error occurred while attempting to issue the captcha challenge.');
            if (interaction instanceof Message) {
                await interaction.reply({ embeds: [errorEmbed] });
            } else {
                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
        }
    },
} as Command;
