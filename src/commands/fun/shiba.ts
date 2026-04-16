import { Command } from '../../lib/structures/Command';
import { ApplicationCommandType } from 'discord.js';
import { EmbedUtils } from '../../utils/EmbedUtils';
import { AnimalService } from '../../lib/services/AnimalService';

export default {
    name: 'shiba',
    description: 'Get a cute random shiba inu picture.',
    category: 'Fun',
    type: ApplicationCommandType.ChatInput,
    run: async (client, interaction) => {
        const url = await AnimalService.getAnimalImage('shiba');
        if (!url) {
            return interaction.reply({ content: 'Failed to fetch shiba image. 🐕', ephemeral: true });
        }

        const embed = EmbedUtils.info('Random Shiba', '')
            .setImage(url);

        await interaction.reply({ embeds: [embed] });
    },
} as Command;
