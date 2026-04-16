import { SkyClient } from './lib/structures/SkyClient';
import { config } from 'dotenv';
import { validateEnv } from './utils/validateEnv';

config();
validateEnv();

// Patch BigInt for JSON serialization
(BigInt.prototype as any).toJSON = function () {
    return this.toString();
};

const client = new SkyClient();

process.on('unhandledRejection', (reason, promise) => {
    console.error('[Anti-Crash] Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err, origin) => {
    console.error('[Anti-Crash] Uncaught Exception:', err, 'origin:', origin);
});

client.start();
