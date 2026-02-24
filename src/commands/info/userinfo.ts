import { Command } from '../../lib/structures/Command';
import { ApplicationCommandOptionType, ApplicationCommandType, PermissionFlagsBits, Message, ChatInputCommandInteraction, EmbedBuilder, ActivityType, GuildMember } from 'discord.js';
import { EmbedUtils, Colors } from '../../utils/EmbedUtils';

export default {
    name: 'userinfo',
    description: 'Get information about a user.',
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: 'user',
            description: 'The user to get info for.',
            type: ApplicationCommandOptionType.User,
            required: false,
        },
    ],
    run: async (client, interaction) => {
        let user;
        let member;

        if (interaction instanceof Message) {
            const args = interaction.content.split(' ').slice(1);
            const userId = args[0]?.replace(/[<@!>]/g, '');
            if (userId) {
                try {
                    user = await client.users.fetch(userId);
                    member = await interaction.guild?.members.fetch(userId);
                } catch (e) {
                    return interaction.reply({ content: 'User not found.' });
                }
            } else {
                user = interaction.author;
                member = interaction.member as GuildMember;
            }
        } else {
            const chatInteraction = interaction as ChatInputCommandInteraction;
            user = chatInteraction.options.getUser('user') || interaction.user;
            member = (chatInteraction.options.getMember('user') || interaction.member) as GuildMember;
        }

        const embed = EmbedUtils.info(user.tag, 'Detailed profile and membership information.')
            .setThumbnail(user.displayAvatarURL({ size: 1024 }))
            .setAuthor({ name: user.tag, iconURL: user.displayAvatarURL() })
            .setColor(member?.displayColor || Colors.Info)
            .addFields(
                { name: 'ID', value: user.id, inline: true },
                { name: 'Username', value: user.username, inline: true },
                { name: 'Created At', value: `<t:${Math.floor(user.createdTimestamp / 1000)}:F> (<t:${Math.floor(user.createdTimestamp / 1000)}:R>)`, inline: false },
            );

        if (member) {
            embed.addFields(
                { name: 'Joined Server', value: `<t:${Math.floor(member.joinedTimestamp! / 1000)}:F> (<t:${Math.floor(member.joinedTimestamp! / 1000)}:R>)`, inline: false },
                { name: 'Roles', value: member.roles.cache.filter((r: any) => r.name !== '@everyone').map((r: any) => r).join(' ') || 'None', inline: false }
            );
            if (member.nickname) embed.addFields({ name: 'Nickname', value: member.nickname, inline: true });
        }

        if (interaction instanceof Message) {
            await interaction.reply({ embeds: [embed] });
        } else {
            await interaction.reply({ embeds: [embed] });
        }
    },
} as Command;
