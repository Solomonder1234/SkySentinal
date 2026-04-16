import fs from 'fs';
import path from 'path';

const dbPath = path.join(__dirname, '../../activity_results.json');

export class ActivityStore {
    static read(): Record<string, string[]> {
        if (!fs.existsSync(dbPath)) return {};
        try {
            return JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
        } catch {
            return {};
        }
    }

    static write(data: Record<string, string[]>) {
        fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
    }

    static recordVerification(messageId: string, userId: string): boolean {
        const data = this.read();
        if (!data[messageId]) {
            data[messageId] = [];
        }
        if (data[messageId].includes(userId)) {
            return false;
        }
        data[messageId].push(userId);
        this.write(data);
        return true;
    }

    static getResults(messageId: string): string[] {
        return this.read()[messageId] || [];
    }
}
