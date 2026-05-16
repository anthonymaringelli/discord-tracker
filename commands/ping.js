import { SlashCommandBuilder } from "discord.js";

export const command = {
	data: new SlashCommandBuilder().setName('dogping').setDescription('Replies with Pong!'),
	async execute(interaction) {
		await interaction.reply('Pong!');
	},
};