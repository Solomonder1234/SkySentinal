import { Message, PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import { EmbedUtils } from './EmbedUtils';

export class AutoMod {
    private static badWords = ['badword1', 'badword2', 'badword3']; // Replace with actual words or redundant list
    private static linkRegex = /(https?:\/\/[^\s]+)/g;
    private static spamMap = new Map<string, { count: number, lastMessage: number }>();

    public static async check(message: Message): Promise<boolean> {
        if (message.author.bot) return false;
        if (message.member?.permissions.has(PermissionFlagsBits.Administrator)) return false; // Admins bypass

        if (await this.checkProfanity(message)) return true;
        if (await this.checkLinks(message)) return true;
        if (await this.checkSpam(message)) return true;
        if (await this.checkCaps(message)) return true;

        return false;
    }

    private static async checkProfanity(message: Message): Promise<boolean> {
        const content = message.content.toLowerCase();
        const found = this.badWords.some(word => content.includes(word));

        if (found) {
            await message.delete().catch(() => { });
            const embed = EmbedUtils.error('AutoMod: Profanity Detected', `${message.author}, please watch your language.`);
            if (message.channel && message.channel.isTextBased() && !message.channel.isDMBased()) {
                const msg = await message.channel.send({ embeds: [embed] });
                setTimeout(() => msg.delete().catch(() => { }), 5000);
            }
            return true;
        }
        return false;
    }

    private static async checkLinks(message: Message): Promise<boolean> {
        // Links are now allowed globally
        return false;
        /*
        if (this.linkRegex.test(message.content)) {
            await message.delete().catch(() => { });
            const embed = EmbedUtils.error('AutoMod: Link Detected', `${message.author}, posting links is not allowed.`);
            if (message.channel && message.channel.isTextBased() && !message.channel.isDMBased()) {
                const msg = await message.channel.send({ embeds: [embed] });
                setTimeout(() => msg.delete().catch(() => { }), 5000);
            }
            return true;
        }
        return false;
        */
    }

    private static async checkSpam(message: Message): Promise<boolean> {
        const userData = this.spamMap.get(message.author.id) || { count: 0, lastMessage: 0 };
        const now = Date.now();

        if (now - userData.lastMessage < 2000) {
            userData.count++;
        } else {
            userData.count = 1;
        }

        userData.lastMessage = now;
        this.spamMap.set(message.author.id, userData);

        if (userData.count >= 5) {
            await message.delete().catch(() => { });
            const embed = EmbedUtils.error('AutoMod: Spam Detected', `${message.author}, please stop spamming.`);
            if (message.channel && message.channel.isTextBased() && !message.channel.isDMBased()) {
                const msg = await message.channel.send({ embeds: [embed] });
                setTimeout(() => msg.delete().catch(() => { }), 5000);
            }
            // Optionally timeout the user here
            return true;
        }
        return false;
    }

    private static async checkCaps(message: Message): Promise<boolean> {
        if (message.content.length < 10) return false;

        const capsCount = message.content.replace(/[^A-Z]/g, '').length;
        const totalCount = message.content.length;

        if (capsCount / totalCount > 0.7) {
            await message.delete().catch(() => { });
            const embed = EmbedUtils.error('AutoMod: Caps Detected', `${message.author}, please stop shouting.`);
            if (message.channel && message.channel.isTextBased() && !message.channel.isDMBased()) {
                const msg = await message.channel.send({ embeds: [embed] });
                setTimeout(() => msg.delete().catch(() => { }), 5000);
            }
            return true;
        }
        return false;
    }
}
