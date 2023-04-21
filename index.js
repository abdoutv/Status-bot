const ownersStatus = [];
const ownersNames = [];

const { readFileSync, writeFileSync } = require('fs');

var {
	owners,
	guildId,
} = JSON.parse(readFileSync("./config.json"));

var {
	channelId,
	messageId,
} = JSON.parse(readFileSync("./data.json"));


// Require the necessary discord.js classes
const { Client, Events, GatewayIntentBits, EmbedBuilder } = require('discord.js');

// Create a new client instance
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildPresences, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

// When the client is ready, run this code (only once)
// We use 'c' for the event parameter to keep it separate from the already defined 'client'
client.once(Events.ClientReady, async (c) => {
	console.log(`Ready! Logged in as ${c.user.tag}`);

	const g = await c.guilds.cache.get(guildId);

	for(ownerId of owners) {

		try {
			const owner = await g.members.fetch(ownerId);

			ownersNames[owner.id] = owner.user.username;

			switch(owner.presence.status) {
			case "offline":
				setOffline(owner.user.id, false);
				break;
			default:
				setOnline(owner.user.id, false);
				break;
			}
		}catch(e) {
			console.warn("Failed to fetch owner "+ownerId+" error message: "+e);
			console.warn("This might occur when the owner is offline, You may just ignore this warn.");
		}
	}

	const channel = g.channels.cache.get(channelId);

	if(channel && channel.isTextBased()) {
		try {
			message = await channel.messages.fetch(messageId);
		}catch(e) {
			console.warn("Failed to fetch bot message, error message:"+e);
		}
	}else {
		console.warn('Invalid channel id provided');
	}
});

client.on(Events.PresenceUpdate, (_, n) => {
	if(owners.includes(n.userId)) {
		ownersNames[n.user.id] = n.user.username;

		switch(n.status) {
		case "offline":
			setOffline(n.userId);
			break;
		default:
			setOnline(n.userId);
			break;
		}
	}
});

client.on(Events.MessageCreate, async (m) => {
	if(!owners.includes(m.author.id)) {
		return;
	}

	const args = m.content.trim().split(/ +/);
	const command = args.shift().toLowerCase();

	if(command === "!send-embed") {
		channelId = m.channel.id;

		const msg = await m.channel.send(".");

		messageId = msg.id;
		message = msg;

		writeFileSync("./data.json", JSON.stringify({channelId, messageId}))

		update();
	}

});

function setOffline(ownerId, u=true) {
	ownersStatus[ownerId] = 'offline';
	if(u) {
		update();
	}
}

function setOnline(ownerId, u=true) {
	ownersStatus[ownerId] = 'online';
	if(u) {
		update();
	}
}

async function update() {
	if(!channelId) return;

	if(!message) {
		if(messageId) {
			try {
				const c = client.channels.cache.get(channelId);

				message = await c.messages.fetch(messageId);

			}catch(e) {
				return;
			}
		}
	}

	let inService = false;
	for(const i in ownersStatus) {
		const s = ownersStatus[i];
		if(s === "online") {
			inService = true;
			break;
		}
	}

	
	let description = "";

	for(const id in ownersStatus) {
		const name = ownersNames[id];
		const status = ownersStatus[id];

		if(name === undefined) {
			continue;// this should never happen
		}

		description += `**${name}**\n`;
		description += (status === "online" ? "In Service - في الخدمة" : "Out of Service - خارج الخدمة")+"\n";
	}

	const embed = new EmbedBuilder()
	.setTitle("**Technical support case - حالة الدعم الفني**:pushpin:")
	.setDescription(description)
	.setColor(inService ? "#4A6AD5" : "#FF0000")
	.setImage(inService ? "https://media.discordapp.net/attachments/1096427920219701329/1096449093372489778/Untitled.png" : "https://media.discordapp.net/attachments/1096414304422613042/1096417581243568230/directline2.png?width=1394&height=78");

	try {
		await message.edit({ content: '', embeds: [embed] });
	}catch(e) {
		console.warn("Failed to edit the message, error message: "+e);
	}
}
// Log in to Discord with your client's token
client.login(process.env.token)


const express = require('express')
const app = express()
const port = 3000

app.get('/', (req, res) => {
  res.send(new Date())
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})