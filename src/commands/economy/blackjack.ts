import { Command } from '../../lib/structures/Command';
import { ApplicationCommandType, ApplicationCommandOptionType, ChatInputCommandInteraction, Message, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, ComponentType } from 'discord.js';
import { EmbedUtils } from '../../utils/EmbedUtils';

const SUITS = ['♠️', '♥️', '♦️', '♣️'];
const VALUES = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

function createDeck() {
    const deck = [];
    for (const suit of SUITS) {
        for (const value of VALUES) {
            deck.push({ suit, value });
        }
    }
    return deck.sort(() => Math.random() - 0.5);
}

function calculateHand(hand: any[]) {
    let value = 0;
    let aces = 0;
    for (const card of hand) {
        if (card.value === 'A') {
            aces += 1;
            value += 11;
        } else if (['J', 'Q', 'K'].includes(card.value)) {
            value += 10;
        } else {
            value += parseInt(card.value);
        }
    }
    while (value > 21 && aces > 0) {
        value -= 10;
        aces -= 1;
    }
    return value;
}

export default {
    name: 'blackjack',
    description: 'Play a game of Blackjack against the dealer.',
    category: 'Economy',
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: 'bet',
            description: 'The amount you want to wager.',
            type: ApplicationCommandOptionType.Integer,
            required: true,
            minValue: 10,
        },
    ],
    run: async (client, interaction) => {
        const bet = (interaction instanceof Message) 
            ? parseInt(interaction.content.split(' ')[1] || '0') 
            : (interaction as ChatInputCommandInteraction).options.getInteger('bet', true);

        if (!bet || bet < 10) return interaction.reply('Minimum bet is $10.');

        const userId = interaction.member?.user.id!;
        const profile = await client.economy.getUserProfile(userId);

        if (profile.balance < BigInt(bet)) {
            return interaction.reply({ embeds: [EmbedUtils.error('Insufficient Funds', `You only have **$${profile.balance}** in your wallet.`)] });
        }

        // Deduct bet immediately
        await client.economy.removeWallet(userId, bet);

        const deck = createDeck();
        const playerHand = [deck.pop(), deck.pop()];
        const dealerHand = [deck.pop(), deck.pop()];

        const getHandString = (hand: any[]) => hand.map(c => `[${c.value}${c.suit}]`).join(' ');

        const createEmbed = (status: string, hideDealer: boolean = true) => {
            const playerVal = calculateHand(playerHand);
            const dealerVal = hideDealer ? '?' : calculateHand(dealerHand);
            const dealerShow = hideDealer ? `[${dealerHand[0]!.value}${dealerHand[0]!.suit}] [?]` : getHandString(dealerHand);

            return new EmbedBuilder()
                .setTitle('♠️ Sky Casino: Blackjack')
                .addFields(
                    { name: `Your Hand (${playerVal})`, value: getHandString(playerHand), inline: true },
                    { name: `Dealer Hand (${dealerVal})`, value: dealerShow, inline: true },
                    { name: 'Wager', value: `$${bet}`, inline: false }
                )
                .setColor(status === 'win' ? '#2ecc71' : status === 'lose' ? '#e74c3c' : '#f1c40f')
                .setFooter({ text: status === 'playing' ? 'Choosing your next move...' : `Game Over: ${status.toUpperCase()}` });
        };

        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder().setCustomId('bj_hit').setLabel('Hit').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('bj_stand').setLabel('Stand').setStyle(ButtonStyle.Secondary)
        );

        const msg = await interaction.reply({ embeds: [createEmbed('playing')], components: [row as any], fetchReply: true }) as Message;

        const collector = msg.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time: 60000,
            filter: i => i.user.id === userId
        });

        collector.on('collect', async (i) => {
            if (i.customId === 'bj_hit') {
                playerHand.push(deck.pop());
                const val = calculateHand(playerHand);
                if (val > 21) {
                    collector.stop('bust');
                    await i.update({ embeds: [createEmbed('lose', false)], components: [] });
                } else {
                    await i.update({ embeds: [createEmbed('playing')] });
                }
            } else if (i.customId === 'bj_stand') {
                collector.stop('stand');
                
                // Dealer Turn
                let dVal = calculateHand(dealerHand);
                while (dVal < 17) {
                    dealerHand.push(deck.pop());
                    dVal = calculateHand(dealerHand);
                }

                const pVal = calculateHand(playerHand);
                let result: 'win' | 'lose' | 'push' = 'lose';

                if (dVal > 21 || pVal > dVal) {
                    result = 'win';
                    await client.economy.addWallet(userId, bet * 2);
                } else if (dVal === pVal) {
                    result = 'push';
                    await client.economy.addWallet(userId, bet);
                }

                await i.update({ embeds: [createEmbed(result, false)], components: [] });
            }
        });

        collector.on('end', (collected, reason) => {
            if (reason === 'time') {
                msg.edit({ content: 'Game timed out.', components: [] }).catch(() => null);
            }
        });
    },
} as Command;
