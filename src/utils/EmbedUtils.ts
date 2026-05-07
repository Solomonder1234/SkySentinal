import { EmbedBuilder, ColorResolvable, AttachmentBuilder } from 'discord.js';
import { VERSION_STRING } from '../config';
import { CanvasUtils } from './CanvasUtils';

export const Colors = {
    Success: 5763719,
    Error: 15548997,
    Info: 5793266,
    Warning: 16705372,
    Primary: 2829617,
    Premium: 15418782,
    AV: 16766720,
    Emergency: 14690858
};

export interface BigResponse {
    content?: string;
    embeds: any[];
    files: AttachmentBuilder[];
}

export class EmbedUtils {
    private static FOOTER_TEXT = `SkySentinel Protocol • ${VERSION_STRING}`;
    private static BRAND_ICON = 'https://i.imgur.com/vHqXvU6.png';

    // --- STANDARD SYNCHRONOUS METHODS (FOR BACKWARD COMPATIBILITY) ---
    private static base(color: number, type: string): EmbedBuilder {
        return new EmbedBuilder()
            .setColor(color)
            .setAuthor({ name: `SkySentinel • ${type}`, iconURL: this.BRAND_ICON })
            .setFooter({ text: this.FOOTER_TEXT, iconURL: this.BRAND_ICON })
            .setTimestamp();
    }

    public static success(title: string, description: string): EmbedBuilder {
        return this.base(Colors.Success, 'Operation Confirmed').setTitle(`✦  ${title}`).setDescription(`\n${description}`);
    }

    public static error(title: string, description: string): EmbedBuilder {
        return this.base(Colors.Error, 'System Interruption').setTitle(`⨂  ${title}`).setDescription(`**Warning:** A critical fault interrupted this sequence.\n\n${description}`);
    }

    public static info(title: string, description: string): EmbedBuilder {
        return this.base(Colors.Info, 'Intelligence Upload').setTitle(`◈  ${title}`).setDescription(`\n${description}`);
    }

    public static warning(title: string, description: string): EmbedBuilder {
        return this.base(Colors.Warning, 'Security Override').setTitle(`⚠  ${title}`).setDescription(`**Action Required**\n\n${description}`);
    }

    public static premium(title: string, description: string): EmbedBuilder {
        return this.base(Colors.AV, 'AV Intelligence Module').setTitle(`❖  ${title}`).setDescription(`\n${description}`);
    }

    // --- NEW ASYNCHRONOUS BIG METHODS (RAW JSON + CANVAS) ---
    private static async bigBase(color: number, type: string, title: string, description: string): Promise<BigResponse> {
        const banner = await CanvasUtils.createAlertBanner(title, type, description, '#' + color.toString(16));
        const embed = {
            color: color,
            description: `### ${title}\n\n## ${type}\n\n${description}`,
            image: { url: 'attachment://alert-banner.png' },
            footer: { text: this.FOOTER_TEXT, icon_url: this.BRAND_ICON },
            timestamp: new Date().toISOString()
        };
        return { embeds: [embed], files: [banner] };
    }

    public static async bigSuccess(title: string, description: string): Promise<BigResponse> {
        return this.bigBase(Colors.Success, 'OPERATION CONFIRMED', title, description);
    }

    public static async bigError(title: string, description: string): Promise<BigResponse> {
        return this.bigBase(Colors.Error, 'SYSTEM INTERRUPTION', title, description);
    }

    public static async bigInfo(title: string, description: string): Promise<BigResponse> {
        return this.bigBase(Colors.Info, 'INTELLIGENCE UPLOAD', title, description);
    }

    public static async big(title: string, type: string, description: string, color: number): Promise<BigResponse> {
        const banner = await CanvasUtils.createAlertBanner(title, type, description, '#' + color.toString(16));
        const embed = {
            color: color,
            description: `### ${title}\n\n## ${type}\n\n${description}`,
            image: { url: 'attachment://alert-banner.png' },
            footer: { text: this.FOOTER_TEXT, icon_url: this.BRAND_ICON },
            timestamp: new Date().toISOString()
        };
        return { embeds: [embed], files: [banner] };
    }
}
