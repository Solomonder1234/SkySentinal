import { PermissionFlagsBits, Message } from 'discord.js';
import { Command } from '../../lib/structures/Command';
import { EmbedUtils } from '../../utils/EmbedUtils';

export default {
    name: 'onboardingsetup',
    description: 'Configure the onboarding system settings.',
    permissions: [PermissionFlagsBits.Administrator],
    category: 'Configuration',
    run: async (client, interaction) => {
        if (!interaction.guild || !interaction.member || !(interaction instanceof Message)) return;

        const args = interaction.content.split(' ').slice(1);
        const sub = args[0]?.toLowerCase();

        if (sub === 'questions') {
            const rawQuestions = args.slice(1).join(' ').split('|').map(q => q.trim()).filter(q => q.length > 0);
            if (rawQuestions.length === 0) {
                return interaction.reply({ embeds: [EmbedUtils.error('Invalid Setup', 'Please provide questions separated by a `|` symbol.\nExample: `!onboardingsetup questions Why do you want to join? | Who invited you?`')] });
            }

            await client.database.prisma.guildConfig.update({
                where: { id: interaction.guild.id },
                data: { onboardingQuestions: JSON.stringify(rawQuestions) }
            });

            return interaction.reply({ embeds: [EmbedUtils.success('Questions Updated', `Successfully set ${rawQuestions.length} onboarding questions.`)] });
        }

        if (sub === 'greeting') {
            const greeting = args.slice(1).join(' ');
            if (!greeting) return interaction.reply({ embeds: [EmbedUtils.error('Invalid Setup', 'Please provide a greeting message.')] });

            await client.database.prisma.guildConfig.update({
                where: { id: interaction.guild.id },
                data: { onboardingGreeting: greeting }
            });

            return interaction.reply({ embeds: [EmbedUtils.success('Greeting Updated', 'Successfully updated the onboarding welcome message.')] });
        }

        if (sub === 'role') {
            const role = interaction.mentions.roles.first() || interaction.guild.roles.cache.get(args[1] || '');
            if (!role) return interaction.reply({ embeds: [EmbedUtils.error('Invalid Setup', 'Please mention or provide an ID for the unverified role.')] });

            await client.database.prisma.guildConfig.update({
                where: { id: interaction.guild.id },
                data: { unverifiedRoleId: role.id }
            });

            return interaction.reply({ embeds: [EmbedUtils.success('Role Updated', `Successfully set <@&${role.id}> as the unverified role.`)] });
        }

        if (sub === 'category') {
            const categoryId = args[1];
            if (!categoryId) return interaction.reply({ embeds: [EmbedUtils.error('Invalid Setup', 'Please provide a Category ID.')] });

            await client.database.prisma.guildConfig.update({
                where: { id: interaction.guild.id },
                data: { onboardingChannelId: categoryId }
            });

            return interaction.reply({ embeds: [EmbedUtils.success('Category Updated', `Successfully set the onboarding category to \`${categoryId}\`.`)] });
        }

        const helpEmbed = EmbedUtils.info(
            'Onboarding Setup Help',
            'Use the following subcommands to configure onboarding:\n\n' +
            '`!onboardingsetup questions <Q1> | <Q2> | ...` - Set the interview questions.\n' +
            '`!onboardingsetup greeting <Message>` - Set the greeting embed description.\n' +
            '`!onboardingsetup role <@Role>` - Set the role given to unverified users.\n' +
            '`!onboardingsetup category <ID>` - Set the category where channels are created.'
        );

        return interaction.reply({ embeds: [helpEmbed] });
    },
} as Command;
