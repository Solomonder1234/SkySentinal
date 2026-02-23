import { z } from 'zod';

const envSchema = z.object({
    DISCORD_TOKEN: z.string().min(1),
    DATABASE_URL: z.string().optional(),
    GEMINI_API_KEY: z.string(),
    OPENAI_API_KEY: z.string().optional(),
    WEATHER_API_KEY: z.string().optional(),
    NODE_ENV: z.enum(['development', 'production']).default('development'),
});

declare global {
    namespace NodeJS {
        interface ProcessEnv extends z.infer<typeof envSchema> { }
    }
}

export function validateEnv() {
    const parsed = envSchema.safeParse(process.env);

    if (!parsed.success) {
        console.error('❌ Invalid environment variables:', parsed.error.format());
        process.exit(1);
    }
}
