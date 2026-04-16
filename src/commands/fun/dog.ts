import { Command } from '../../lib/structures/Command';
import { ApplicationCommandType } from 'discord.js';
import { EmbedUtils } from '../../utils/EmbedUtils';
import { AnimalService } from '../../lib/services/AnimalService';

export default {
    name: 'dog',
    description: 'Get a cute random dog picture.',
    category: 'Fun',
    type: ApplicationCommandType.ChatInput,
    run: async (client, interaction) => {
        const url = await AnimalService.getAnimalImage('dog');
        if (!url) {
            return interaction.reply({ content: 'Failed to fetch dog image. 🐶', ephemeral: true });
        }

        const embed = EmbedUtils.info('Random Dog', '')
            .setImage(url);

        await interaction.reply({ embeds: [embed] });
    },
} as Command;
