// Importing necessary modules and initializing dotenv
import dotenv from "dotenv";
import path from "path";

// Load .env from this script's directory so the bot finds env vars regardless of cwd
const _dirname = path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]:\/)/, "$1");
dotenv.config({ path: path.join(_dirname, '.env') });

import fs from "fs";
import { Client, Collection, GatewayIntentBits } from "discord.js";
// import { createSchedule } from "./scheduler/createSchedule.js";


const client = new Client({ intents: [    
	GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
],  });


// starts the cron job
// createSchedule(client);

client.commands = new Collection();
// use previously computed _dirname for the commands folder
const foldersPath = path.join(_dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
	// skip non-command folders (events contains event handlers)
	// if (folder === 'events') continue;
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith('.js'));
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		// import using file:// URL and accept default or named exports
		const commandModule = await import(`file://${filePath}`);
		const command = commandModule.default ?? commandModule.command ?? commandModule;

		// Set a new item in the Collection with the key as the command name and the value as the exported module
		if (command && 'data' in command && 'execute' in command) {
			client.commands.set(command.data.name, command);
		} else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
};


// Load event handlers from commands/events
const eventsPath = path.join(_dirname, 'events');
if (fs.existsSync(eventsPath)) {
	const eventFiles = fs.readdirSync(eventsPath).filter((file) => file.endsWith('.js'));
	for (const file of eventFiles) {
		const filePath = path.join(eventsPath, file);
		try {
			const mod = await import(`file://${filePath}`);
			const event = mod.default ?? mod.event ?? mod;
			if (!event || !event.name ) {
				console.warn(`${filePath} problem with event module/name`);
				if (typeof event.execute !== 'function')
				console.warn(`${filePath} event not a function!`);
				continue;
			}

			if (event.once) {
				client.once(event.name, (...args) => event.execute(...args));
			} else {
				client.on(event.name, (...args) => event.execute(...args));
			}

			console.log(`Loaded event ${event.name} (${event.once ? 'once' : 'on'})`);
		} catch (err) {
			console.error(`Failed to load event ${filePath}:`, err);
		}
	}
} else {
	console.warn(`Events folder not found at ${eventsPath} — skipping event loading.`);
}




// Log in to Discord with your client's token
client.login(process.env.bot_token);

