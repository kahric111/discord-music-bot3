require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const { Player } = require('discord-player');
const { DefaultExtractors } = require('@discord-player/extractor');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const player = new Player(client);
player.extractors.loadMulti(DefaultExtractors);

player.events.on('error', (queue, error) => {
    console.log(`[Greška u redu]: ${error.message}`);
});

player.events.on('playerError', (queue, error, track) => {
    console.log(`[Greška pri reprodukciji]: ${error.message}`);
});

client.once('ready', () => {
    console.log(`Bot je mrežan! Prijavljen kao ${client.user.tag}`);
});

const PREFIX = '!';

client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.content.startsWith(PREFIX)) return;

    const args = message.content.slice(PREFIX.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    if (command === 'play' || command === 'p') {
        const voiceChannel = message.member.voice.channel;
        if (!voiceChannel) return message.reply('Morate biti u glasovnom kanalu!');

        const query = args.join(' ');
        if (!query) return message.reply('Unesite naziv pjesme!');

        try {
            const { track } = await player.play(voiceChannel, query, {
                nodeOptions: {
                    metadata: message.channel,
                    leaveOnEnd: false,
                    leaveOnEmpty: true,
                    leaveOnEmptyCooldown: 300000
                }
            });

            return message.reply(`Sada svira: **${track.title}**`);
        } catch (e) {
            console.error(e);
            return message.reply('Došlo je do greške pri pronalaženju ili reprodukciji pjesme.');
        }
    }

    const queue = player.nodes.get(message.guild);

    if (command === 'stop') {
        if (!queue) return message.reply('Nema aktivne reprodukcije.');
        queue.delete();
        return message.reply('Muzika je zaustavljena!');
    }

    if (command === 'skip') {
        if (!queue || !queue.node.isPlaying()) return message.reply('Nema pjesme za preskakanje.');
        queue.node.skip();
        return message.reply('Pjesma je preskočena!');
    }
});

client.login(process.env.DISCORD_TOKEN);