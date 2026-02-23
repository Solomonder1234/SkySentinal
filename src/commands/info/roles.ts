import { Command } from '../../lib/structures/Command';
import { ApplicationCommandOptionType, ApplicationCommandType, PermissionFlagsBits, Message, ChatInputCommandInteraction, GuildMember } from 'discord.js';
import { EmbedUtils } from '../../utils/EmbedUtils';

export default {
    name: 'roles',
    description: 'List roles of a user.',
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: 'user',
            description: 'The user to get roles for.',
            type: ApplicationCommandOptionType.User,
            required: false,
        },
    ],
    run: async (client, interaction) => {
        let member;

        if (interaction instanceof Message) {
            const args = interaction.content.split(' ').slice(1);
            const userId = args[0]?.replace(/[<@!>]/g, '');
            if (userId) {
                try {
                    member = await interaction.guild?.members.fetch(userId);
                } catch (e) {
                    return interaction.reply({ content: 'User not found.' });
                }
            } else {
                member = interaction.member as GuildMember;
            }
        } else {
            const chatInteraction = interaction as ChatInputCommandInteraction;
            member = (chatInteraction.options.getMember('user') || interaction.member) as GuildMember;
        }

        if (!member || !('roles' in member)) return interaction.reply({ content: 'Member not found or invalid.' });

        const roles = member.roles.cache
            .filter((r: any) => r.name !== '@everyone')
            .sort((a: any, b: any) => b.position - a.position)
            .map((r: any) => r.toString())
            .join(' ');

        const embed = EmbedUtils.info(`${member.user.username}'s Roles`, roles || 'No roles')
            .setColor(member.displayColor || 'Blue')
            .setFooter({ text: `SkySentinel AV • Total Roles: ${member.roles.cache.size - 1}` });

        if (interaction instanceof Message) {
            await interaction.reply({ embeds: [embed] });
        } else {
            await interaction.reply({ embeds: [embed] });
        }
    },
} as Command;
