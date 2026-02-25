import fs from 'fs';
import path from 'path';

const dbPath = path.join(__dirname, '../../local_config.json');

export class JSONDatabase {
    static read() {
        if (!fs.existsSync(dbPath)) return {};
        try {
            return JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
        } catch {
            return {};
        }
    }

    static write(data: any) {
        fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
    }

    static getGuildConfig(guildId: string) {
        return this.read()[guildId] || {};
    }

    static updateGuildConfig(guildId: string, updates: any) {
        const data = this.read();
        data[guildId] = { ...(data[guildId] || {}), ...updates };
        this.write(data);
    }

    static blockModmailUser(guildId: string, userId: string): boolean {
        const data = this.read();
        if (!data[guildId]) data[guildId] = {};
        if (!data[guildId].modmailBlocked) data[guildId].modmailBlocked = [];
        if (data[guildId].modmailBlocked.includes(userId)) return false;
        data[guildId].modmailBlocked.push(userId);
        this.write(data);
        return true;
    }

    static unblockModmailUser(guildId: string, userId: string): boolean {
        const data = this.read();
        if (!data[guildId] || !data[guildId].modmailBlocked) return false;
        const index = data[guildId].modmailBlocked.indexOf(userId);
        if (index === -1) return false;
        data[guildId].modmailBlocked.splice(index, 1);
        this.write(data);
        return true;
    }

    static isModmailBlocked(guildId: string, userId: string): boolean {
        const config = this.getGuildConfig(guildId);
        return config.modmailBlocked?.includes(userId) || false;
    }

    static getAllConfigs() {
        const data = this.read();
        return Object.keys(data).map(guildId => ({ id: guildId, ...data[guildId] }));
    }
}
