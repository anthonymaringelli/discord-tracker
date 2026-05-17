import dotenv from "dotenv";
import path from "path";


// Load .env from this script's directory so the script works regardless of cwd
const _dirname = path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]:\/)/, "$1");
dotenv.config({ path: path.join(_dirname, '.env') });

import { REST, Routes } from "discord.js";
import fs from "fs";


const commands = [];
// Grab all the command files from the commands directory. Support both files directly
// inside `commands/` and commands grouped inside subfolders.
const dirname = path.dirname(new URL(import.meta.url).pathname).replace(/^\/( [A-Za-z]:\/)/, "$1");
const foldersPath = path.join(dirname, 'commands');

if (!fs.existsSync(foldersPath)) {
	console.error(`Commands folder not found at ${foldersPath}`);
	process.exit(1);
}

const entries = fs.readdirSync(foldersPath, { withFileTypes: true });

for (const entry of entries) {
	if (entry.isDirectory()) {
		const commandFiles = fs.readdirSync(path.join(foldersPath, entry.name)).filter((f) => f.endsWith('.js'));
		for (const file of commandFiles) {
			const filePath = path.join(foldersPath, entry.name, file);
			try {
				const command_module = await import(`file://${filePath}`);
				const command = command_module.default ?? command_module.command ?? command_module;
				if (command && 'data' in command && 'execute' in command) {
					commands.push(command.data.toJSON());
				} else {
					console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
				}
			} catch (error) {
				console.error(`Error importing command from ${filePath}:`, error);
			}
		}
	} else if (entry.isFile() && entry.name.endsWith('.js')) {
		const filePath = path.join(foldersPath, entry.name);
		try {
			const command_module = await import(`file://${filePath}`);
			const command = command_module.default ?? command_module.command ?? command_module;
			if (command && 'data' in command && 'execute' in command) {
				commands.push(command.data.toJSON());
			} else {
				console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
			}
		} catch (error) {
			console.error(`Error importing command from ${filePath}:`, error);
		}
	}
}

// Validate and normalize environment variables
const BOT_TOKEN = process.env.bot_token?.trim();
const CLIENT_ID = process.env.clientId?.trim();
const GUILD_ID = process.env.guildId?.trim();

if (!BOT_TOKEN || !CLIENT_ID || !GUILD_ID) {
	console.error('Missing one or more required environment variables: bot_token, clientId, guildId');
	console.error(`bot_token set: ${!!BOT_TOKEN}, clientId set: ${!!CLIENT_ID}, guildId set: ${!!GUILD_ID}`);
	process.exit(1);
}

// Construct and prepare an instance of the REST module (explicit v10)
const rest = new REST({ version: '10' }).setToken(BOT_TOKEN);

// and deploy your commands!
(async () => {
	try {
		console.log(`Started refreshing ${commands.length} application (/) commands.`);

		// Diagnostic: fetch the application this token belongs to and compare IDs
		try {
			const app = await rest.get(Routes.oauth2CurrentApplication());
			const appId = app?.id?.toString();
			console.log('Application id for provided token:', appId);
			if (appId !== CLIENT_ID) {
				console.warn(`Configured clientId (${CLIENT_ID}) does not match the application id for the provided token (${appId}).`);
				console.warn('If you intended to use a different application, update clientId or use the correct bot token.');
			}
		} catch (err) {
			console.warn('Could not fetch application info with provided token — it may be invalid or lack permissions.');
			console.warn('Error:', err?.message ?? err);
		}

		// The put method is used to fully refresh all commands in the guild with the current set
		const data = await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands });

		console.log(`Successfully reloaded ${data.length} application (/) commands.`);
	} catch (error) {
		// Provide extra guidance for common 403 issues
		if (error && error.code === 20012) {
			console.error('Discord API returned 403 — not authorized to manage commands for that application.');
			console.error('Common causes: the bot token does not belong to the application/clientId, the token is invalid, or the bot isn\'t registered/authorized for that guild.');
			console.error('Verify that the bot token in your .env belongs to the application with id:', CLIENT_ID);
			console.error('If the token was exposed, rotate it immediately in the Discord Developer Portal.');
		}
		// And of course, make sure you catch and log any other errors!
		console.error(error);
	}
})();





///////////////////////////////////////////////////////////////////////////


// import dotenv from "dotenv";
// import path from "path";


// // Load .env from this script's directory so the script works regardless of cwd
// const _dirname = path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]:\/)/, "$1");
// dotenv.config({ path: path.join(_dirname, '.env') });

// import { REST, Routes } from "discord.js";
// import fs from "fs";


// const commands = [];
// // Grab all the command folders from the commands directory you created earlier
// const dirname = path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]:\/)/, "$1");
// const foldersPath = path.join(dirname, 'commands');
// const commandFolders = fs.readdirSync(foldersPath);

// for (const folder of commandFolders) {
// 	// skip folders that aren't commands (events contains event handlers)
// 	if (folder === 'events') continue;
// 	// Grab all the command files from the commands directory you created earlier
// 	const commandsPath = path.join(foldersPath, folder);
// 	const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith('.js'));
// 	// Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
// 	for (const file of commandFiles) {
// 		const filePath = path.join(commandsPath, file);
// 		// const command = require(filePath);
// 		try {
// 			const command_module = await import(`file://${filePath}`);
// 			// support both `export default { ... }` and named exports like `export const command = { ... }`
// 			const command = command_module.default ?? command_module.command ?? command_module;
// 			if (command && "data" in command && "execute" in command) {
// 				commands.push(command.data.toJSON());
// 			} else {
// 				console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
// 			}
//         } catch (error) {
//             console.error(`Error importing command from:`, error);
              
// 		}
// 	}
// }

// // Construct and prepare an instance of the REST module
// const rest = new REST().setToken(process.env.bot_token);

// // and deploy your commands!
// (async () => {
// 	try {
// 		console.log(`Started refreshing ${commands.length} application (/) commands.`);

// 		// The put method is used to fully refresh all commands in the guild with the current set
// 		const data = await rest.put(Routes.applicationGuildCommands(process.env.clientId, process.env.guildId), { body: commands });

// 		console.log(`Successfully reloaded ${data.length} application (/) commands.`);
// 	} catch (error) {
// 		// And of course, make sure you catch and log any errors!
// 		console.error(error);
// 	}
// })();