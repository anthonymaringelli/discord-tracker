import dotenv from "dotenv";
import path from "path";


// Load .env from this script's directory so the script works regardless of cwd
const _dirname = path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]:\/)/, "$1");
dotenv.config({ path: path.join(_dirname, '.env') });

import { REST, Routes } from "discord.js";
import fs from "fs";


const commands = [];
// Grab all the command folders from the commands directory you created earlier
const dirname = path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]:\/)/, "$1");
const foldersPath = path.join(dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
	// skip folders that aren't commands (events contains event handlers)
	if (folder === 'events') continue;
	// Grab all the command files from the commands directory you created earlier
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith('.js'));
	// Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		// const command = require(filePath);
		try {
			const command_module = await import(`file://${filePath}`);
			// support both `export default { ... }` and named exports like `export const command = { ... }`
			const command = command_module.default ?? command_module.command ?? command_module;
			if (command && "data" in command && "execute" in command) {
				commands.push(command.data.toJSON());
			} else {
				console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
			}
        } catch (error) {
            console.error(`Error importing command from:`, error);
              
		}
	}
}

// Construct and prepare an instance of the REST module
const rest = new REST().setToken(process.env.bot_token);

// and deploy your commands!
(async () => {
	try {
		console.log(`Started refreshing ${commands.length} application (/) commands.`);

		// The put method is used to fully refresh all commands in the guild with the current set
		const data = await rest.put(Routes.applicationGuildCommands(process.env.clientId, process.env.guildId), { body: commands });

		console.log(`Successfully reloaded ${data.length} application (/) commands.`);
	} catch (error) {
		// And of course, make sure you catch and log any errors!
		console.error(error);
	}
})();