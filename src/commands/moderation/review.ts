import { ApplicationCommandOptionType, ApplicationCommandType, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { Command } from '../../lib/structures/Command';

export default {
    name: 'review',
    description: 'Issue a formal DTA-style staff performance review.',
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: 'target',
            description: 'The staff member to ping and review.',
            type: ApplicationCommandOptionType.User,
            required: true,
        },
        {
            name: 'executive_role',
            description: 'The Executive role they should await a response from.',
            type: ApplicationCommandOptionType.Role,
            required: false,
        },
        {
            name: 'shr_role',
            description: 'The SHR role they should await a response from.',
            type: ApplicationCommandOptionType.Role,
            required: false,
        }
    ],
    run: async (client: any, interaction: any) => {
        let target;
        let execRole = null;
        let shrRole = null;

        // Legacy Prefix Command Handler
        if (interaction.content !== undefined) {
            const args = interaction.content.split(' ').slice(1);
            const userText = args[0]?.replace(/[<@!>]/g, '') || '';
            if (!userText) return interaction.reply({ content: 'Please provide a user to review (e.g., !review @User).' });
            
            try {
                target = await client.users.fetch(userText);
            } catch (e) {
                return interaction.reply({ content: 'User not found.' });
            }
        } else {
            // Native Slash Command Handler
            const chatInteraction = interaction as ChatInputCommandInteraction;
            target = chatInteraction.options.getUser('target', true);
            execRole = chatInteraction.options.getRole('executive_role');
            shrRole = chatInteraction.options.getRole('shr_role');
        }

        if (!target) return;

        const execPing = execRole ? `<@&${execRole.id}>` : 'the Executive team';
        const shrPing = shrRole ? `<@&${shrRole.id}>` : 'the SHR teams';

        const staffReviewEmbed = new EmbedBuilder()
            .setColor(0x2b2d31)
            .setTitle('STAFF PERFORMANCE REVIEW')
            .setAuthor({ name: 'DANSWORTH TRANSPORTATION AUTHORITY', iconURL: 'https://i.imgur.com/vHqXvU6.png' })
            .setDescription(`Welcome to your staff performance review, ${target.toString()}. Unfortunately, this ticket has not been opened under favorable circumstances.\n\nPlease await a response from ${execPing}, or a member of ${shrPing}.`)
            .setImage('https://i.imgur.com/vHqXvU6.png')
            .setFooter({ text: 'Do not ping any members of these teams.' });

        await interaction.reply({ content: target.toString(), embeds: [staffReviewEmbed] });
    }
} as Command;
