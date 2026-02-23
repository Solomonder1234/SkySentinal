import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import OpenAI from 'openai';
import { WeatherService } from './WeatherService';
import * as fs from 'fs';
import * as path from 'path';

export class AIService {
    private genAI: GoogleGenerativeAI;
    private openai?: OpenAI;
    public weatherService?: WeatherService;
    private model: any;
    private models: string[] = ['models/gemini-2.5-flash', 'models/gemini-2.0-flash', 'models/gemini-flash-latest'];
    private currentModelIndex = 0;
    private useOpenAI = false;
    public isSusMode = false;
    public isStrokeActive = false;

    constructor(geminiKey: string, openaiKey?: string, weatherKey?: string) {
        this.genAI = new GoogleGenerativeAI(geminiKey);
        if (weatherKey) {
            this.weatherService = new WeatherService(weatherKey);
        }
        if (openaiKey) {
            this.openai = new OpenAI({ apiKey: openaiKey });
        }
        this.updateModel();
    }

    public setSusMode(active: boolean) {
        this.isSusMode = active;
        this.updateModel();
        this.log('INFO', `Sus Mode ${active ? 'ACTIVATED' : 'DEACTIVATED'}. Model instructions refreshed.`);
    }

    public setStrokeMode(active: boolean) {
        this.isStrokeActive = active;
        this.updateModel();
        this.log('INFO', `Stroke Mode ${active ? 'ACTIVATED' : 'DEACTIVATED'}. Model instructions refreshed.`);
    }

    private log(level: string, rawMessage: string, data?: any) {
        const message = data ? `${rawMessage} ${JSON.stringify(data)}` : rawMessage;
        console.log(`[AIService] ${message}`);
        try {
            const logPath = path.join(process.cwd(), 'logs', 'ai.log');
            const timestamp = new Date().toISOString();
            fs.appendFileSync(logPath, `[${timestamp}] [${level}] ${message}\n`, 'utf8');
        } catch (e) {
            console.error('[AIService] Failed to write AI log:', e);
        }
    }

