import { Command } from '../../lib/structures/Command';
import { ApplicationCommandOptionType, ApplicationCommandType, Message, ChatInputCommandInteraction } from 'discord.js';
import { EmbedUtils } from '../../utils/EmbedUtils';
import { AnimalService } from '../../lib/services/AnimalService';

export default {
    name: 'animal',
    description: 'Get a cute animal picture.',
    category: 'Fun',
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: 'type',
            description: 'The type of animal to fetch.',
            type: ApplicationCommandOptionType.String,
            required: true,
            choices: [
                { name: 'Dog', value: 'dog' },
                { name: 'Cat', value: 'cat' },
                { name: 'Fox', value: 'fox' },
                { name: 'Bird', value: 'bird' },
                { name: 'Panda', value: 'panda' },
                { name: 'Red Panda', value: 'red_panda' },
                { name: 'Koala', value: 'koala' },
                { name: 'Shiba', value: 'shiba' },
                { name: 'Duck', value: 'duck' },
                { name: 'Raccoon', value: 'raccoon' },
                { name: 'Kangaroo', value: 'kangaroo' }
            ]
        }
    ],
    run: async (client, interaction, args) => {
        let type = 'dog';
        if (interaction instanceof Message) {
            type = args[0]?.toLowerCase() || 'dog';
        } else {
            type = (interaction as ChatInputCommandInteraction).options.getString('type', true);
        }

        const url = await AnimalService.getAnimalImage(type);
        if (!url) {
            return interaction.reply({ content: `Unsupported animal type: \`${type}\`. Try cat, dog, bird, shiba, etc.`, ephemeral: true });
        }

        const embed = EmbedUtils.info(`Random ${type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')}`, '')
            .setImage(url);

        await interaction.reply({ embeds: [embed] });
    },
} as Command;
