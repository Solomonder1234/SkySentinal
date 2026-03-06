import { EmbedBuilder, ColorResolvable } from 'discord.js';
import { VERSION_STRING } from '../config';

export const Colors = {
    Success: '#57F287' as ColorResolvable,   // Sleek Modern Green
    Error: '#ED4245' as ColorResolvable,     // Sleek Modern Red
    Info: '#5865F2' as ColorResolvable,      // Blurple
    Warning: '#FEE75C' as ColorResolvable,   // Vibrant Yellow
    Primary: '#2B2D31' as ColorResolvable,   // Dark Glassmorphism Neutral
    Premium: '#EB459E' as ColorResolvable,   // Vibrant Fuchsia
    AV: '#FFD700' as ColorResolvable,        // Radiant Gold
};

export class EmbedUtils {
    private static FOOTER_TEXT = `SkySentinel Protocol • ${VERSION_STRING}`;
    private static BRAND_ICON = 'https://i.imgur.com/vHqXvU6.png'; // Shield/Placeholder

    private static base(color: ColorResolvable, type: string): EmbedBuilder {
        return new EmbedBuilder()
            .setColor(color)
            .setAuthor({
                name: `SkySentinel • ${type}`,
                iconURL: this.BRAND_ICON
            })
            .setFooter({
                text: this.FOOTER_TEXT,
                iconURL: this.BRAND_ICON
            })
            .setTimestamp();
    }

    public static success(title: string, description: string): EmbedBuilder {
        return this.base(Colors.Success, 'Operation Confirmed')
            .setTitle(`✦  ${title}`)
            .setDescription(`\n${description}`);
    }

    public static error(title: string, description: string): EmbedBuilder {
        return this.base(Colors.Error, 'System Interruption')
            .setTitle(`⨂  ${title}`)
            .setDescription(`**Warning:** A critical fault interrupted this sequence.\n\n${description}`);
    }

    public static info(title: string, description: string): EmbedBuilder {
        return this.base(Colors.Info, 'Intelligence Upload')
            .setTitle(`◈  ${title}`)
            .setDescription(`\n${description}`);
    }

    public static warning(title: string, description: string): EmbedBuilder {
        return this.base(Colors.Warning, 'Security Override')
            .setTitle(`⚠  ${title}`)
            .setDescription(`**Action Required**\n\n${description}`);
    }

    public static premium(title: string, description: string): EmbedBuilder {
        return this.base(Colors.AV, 'AV Intelligence Module')
            .setTitle(`❖  ${title}`)
            .setDescription(`\n${description}`);
    }

    public static default(title: string, description: string): EmbedBuilder {
        return this.base(Colors.Primary, 'Network Broadcast')
            .setTitle(`♢  ${title}`)
            .setDescription(`\n${description}`);
    }
}