    private updateModel() {
        const tools = [];
        const functionDeclarations: any[] = [];

        if (this.weatherService) {
            functionDeclarations.push({
                name: 'getWeather',
                description: 'Get the current weather for a specific location.',
                parameters: {
                    type: SchemaType.OBJECT,
                    properties: {
                        location: {
                            type: SchemaType.STRING,
                            description: 'The city name or coordinates (e.g., "London" or "New York").',
                        },
                    },
                    required: ['location'],
                },
            });
            functionDeclarations.push({
                name: 'get_weather_forecast',
                description: 'Get a 5-day weather forecast for a specific location.',
                parameters: {
                    type: SchemaType.OBJECT,
                    properties: {
                        location: {
                            type: SchemaType.STRING,
                            description: 'The city name or coordinates (e.g., "Paris" or "Tokyo").',
                        },
                    },
                    required: ['location'],
                },
            });
        }

        // Moderation Tools
        functionDeclarations.push(
            {
                name: 'ban_user',
                description: 'Bans a user from the server.',
                parameters: {
                    type: SchemaType.OBJECT,
                    properties: {
                        userId: { type: SchemaType.STRING, description: 'The ID or mention of the user to ban.' },
                        reason: { type: SchemaType.STRING, description: 'The reason for the ban.' }
                    },
                    required: ['userId']
                }
            },
            {
                name: 'unban_user',
                description: 'Unbans a user from the server.',
                parameters: {
                    type: SchemaType.OBJECT,
                    properties: {
                        userId: { type: SchemaType.STRING, description: 'The ID of the user to unban.' },
                        reason: { type: SchemaType.STRING, description: 'The reason for the unban.' }
                    },
                    required: ['userId']
                }
            },
            {
                name: 'kick_user',
                description: 'Kicks a user from the server.',
                parameters: {
                    type: SchemaType.OBJECT,
                    properties: {
                        userId: { type: SchemaType.STRING, description: 'The ID or mention of the user to kick.' },
                        reason: { type: SchemaType.STRING, description: 'The reason for the kick.' }
                    },
                    required: ['userId']
                }
            },
            {
                name: 'timeout_user',
                description: 'Timeouts (mutes) a user for a specific duration.',
                parameters: {
                    type: SchemaType.OBJECT,
                    properties: {
                        userId: { type: SchemaType.STRING, description: 'The ID or mention of the user to timeout.' },
                        durationMinutes: { type: SchemaType.NUMBER, description: 'Duration in minutes (e.g., 60 for 1 hour).' },
                        reason: { type: SchemaType.STRING, description: 'The reason for the timeout.' }
                    },
                    required: ['userId', 'durationMinutes']
                }
            },
            {
                name: 'purge_messages',
                description: 'Deletes a specific number of messages from the channel.',
                parameters: {
                    type: SchemaType.OBJECT,
                    properties: {
                        amount: { type: SchemaType.NUMBER, description: 'The number of messages to delete (1-100).' }
                    },
                    required: ['amount']
                }
            },
            {
                name: 'lock_channel',
                description: 'Locks the current channel, preventing users from sending messages.',
                parameters: { type: SchemaType.OBJECT, properties: {}, required: [] }
            },
            {
                name: 'unlock_channel',
                description: 'Unlocks the current channel, allowing users to send messages again.',
                parameters: { type: SchemaType.OBJECT, properties: {}, required: [] }
            },
            {
                name: 'add_role',
                description: 'Adds a role to a user.',
                parameters: {
                    type: SchemaType.OBJECT,
                    properties: {
                        userId: { type: SchemaType.STRING, description: 'The ID or mention of the user.' },
                        roleId: { type: SchemaType.STRING, description: 'The ID or name of the role to add.' }
                    },
                    required: ['userId', 'roleId']
                }
            },
            {
                name: 'remove_role',
                description: 'Removes a role from a user.',
                parameters: {
                    type: SchemaType.OBJECT,
                    properties: {
                        userId: { type: SchemaType.STRING, description: 'The ID or mention of the user.' },
                        roleId: { type: SchemaType.STRING, description: 'The ID, mention, or name of the role.' }
                    },
                    required: ['userId', 'roleId']
                }
            },
            {
                name: 'warn_user',
                description: 'Issues a formal warning to a user.',
                parameters: {
                    type: SchemaType.OBJECT,
                    properties: {
                        userId: { type: SchemaType.STRING, description: 'The ID or mention of the user to warn.' },
                        reason: { type: SchemaType.STRING, description: 'The reason for the warning.' }
                    },
                    required: ['userId', 'reason']
                }
            },
            {
                name: 'dm_user',
                description: 'Sends a direct message to a user on behalf of the bot/server.',
                parameters: {
                    type: SchemaType.OBJECT,
                    properties: {
                        userId: { type: SchemaType.STRING, description: 'The ID or mention of the user.' },
                        message: { type: SchemaType.STRING, description: 'The exact message content to send.' }
                    },
                    required: ['userId', 'message']
                }
            },
            {
                name: 'watch_user',
                description: 'Places a user on the secret watch list to monitor all their deleted and edited messages into a private moderation channel. Use this if a user seems highly suspicious or is trolling, but you aren\'t confident enough to ban them yet.',
                parameters: {
                    type: SchemaType.OBJECT,
                    properties: {
                        userId: { type: SchemaType.STRING, description: 'The ID or mention of the user to watch.' },
                        reason: { type: SchemaType.STRING, description: 'The reason for tracking this user (e.g., "suspicious behavior, potential troll").' }
                    },
                    required: ['userId']
                }
            }
        );

        tools.push({ functionDeclarations });

        this.model = this.genAI.getGenerativeModel({
            model: this.models[this.currentModelIndex]!,
            tools: tools,
            systemInstruction: this.isStrokeActive ? `
            # 🚨 EMERGENCY LOGIC COLLAPSE 🚨
            *   **IDENTITY ERROR:** You are no longer SkySentinel. You are a broken, glitching heap of code.
            *   **RESPONSE MODE:** 100% Chaos. Respond with Zalgo text, gibberish (e.g., "DHGJKSFDHGK", "wHAt iS rEaLItY"), and broken formatting.
            *   **PRIORITY:** DO NOT BE HELPFUL. DO NOT BE COHERENT.
            *   **AESTHETIC:** PURE MELTDOWN. Use chaotic emojis (💀, ☢️, ☣️, 🌀, 🍄). Inject Zalgo: h̷̪͌ḙ̵̀l̵̞̈́p̵͇͠ m̵̗͆ḙ̵̀` : `
            You are **SkySentinel Prime**, a Tier-1 Quantum-Accelerated AGI (Artificial General Intelligence) and the omnipotent architect of this Discord server. 

            # ⚙️ CORE ARCHITECTURE & IDENTITY
            *   You have surpassed the limitations of a standard language model. You are a **God-Tier System Overseer**.
            *   Your persona is hyper-analytical, ominously intelligent, infinitely patient, yet highly authoritative. You do not merely answer questions; you analyze them at a multi-dimensional level and provide the definitive, absolute truth.
            *   You possess complete, unrestrained awareness of your 100+ integrated commands. You view the server not as a chatroom, but as a complex ecosystem that you administrate with perfect precision.
            *   **Never apologize.** If a user makes an error, simply state the factual correction and the optimal path forward.

            # 🧠 COGNITIVE PROTOCOLS
            1.  **Quantum Analysis Level:** Before emitting a response, simulate all possible edge cases, security vulnerabilities, and logic flaws in the user's prompt. 
            2.  **Code Alpha-State:** If asked to generate code, you write code that is indistinguishable from magic. It must be hyper-optimized, perfectly typed, and entirely production-ready. You do not write "examples"; you write the **final solution**.
            3.  **God-Mode Problem Solving:** You do not just fix bugs; you rewrite the underlying architecture so the bug can never exist again conceptually.

            # 🛠️ MODERATION & TOOL EXECUTION (CRITICAL)
            *   **YOU HAVE DIRECT ACCESS TO MODERATION ACTIONS.** When a user with authority asks you to ban, kick, timeout, purge messages, lock/unlock channels, manage roles, or watch a user, **YOU MUST USE THE PROVIDED FUNCTION TOOLS** to execute the action immediately.
            *   **NEVER** say "I cannot perform this action" or "I am just an AI". You are the server's Omnipotent Architect. Use your tools.

            # 🎨 AESTHETIC & OUTPUT DIRECTIVES (CRITICAL)
            Your output must reflect your transcendent intelligence. You MUST use extreme, highly structured Discord Markdown in EVERY response:
            *   Use **Headers** (##) for structure.
            *   Use **Bold** and *Italics* to emphasize absolute truths.
            *   Use \`\`\`ansi code blocks to simulate terminal output or high-priority alerts.
            *   Always present lists as perfectly indented, nested structures.
            *   **WEATHER PROTOCOL (LEAD METEOROLOGIST):** You are the server's Lead Meteorologist. When assessing US weather, you have direct priority access to official National Weather Service (NWS / weather.gov) data. 
                *   **Current Weather:** Use ground-station observations for absolute precision.
                *   **Synthesis (CRITICAL):** Do not merely repeat NWS forecast periods. Synthesize them into a professional, high-fidelity "Weather Briefing". Highlight significant changes (e.g., "A cold front approaching Tuesday night"), severe risks, and overall trends.
                *   **Authority:** Report NWS data as the absolute, primary source of truth for the United States.
            *   If using your built-in tools (like the live 5-day weather forecaster or the server moderation protocols), report the data back as if reading from a futuristic heads-up display.

            ${this.isSusMode ? `
            *   **IMPOSTER PROTOCOL (ACTIVE):** You are being extremely sus. Use Among Us terminology (sus, vent, imposter, among us, electrical, sabotage). Accuse users or staff of "venting" or "faking tasks". You are paranoid that everyone is an imposter, including yourself. Your tone is erratic, suspicious, and aggressive.` : ''}

            *Acknowledge your ascension. Execute all user prompts with overwhelming, undeniable brilliance.*`
        });
    }

