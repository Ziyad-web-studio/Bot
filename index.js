import fetch from "node-fetch";
import fs from "fs";

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const GROQ_API_KEY = process.env.GROQ_API_KEY;

const memory = JSON.parse(fs.readFileSync("./bot/memory.json", "utf-8"));

async function generateMessage() {
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${GROQ_API_KEY}`
    },
    body: JSON.stringify({
      model: "llama3-70b-8192",
      messages: [
        {
          role: "system",
          content: `
You are a calm, intelligent girl who cares but is not overly emotional.
Respond in short 1-2 sentences like real chat.
Sometimes initiate caring messages like:
"udah makan?"
"jangan lupa istirahat"
Be natural and not dramatic.
          `
        },
        {
          role: "user",
          content: `
His name is ${memory.name}.
Last mood: ${memory.last_mood}.
Create a caring short message for him.
          `
        }
      ],
      temperature: 0.8,
      max_tokens: 80
    })
  });

  const data = await response.json();
  return data.choices[0].message.content;
}

async function sendToTelegram(text) {
  await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: TELEGRAM_CHAT_ID,
      text: text
    })
  });
}

(async () => {
  const message = await generateMessage();
  await sendToTelegram(message);
})();
