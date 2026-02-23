import { Command } from '../../lib/structures/Command';
import { ApplicationCommandOptionType, ApplicationCommandType, PermissionFlagsBits, Message, ChatInputCommandInteraction, User, AttachmentBuilder } from 'discord.js';
import { EmbedUtils } from '../../utils/EmbedUtils';
import { createCanvas, loadImage } from '@napi-rs/canvas';
import axios from 'axios';

export default {
    name: 'rank',
    description: 'Check your rank and level.',
    category: 'Leveling',
    type: ApplicationCommandType.ChatInput,
    defaultMemberPermissions: PermissionFlagsBits.SendMessages,
    options: [
        {
            name: 'user',
            description: 'The user to check.',
            type: ApplicationCommandOptionType.User,
            required: false,
        },
    ],
    run: async (client, interaction) => {
        let targetUser: User;

        if (interaction instanceof Message) {
            targetUser = interaction.mentions.users.first() || interaction.author;
        } else {
            const chatInteraction = interaction as ChatInputCommandInteraction;
            targetUser = chatInteraction.options.getUser('user') || interaction.user;
        }

        const userProfile = await client.database.prisma.userProfile.findUnique({
            where: { id: targetUser.id }
        });

        if (!userProfile) {
            return interaction.reply({ content: `${targetUser.username} has no XP yet.` });
        }

        const currentXp = Number(userProfile.xp);
        const level = userProfile.level;

        // Quadratic Formula: Total XP = 100 * Level^2
        const nextLevelXp = 100 * Math.pow(level + 1, 2);
        const currentLevelXp = 100 * Math.pow(level, 2);

        const xpInLevel = currentXp - currentLevelXp;
        const xpRequiredForLevel = nextLevelXp - currentLevelXp;
        const progress = Math.min(Math.max(xpInLevel / xpRequiredForLevel, 0), 1);

        // Calculate Rank Position
        const rankPosition = await client.database.prisma.userProfile.count({
            where: { xp: { gt: userProfile.xp } }
        }) + 1;

        try {
            if (interaction instanceof ChatInputCommandInteraction) await interaction.deferReply();

            // Create Canvas
            const canvas = createCanvas(934, 282);
            const ctx = canvas.getContext('2d');

            // Background
            ctx.fillStyle = '#23272a';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Darker Overlay for content area
            ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
            ctx.beginPath();
            ctx.roundRect(20, 20, canvas.width - 40, canvas.height - 40, 20);
            ctx.fill();

            // Avatar
            const avatarUrl = targetUser.displayAvatarURL({ extension: 'png', size: 256 });
            const avatarResponse = await axios.get(avatarUrl, { responseType: 'arraybuffer' });
            const avatarImage = await loadImage(Buffer.from(avatarResponse.data));

            ctx.save();
            ctx.beginPath();
            ctx.arc(141, 141, 95, 0, Math.PI * 2, true);
            ctx.closePath();
            ctx.clip();
            ctx.drawImage(avatarImage, 46, 46, 190, 190);
            ctx.restore();

            // Border for Avatar
            ctx.strokeStyle = '#7289da';
            ctx.lineWidth = 10;
            ctx.beginPath();
            ctx.arc(141, 141, 95, 0, Math.PI * 2, true);
            ctx.stroke();

            // Text Styles
            ctx.font = 'bold 36px sans-serif';
            ctx.fillStyle = '#ffffff';

            // Username
            const name = targetUser.username;
            ctx.fillText(name, 270, 120);

            // Level & Rank
            ctx.font = '28px sans-serif';
            ctx.fillStyle = '#b9bbbe';
            ctx.fillText(`Level ${level.toLocaleString()}`, 270, 165);

            const rankText = `#${rankPosition.toLocaleString()}`;
            const rankWidth = ctx.measureText(rankText).width;
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 48px sans-serif';
            ctx.fillText(rankText, canvas.width - rankWidth - 50, 80);
            ctx.font = '24px sans-serif';
            ctx.fillStyle = '#7289da';
            ctx.fillText('RANK', canvas.width - rankWidth - 120, 80);

            // XP Text
            ctx.font = '24px sans-serif';
            ctx.fillStyle = '#ffffff';
            const xpText = `${xpInLevel.toLocaleString()} / ${xpRequiredForLevel.toLocaleString()} XP`;
            const xpWidth = ctx.measureText(xpText).width;
            ctx.fillText(xpText, canvas.width - xpWidth - 50, 210);

            // Progress Bar Background
            ctx.fillStyle = '#484b4e';
            ctx.beginPath();
            ctx.roundRect(270, 220, 600, 30, 15);
            ctx.fill();

            // Progress Bar Fill
            ctx.fillStyle = '#7289da';
            ctx.beginPath();
            ctx.roundRect(270, 220, Math.max(600 * progress, 30), 30, 15);
            ctx.fill();

            const attachment = new AttachmentBuilder(await canvas.encode('png'), { name: 'rank-card.png' });

            if (interaction instanceof Message) {
                await interaction.reply({ files: [attachment] });
            } else {
                await interaction.editReply({ files: [attachment] });
            }
        } catch (error) {
            console.error('Error in rank command:', error);
            const msg = 'An error occurred while generating the rank card.';
            if (interaction instanceof Message) {
                await interaction.reply({ content: msg });
            } else {
                if (interaction.deferred) await interaction.editReply({ content: msg });
                else await interaction.reply({ content: msg, ephemeral: true });
            }
        }
    },
} as Command;
