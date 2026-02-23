import { Command } from '../../lib/structures/Command';
import { ApplicationCommandOptionType, ApplicationCommandType, AttachmentBuilder, Message, ChatInputCommandInteraction } from 'discord.js';
// @ts-ignore
import petPetGif from 'pet-pet-gif';

export default {
    name: 'petpet',
    description: 'Pet someone',
    category: 'Image',
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: 'user',
            description: 'The user to pet',
            type: ApplicationCommandOptionType.User,
            required: false
        }
    ],
    run: async (client, interaction) => {
        let targetUser;

        if (interaction instanceof Message) {
            if (interaction.mentions.users.size > 0) {
                targetUser = interaction.mentions.users.first()!;
            } else {
                targetUser = interaction.author;
            }
        } else {
            targetUser = (interaction as ChatInputCommandInteraction).options.getUser('user') || interaction.user;
        }

        try {
            // Defer if possible (interactions only)
            if (!(interaction instanceof Message) && interaction.isRepliable()) await interaction.deferReply();

            const avatar = targetUser.displayAvatarURL({ extension: 'png', size: 512 });
            const animatedGif = await petPetGif(avatar);

            const attachment = new AttachmentBuilder(animatedGif, { name: 'petpet.gif' });

            if (interaction instanceof Message) {
                await interaction.reply({ files: [attachment] });
            } else {
                await interaction.editReply({ files: [attachment] });
            }

        } catch (error) {
            console.error(error);
            const content = 'Failed to generate petpet gif.';
            if (interaction instanceof Message) {
                await interaction.reply(content);
            } else {
                if (interaction.deferred) await interaction.editReply(content);
                else await interaction.reply(content);
            }
        }
    },
} as Command;
