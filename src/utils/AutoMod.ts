import { Message, PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import { EmbedUtils } from './EmbedUtils';

export class AutoMod {
    private static badWords = [
        // --- Scams & Phishing ---
        'free nitro', 'discord.gift/', 'discord-promo', 'nitro-gift', 'free-nitro', 'nitro-generator', 'dicsord.com', 'dlscord.app', 'discord-niltro.com', 'discord-events.com',
        'discord-app.net', 'steamcommunity-gift', 'csgo-skins-free', 'steam-promo.com', 'steam-free-game', 'steamcommunity.link', 'steamncommunity.com', 'steampowered.link', 'crypto-giveaway', 'send eth to',
        'double your btc', 'free bitcoin', 'wallet validate', 'metamask support', 'trustwallet help', 'free robux', 'robux generator', 'roblox-security.com', 'roblox-support.net', 'vbucks generator',
        'free v-bucks', 'fortnite skins free', 'roblox.com/promo', 'instagram-verify.com', 'twitter-badge.net', 'tiktok-view-bot',
        // --- Malware & Grabbers ---
        'grabify.link', 'iplogger.org', 'token grabber', 'hack your account', 'download this hack', 'free bypass script', 'krnl download', 'synapse x crack',
        'ip puller', 'ddos tool', 'booter network', 'stresser network', 'botnet for sale', 'discord token logger', 'roblox cookie logger', 'webhook spammer', 'discord server nuke tool', 'raid tool download',
        'mass dm bot free', 'discord nitro snaiper', 'giveaway joiner bot', 'selfbot download free', 'betterdiscord nitro plugin', 'vened discord client',
        // --- Financial Fraud & Generators ---
        'credit card generator', 'cvv dumps', 'paypal money adder', 'cashapp glitch', 'venmo exploit', 'amazon gift card gen', 'apple gift card gen', 'google play gen',
        'psn code gen', 'xbox live card gen', 'nintendo eshop gen', 'twitch prime gen', 'minecraft alt gen', 'optifine cape gen',
        // --- Piracy & Account Cracking ---
        'onlyfans bypass', 'premium snapchat hack', 'tinder gold hack', 'spotify premium mod', 'netflix lifetime account', 'hulu unban', 'disney plus crack',
        'nordvpn cracked', 'expressvpn mod',
        // --- Exploits & Game Cheats ---
        'gta 5 mod menu free', 'valorant aimbot free', 'apex esp download', 'warzone unlock tool', 'hwid spoofer free', 'hypixel unban hack', 'genshin impact crystals hack', 'clash of clans gems hack', 'brawl stars gems hack', 'pokemon go spoof hack', 'snapchat score booster', 'instagram followers bot', 'twitter likes bot', 'youtube subs bot',
        // --- General Toxicity ---
        'kill yourself', 'drink bleach', 'commit suicide'
    ];
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