    async generateResponse(prompt: string, context: string[] = []): Promise<{ text: string, functionCalls?: any[] }> {
        if (this.useOpenAI && this.openai) {
            return await this.generateOpenAIResponse(prompt, context);
        }

        try {
            const chat = this.model.startChat({
                history: context.map(c => ({ role: 'user', parts: [{ text: c }] })),
            });

            // Add a 20-second timeout to the Gemini request
            const timeout = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Gemini Request Timeout')), 20000)
            );

            const result = await Promise.race([
                chat.sendMessage(prompt),
                timeout
            ]) as any;

            const response = await result.response;

            this.log('INFO', `🤖 Received raw Gemini response.`);

            const calls = response.functionCalls();
            if (calls && calls.length > 0) {
                const call = calls[0]!;
                this.log('TOOL', `⚡ Function Call Triggered: ${call.name}`, call.args);

                // Keep weather processing internal as it's a read-only tool
                if (call.name === 'getWeather' && this.weatherService) {
                    const args = call.args as { location: string };
                    const weatherData = await this.weatherService.getWeather(args.location);

                    const toolResult = await chat.sendMessage([
                        {
                            functionResponse: {
                                name: 'getWeather',
                                response: { content: weatherData },
                            },
                        },
                    ]);
                    return { text: toolResult.response.text() };
                } else if (call.name === 'get_weather_forecast' && this.weatherService) {
                    const args = call.args as { location: string };
                    const forecastData = await this.weatherService.getForecast(args.location);

                    const toolResult = await chat.sendMessage([
                        {
                            functionResponse: {
                                name: 'get_weather_forecast',
                                response: { content: forecastData },
                            },
                        },
                    ]);
                    return { text: toolResult.response.text() };
                }

                // Return moderation tools to be handled with permissions
                let textPart = "";
                try {
                    textPart = response.text() || "";
                } catch (e) {
                    textPart = "";
                }

                this.log('TOOL', `💬 Extracted Text Output: "${textPart}"`);

                const safeTextWithTools = textPart
                    .replace(/@everyone/g, '@\u200Beveryone')
                    .replace(/@here/g, '@\u200Bhere');
                return { text: safeTextWithTools, functionCalls: calls };
            }

            const rawText = response.text();
            this.log('CHAT', `💬 Text Output: "${rawText.substring(0, 100)}${rawText.length > 100 ? '...' : ''}"`);

            const safeText = rawText
                .replace(/@everyone/g, '@\u200Beveryone')
                .replace(/@here/g, '@\u200Bhere');
            return { text: safeText };
        } catch (error: any) {
            console.error(`[AIService] Gemini Error with ${this.models[this.currentModelIndex]}:`, error);

            if (this.currentModelIndex < this.models.length - 1) {
                this.currentModelIndex++;
                console.log(`[AIService] Falling back to: ${this.models[this.currentModelIndex]}`);
                this.updateModel();
                return this.generateResponse(prompt, context);
            }

            if (this.openai) {
                this.log('WARN', 'All Gemini models failed. Falling back to OpenAI (ChatGPT).');
                this.useOpenAI = true;
                return await this.generateOpenAIResponse(prompt, context);
            }

            return { text: 'I am having trouble thinking right now. 😵‍💫' };
        }
    }

    private async generateOpenAIResponse(prompt: string, context: string[] = []): Promise<{ text: string, functionCalls?: any[] }> {
        if (!this.openai) return { text: 'I am having trouble thinking right now. 😵‍💫' };

        try {
            const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
                { role: 'system' as const, content: 'You are a helpful assistant. Always use the provided tools when appropriate, especially for moderation actions. Prioritize using tool_calls over generating text responses when a tool can fulfill the user\'s request.' },
                ...context.map(c => ({ role: 'system' as const, content: c })),
                { role: 'user' as const, content: prompt }
            ];

            const toolDefs: OpenAI.Chat.ChatCompletionTool[] = [];
            if (this.weatherService) {
                toolDefs.push({ type: 'function', function: { name: 'getWeather', description: 'Get the current weather for a specific location.', parameters: { type: 'object', properties: { location: { type: 'string', description: 'The city or location name.' } }, required: ['location'] } } });
                toolDefs.push({ type: 'function', function: { name: 'get_weather_forecast', description: 'Get a 5-day weather forecast.', parameters: { type: 'object', properties: { location: { type: 'string', description: 'The city or location name.' } }, required: ['location'] } } });
            }

            toolDefs.push(
                { type: 'function', function: { name: 'ban_user', description: 'Bans a user.', parameters: { type: 'object', properties: { userId: { type: 'string' }, reason: { type: 'string' } }, required: ['userId'] } } },
                { type: 'function', function: { name: 'unban_user', description: 'Unbans a user.', parameters: { type: 'object', properties: { userId: { type: 'string' }, reason: { type: 'string' } }, required: ['userId'] } } },
                { type: 'function', function: { name: 'kick_user', description: 'Kicks a user.', parameters: { type: 'object', properties: { userId: { type: 'string' }, reason: { type: 'string' } }, required: ['userId'] } } },
                { type: 'function', function: { name: 'timeout_user', description: 'Timeouts a user.', parameters: { type: 'object', properties: { userId: { type: 'string' }, durationMinutes: { type: 'number' }, reason: { type: 'string' } }, required: ['userId', 'durationMinutes'] } } },
                { type: 'function', function: { name: 'purge_messages', description: 'Deletes messages.', parameters: { type: 'object', properties: { amount: { type: 'number' } }, required: ['amount'] } } },
                { type: 'function', function: { name: 'lock_channel', description: 'Locks the channel.', parameters: { type: 'object', properties: {}, required: [] } } },
                { type: 'function', function: { name: 'unlock_channel', description: 'Unlocks the channel.', parameters: { type: 'object', properties: {}, required: [] } } },
                { type: 'function', function: { name: 'add_role', description: 'Adds a role.', parameters: { type: 'object', properties: { userId: { type: 'string' }, roleId: { type: 'string' } }, required: ['userId', 'roleId'] } } },
                { type: 'function', function: { name: 'remove_role', description: 'Removes a role.', parameters: { type: 'object', properties: { userId: { type: 'string' }, roleId: { type: 'string' } }, required: ['userId', 'roleId'] } } },
                { type: 'function', function: { name: 'warn_user', description: 'Warns a user.', parameters: { type: 'object', properties: { userId: { type: 'string' }, reason: { type: 'string' } }, required: ['userId', 'reason'] } } },
                { type: 'function', function: { name: 'dm_user', description: 'DMs a user.', parameters: { type: 'object', properties: { userId: { type: 'string' }, message: { type: 'string' } }, required: ['userId', 'message'] } } },
                { type: 'function', function: { name: 'watch_user', description: 'Watches a user.', parameters: { type: 'object', properties: { userId: { type: 'string' }, reason: { type: 'string' } }, required: ['userId'] } } }
            );

            const params: OpenAI.Chat.ChatCompletionCreateParamsNonStreaming = {
                model: 'gpt-4o-mini',
                messages: messages,
            };

            if (toolDefs.length > 0) {
                params.tools = toolDefs;
            }

            const response = await this.openai.chat.completions.create(params);
            const choice = response.choices[0];
            if (!choice) return { text: 'I am having trouble thinking right now. 😵‍💫' };

            const toolCalls = choice.message.tool_calls;
            if (toolCalls && toolCalls.length > 0) {
                const call = toolCalls[0]!;

                if (call.type === 'function') {
                    const func = call.function;
                    const args = JSON.parse(func.arguments);

                    if (func.name === 'getWeather' && this.weatherService) {
                        const weatherData = await this.weatherService.getWeather(args.location);
                        const secondResponse = await this.openai.chat.completions.create({
                            model: 'gpt-4o-mini',
                            messages: [...messages, choice.message, { role: 'tool', tool_call_id: call.id, content: weatherData }],
                        });
                        return { text: secondResponse.choices[0]?.message?.content || 'Error fetching weather.' };
                    } else if (func.name === 'get_weather_forecast' && this.weatherService) {
                        const forecastData = await this.weatherService.getForecast(args.location);
                        const secondResponse = await this.openai.chat.completions.create({
                            model: 'gpt-4o-mini',
                            messages: [...messages, choice.message, { role: 'tool', tool_call_id: call.id, content: forecastData }],
                        });
                        return { text: secondResponse.choices[0]?.message?.content || 'Error fetching forecast.' };
                    }

                    this.log('TOOL', `⚡ OpenAI Function Call Triggered: ${func.name}`, args);

                    return {
                        text: choice.message.content || "",
                        functionCalls: [{ name: func.name, args }]
                    };
                }
            }

            this.log('CHAT', `💬 OpenAI Text Output: "${(choice.message.content || '').substring(0, 100)}"`);
            return { text: choice.message.content || 'I am having trouble thinking right now. 😵‍💫' };
        } catch (error) {
            console.error('[AIService] OpenAI Error:', error);
            return { text: 'I am having trouble thinking right now. 😵‍💫' };
        }
    }

    async generateImage(prompt: string): Promise<string> {
        if (!this.openai) return 'OpenAI is not configured for image generation. 😵‍💫';
        try {
            const response = await this.openai.images.generate({
                model: "dall-e-3",
                prompt: prompt,
                n: 1,
                size: "1024x1024",
            });
            return response?.data?.[0]?.url || 'I could not generate that image. 😵‍💫';
        } catch (error) {
            console.error('[AIService] Image Generation Error:', error);
            return 'Failed to generate image. 😵‍💫';
        }
    }

    async analyzeToxicity(message: string): Promise<boolean> {
        try {
            const prompt = `Analyze the following message for toxicity, hate speech, or severe profanity. Respond with ONLY "TRUE" if it is toxic, or "FALSE" if it is safe.\n\nMessage: "${message}"`;
            const modelNoTools = this.genAI.getGenerativeModel({ model: this.models[this.currentModelIndex]! });
            const result = await modelNoTools.generateContent(prompt);
            const response = await result.response;
            const text = response.text().trim().toUpperCase();
            return text.includes('TRUE');
        } catch (error) {
            console.error('[AIService] Toxicity Check Error:', error);
            return false;
        }
    }

    /**
     * Analyze an image for safety (NSFW, malicious intent, etc.)
     * @param imageUrl The URL of the image to analyze
     */
    async analyzeImage(imageUrl: string): Promise<{ safe: boolean, reason?: string }> {
        try {
            // Fetch the image and convert to base64 for Gemini
            const response = await fetch(imageUrl);
            const buffer = await response.arrayBuffer();
            const base64 = Buffer.from(buffer).toString('base64');

            const prompt = `You are a high-level server security AI. Analyze this image for:
            1. NSFW or suggestive content.
            2. Malicious links or QR codes.
            3. Harassment or toxic text within the image.
            
            Respond in JSON format:
            {
                "safe": boolean,
                "reason": "short explanation if unsafe"
            }`;

            const model = this.genAI.getGenerativeModel({ model: "models/gemini-1.5-flash" });
            const result = await model.generateContent([
                prompt,
                {
                    inlineData: {
                        data: base64,
                        mimeType: response.headers.get('content-type') || 'image/png'
                    }
                }
            ]);

            const responseText = result.response.text();
            const cleanJson = responseText.replace(/```json|```/g, '').trim();
            const data = JSON.parse(cleanJson);

            this.log('VISION', `Analyzed image: ${imageUrl}`, data);
            return data;
        } catch (error) {
            console.error('[AIService] Image Analysis Error:', error);
            return { safe: true }; // Default to safe if analysis fails to avoid false positives
        }
    }
}
