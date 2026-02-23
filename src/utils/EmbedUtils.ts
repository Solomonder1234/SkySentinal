import { EmbedBuilder, ColorResolvable } from 'discord.js';

export const Colors = {
    Success: '#00FA9A' as ColorResolvable, // Spring Green
    Error: '#FF4500' as ColorResolvable,   // Orange Red
    Info: '#00BFFF' as ColorResolvable,    // Deep Sky Blue
    Warning: '#FFD700' as ColorResolvable, // Gold
    Primary: '#2B2D31' as ColorResolvable, // Discord's New Dark
    Premium: '#7289DA' as ColorResolvable, // Blurple for v6.1
    Supreme: '#FFD700' as ColorResolvable  // Gold for Supreme
};

export class EmbedUtils {
    private static FOOTER_TEXT = 'SkySentinel v6.1.0 • Supreme Design Edition';
    private static BRAND_ICON = 'https://i.imgur.com/vHqXvU6.png'; // Placeholder

    private static base(color: ColorResolvable, type: string): EmbedBuilder {
        return new EmbedBuilder()
            .setColor(color)
            .setAuthor({
                name: `SkySentinel Administrative Core | ${type}`,
                iconURL: this.BRAND_ICON
            })
            .setFooter({
                text: this.FOOTER_TEXT,
                iconURL: this.BRAND_ICON
            })
            .setTimestamp();
    }

    public static success(title: string, description: string): EmbedBuilder {
        return this.base(Colors.Success, 'Operations')
            .setTitle(`✅ ${title}`)
            .setDescription(`\`\`\`diff\n+ SUCCESS\n\`\`\`\n${description}`);
    }

    public static error(title: string, description: string): EmbedBuilder {
        return this.base(Colors.Error, 'System Failure')
            .setTitle(`❌ ${title}`)
            .setDescription(`\`\`\`diff\n- CRITICAL ERROR\n\`\`\`\n> ${description}`);
    }

    public static info(title: string, description: string): EmbedBuilder {
        return this.base(Colors.Info, 'Intelligence')
            .setTitle(`🌌 ${title}`)
            .setDescription(`\n${description}\n`);
    }

    public static warning(title: string, description: string): EmbedBuilder {
        return this.base(Colors.Warning, 'Security Alert')
            .setTitle(`⚠️ ${title}`)
            .setDescription(`\`\`\`fix\n[!] ACTION REQUIRED\n\`\`\`\n${description}`);
    }

    public static premium(title: string, description: string): EmbedBuilder {
        return this.base(Colors.Supreme, 'Supreme Intelligence')
            .setTitle(`💎 ${title}`)
            .setDescription(`\n${description}\n`);
    }
}
