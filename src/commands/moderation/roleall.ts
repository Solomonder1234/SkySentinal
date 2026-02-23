import { Command } from '../../lib/structures/Command';
import { ApplicationCommandOptionType, ApplicationCommandType, PermissionFlagsBits, Message, ChatInputCommandInteraction, Role, TextChannel } from 'discord.js';
import { EmbedUtils } from '../../utils/EmbedUtils';

export default {
    name: 'roleall',
    description: 'Add a role to all users in the server (Be careful!).',
    type: ApplicationCommandType.ChatInput,
    defaultMemberPermissions: PermissionFlagsBits.Administrator,
    options: [
        {
            name: 'role',
            description: 'The role to give to everyone.',
            type: ApplicationCommandOptionType.Role,
            required: true,
        },
    ],
    run: async (client, interaction) => {
        let role: Role;

        if (interaction instanceof Message) {
            const args = interaction.content.split(' ').slice(1);
            const roleId = args[0]?.replace(/[<@&>]/g, '');
            if (!roleId) return interaction.reply({ content: 'Please provide a role.' });
            role = interaction.guild?.roles.cache.get(roleId) as Role;
        } else {
            const chatInteraction = interaction as ChatInputCommandInteraction;
            role = chatInteraction.options.getRole('role', true) as Role;
        }

        if (!interaction.guild || !role) return interaction.reply({ content: 'Role not found or not in a guild.' });

        if (interaction.guild.members.me?.roles.highest.position! <= role.position) {
            return interaction.reply({ content: 'I cannot manage this role. It is higher than my highest role.' });
        }

        await interaction.reply({ content: `Starting to add **${role.name}** to all members... This process will take time.` });

        let count = 0;
        let errors = 0;

        try {
            const members = await interaction.guild.members.fetch();
            for (const [id, member] of members) {
                if (!member.roles.cache.has(role.id)) {
                    try {
                        await member.roles.add(role);
                        count++;
                    } catch (e) {
                        errors++;
                    }
                }
            }

            const successEmbed = EmbedUtils.success('Role All Complete', `Added **${role.name}** to **${count}** members.\nFailed: ${errors}`);

            if (interaction instanceof Message) {
                const channel = interaction.channel as TextChannel;
                if (channel) await channel.send({ embeds: [successEmbed] });
            } else {
                await interaction.followUp({ embeds: [successEmbed] });
            }

        } catch (error) {
            if (interaction instanceof Message) {
                await interaction.reply({ content: 'An error occurred during the process.' });
            } else {
                await interaction.followUp({ content: 'An error occurred during the process.' });
            }
        }
    },
} as Command;
