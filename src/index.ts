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

client.start();
