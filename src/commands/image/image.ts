import { Command } from '../../lib/structures/Command';
import { ApplicationCommandOptionType, ApplicationCommandType, AttachmentBuilder, Message, ChatInputCommandInteraction } from 'discord.js';
import { createCanvas, loadImage, GlobalFonts } from '@napi-rs/canvas';
import { request } from 'undici';
import path from 'path';

// Load fonts if needed (none strictly required for these filters yet, but good practice)
// GlobalFonts.registerFromPath(path.join(__dirname, '..', '..', 'assets', 'fonts', 'Roboto-Regular.ttf'), 'Roboto');

export default {
    name: 'image',
    description: 'Image manipulation commands.',
    category: 'Image',
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: 'wasted',
            description: 'Apply GTA Wasted overlay.',
            type: ApplicationCommandOptionType.Subcommand,
            options: [{ name: 'user', description: 'User to waste', type: ApplicationCommandOptionType.User, required: false }]
        },
        {
            name: 'wanted',
            description: 'Create a Wanted poster.',
            type: ApplicationCommandOptionType.Subcommand,
            options: [{ name: 'user', description: 'User to want', type: ApplicationCommandOptionType.User, required: false }]
        },
        {
            name: 'jail',
            description: 'Put a user in jail.',
            type: ApplicationCommandOptionType.Subcommand,
            options: [{ name: 'user', description: 'User to jail', type: ApplicationCommandOptionType.User, required: false }]
        }
    ],
    run: async (client, interaction) => {
        if (interaction instanceof Message) return; // Not supporting message commands for complex subcommands yet
        const chatInteraction = interaction as ChatInputCommandInteraction;
        await chatInteraction.deferReply();

        const subcommand = chatInteraction.options.getSubcommand();
        const user = chatInteraction.options.getUser('user') || chatInteraction.user;
        const avatarUrl = user.displayAvatarURL({ extension: 'png', size: 512 });

        try {
            const { body } = await request(avatarUrl);
            const avatar = await loadImage(await body.arrayBuffer());

            const canvas = createCanvas(512, 512);
            const ctx = canvas.getContext('2d');

            ctx.drawImage(avatar, 0, 0, 512, 512);

            if (subcommand === 'wasted') {
                ctx.fillStyle = 'rgba(0, 0, 0, 0.4)'; // Gray tint
                ctx.fillRect(0, 0, 512, 512);

                // Keep it simple without external assets for now - draw text
                // Ideally we'd load a 'wasted.png' overlay
                // Let's use a grayscale filter effectively
                const imageData = ctx.getImageData(0, 0, 512, 512);
                const data = imageData.data;
                for (let i = 0; i < data.length; i += 4) {
                    const r = data[i] || 0;
                    const g = data[i + 1] || 0;
                    const b = data[i + 2] || 0;
                    const avg = (r + g + b) / 3;
                    data[i] = avg;
                    data[i + 1] = avg;
                    data[i + 2] = avg;
                }
                ctx.putImageData(imageData, 0, 0);

                ctx.font = 'bold 70px Sans';
                ctx.fillStyle = '#C54C5E'; // GTA Wasted Red-ish // Actually GTA V is more red/white, GTA SA is red
                ctx.textAlign = 'center';
                ctx.strokeStyle = 'black';
                ctx.lineWidth = 5;
                ctx.strokeText('WASTED', 256, 256);
                ctx.fillText('WASTED', 256, 256);
            }

            if (subcommand === 'wanted') {
                // Sepia tone
                const imageData = ctx.getImageData(0, 0, 512, 512);
                const data = imageData.data;
                for (let i = 0; i < data.length; i += 4) {
                    const r = data[i] || 0;
                    const g = data[i + 1] || 0;
                    const b = data[i + 2] || 0;
                    data[i] = r * 0.393 + g * 0.769 + b * 0.189;
                    data[i + 1] = r * 0.349 + g * 0.686 + b * 0.168;
                    data[i + 2] = r * 0.272 + g * 0.534 + b * 0.131;
                }
                ctx.putImageData(imageData, 0, 0);

                // Border
                ctx.lineWidth = 40;
                ctx.strokeStyle = '#3e2723'; // Dark brown
                ctx.strokeRect(0, 0, 512, 512);

                ctx.font = 'bold 80px Serif';
                ctx.fillStyle = '#3e2723';
                ctx.textAlign = 'center';
                ctx.fillText('WANTED', 256, 100);

                ctx.font = 'bold 40px Serif';
                ctx.fillText('DEAD OR ALIVE', 256, 450);
            }

            if (subcommand === 'jail') {
                // Draw bars
                ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'; // Darker
                ctx.fillRect(0, 0, 512, 512);

                ctx.fillStyle = '#424242'; // Gray bars
                const barWidth = 20;
                const gap = 60;

                for (let x = 0; x < 512; x += gap) {
                    ctx.fillRect(x, 0, barWidth, 512);
                }
            }

            const attachment = new AttachmentBuilder(await canvas.encode('png'), { name: `${subcommand}.png` });
            await interaction.editReply({ files: [attachment] });

        } catch (error) {
            console.error(error);
            await interaction.editReply('Failed to generate image.');
        }
    },
} as Command;
