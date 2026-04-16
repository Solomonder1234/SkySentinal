import { createCanvas } from '@napi-rs/canvas';
import { AttachmentBuilder, GuildMember, User, Message } from 'discord.js';
import { SkyClient } from '../structures/SkyClient';
import { EmbedUtils } from '../../utils/EmbedUtils';

interface PendingCaptcha {
    code: string;
    member: GuildMember;
    timestamp: number;
}

export class CaptchaService {
    private client: SkyClient;
    private pending: Map<string, PendingCaptcha> = new Map();

    constructor(client: SkyClient) {
        this.client = client;
    }

    /**
     * Issues a DM challenge to a new member.
     */
    public async initiateGateway(member: GuildMember, customMessage?: string) {
        const code = this.generateCode(6);
        const buffer = await this.generateImage(code);
        const attachment = new AttachmentBuilder(buffer, { name: 'captcha.png' });

        this.pending.set(member.id, {
            code,
            member,
            timestamp: Date.now()
        });

        const dmEmbed = EmbedUtils.info(
            'Security Verification Required',
            customMessage || `Welcome to **${member.guild.name}**!\n\nTo prevent automated raids, we require all users to complete a quick verification.\n\n**Please type the code shown in the image below into this DM.**`
        );

        try {
            await member.send({ embeds: [dmEmbed], files: [attachment] });
            this.client.logger.info(`[Captcha] Issued challenge to ${member.user.tag}.`);
        } catch (err) {
            this.client.logger.warn(`[Captcha] Could not DM ${member.user.tag}.`);
            // Optionally: Post in a public verification-help channel if DMs are closed
        }
    }

    /**
     * Verifies a user's input.
     */
    public async handleDM(message: Message) {
        const entry = this.pending.get(message.author.id);
        if (!entry) return;

        // Cleanup if older than 15 minutes
        if (Date.now() - entry.timestamp > 15 * 60 * 1000) {
            this.pending.delete(message.author.id);
            return;
        }

        if (message.content.toUpperCase() === entry.code) {
            await message.reply({ 
                embeds: [EmbedUtils.success('Verification Successful', 'Access granted. Initializing your onboarding session...')] 
            });
            
            this.pending.delete(message.author.id);
            
            // Trigger the actual onboarding flow
            await this.client.onboarding.handleMemberJoin(entry.member);
        } else {
            await message.reply({ 
                embeds: [EmbedUtils.error('Verification Failed', 'Invalid code. Please try again! (Case insensitive)')] 
            });
        }
    }

    private generateCode(length: number): string {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Avoid ambiguous chars O, 0, I, 1
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    private async generateImage(text: string): Promise<Buffer> {
        const width = 250;
        const height = 100;
        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d');

        // Background
        ctx.fillStyle = '#2B2D31';
        ctx.fillRect(0, 0, width, height);

        // Noise/Distortion lines
        ctx.strokeStyle = '#5865F2';
        for (let i = 0; i < 5; i++) {
            ctx.beginPath();
            ctx.moveTo(Math.random() * width, Math.random() * height);
            ctx.lineTo(Math.random() * width, Math.random() * height);
            ctx.stroke();
        }

        // Text
        ctx.font = 'bold 48px sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Slightly rotate and skew text for anti-OCR
        ctx.translate(width / 2, height / 2);
        ctx.rotate((Math.random() - 0.5) * 0.2);
        ctx.fillText(text, 0, 0);

        return Buffer.from(await canvas.encode('png'));
    }
}
