import { Command } from '../../lib/structures/Command';
import { ApplicationCommandType } from 'discord.js';
import { EmbedUtils } from '../../utils/EmbedUtils';
import { AnimalService } from '../../lib/services/AnimalService';

export default {
    name: 'bird',
    description: 'Get a cute random bird picture.',
    category: 'Fun',
    aliases: ['birb'],
    type: ApplicationCommandType.ChatInput,
    run: async (client, interaction) => {
        const url = await AnimalService.getAnimalImage('bird');
        if (!url) {
            return interaction.reply({ content: 'Failed to fetch bird image. 🐦', ephemeral: true });
        }

        const embed = EmbedUtils.info('Random Bird', '')
            .setImage(url);

        await interaction.reply({ embeds: [embed] });
    },
} as Command;
