import { createCanvas, loadImage, SKRSContext2D } from '@napi-rs/canvas';
import { AttachmentBuilder } from 'discord.js';
import path from 'path';
import fs from 'fs';

export class CanvasUtils {
    /**
     * Generates a high-impact alert banner for weather or system broadcasts.
     */
    public static async createAlertBanner(title: string, subtitle: string, description: string, color: string): Promise<AttachmentBuilder> {
        const width = 1200;
        const height = 650;
        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d');

        // Main Background
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, width, height);

        // Header Background (Darker top bar)
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.fillRect(0, 0, width, 120);

        // Side Strip
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.fillRect(0, 0, 40, height);

        // Logo
        const logoPath = path.join(process.cwd(), 'Add a heading.png');
        if (fs.existsSync(logoPath)) {
            try {
                const logo = await loadImage(logoPath);
                ctx.drawImage(logo, 60, 20, 150, 80);
            } catch (e) {}
        }

        // Header Text
        ctx.font = 'bold 50px sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'left';
        ctx.fillText('SKYALERT NETWORK • EMERGENCY BROADCAST', 230, 75);

        // Secondary Header (The Alert Type)
        ctx.font = 'bold 85px sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(title.toUpperCase(), 60, 220);

        // Subtitle (Protocol/Level)
        ctx.font = 'bold 45px sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.fillText(subtitle.toUpperCase(), 60, 290);

        // Main Separator
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(60, 315, width - 120, 8);

        // "INTELLIGENCE BRIEF" Label
        ctx.font = 'bold 30px sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.fillText('BROADCAST INTELLIGENCE:', 60, 370);

        // Description (Multi-line)
        ctx.font = '42px sans-serif';
        ctx.fillStyle = '#ffffff';
        this.wrapText(ctx, description, 60, 430, width - 120, 50);

        // Footer Bar
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.fillRect(0, height - 60, width, 60);
        ctx.font = 'bold 24px sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.textAlign = 'center';
        ctx.fillText('SKYSENTINEL AV INTELLIGENCE MODULE • OPERATIONAL STATUS: ACTIVE', width / 2, height - 22);

        const buffer = await canvas.encode('png');
        return new AttachmentBuilder(buffer, { name: 'alert-banner.png' });
    }

    private static wrapText(ctx: SKRSContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
        const words = text.split(' ');
        let line = '';

        for (let n = 0; n < words.length; n++) {
            const testLine = line + words[n] + ' ';
            const metrics = ctx.measureText(testLine);
            const testWidth = metrics.width;
            if (testWidth > maxWidth && n > 0) {
                ctx.fillText(line, x, y);
                line = words[n] + ' ';
                y += lineHeight;
            } else {
                line = testLine;
            }
        }
        ctx.fillText(line, x, y);
    }
}
