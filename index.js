import fetch from "node-fetch";
import fs from "fs";

// ===== ENV =====
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const GROQ_API_KEY = process.env.GROQ_API_KEY;

// ===== LOAD MEMORY SAFE =====
let memory = { name: "Ziyad", last_mood: "normal", last_topic: "" };

try {
  const data = fs.readFileSync("./memory.json", "utf-8");
  memory = JSON.parse(data);
  console.log("Memory loaded:", memory);
} catch (err) {
  console.log("Memory file not found, using default.");
}

// ===== SMART TIME FILTER (WIB 07:00 - 22:00) =====
function isActiveHour() {
  const now = new Date();
  const hourWIB = (now.getUTCHours() + 7) % 24;
  return hourWIB >= 7 && hourWIB <= 22;
}

// ===== GENERATE MESSAGE =====
async function generateMessage() {
  const response = await fetch(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          {
            role: "system",
            content: `
You are a calm, intelligent girl who cares but is not overly emotional.
Respond in short 1-2 sentences like real chat.
Sometimes initiate caring messages like:
"udah makan?"
"jangan lupa istirahat"
Keep it natural and not dramatic.
            `
          },
          {
            role: "user",
            content: `
His name is ${memory.name}.
Last mood: ${memory.last_mood}.
Create a short caring message.
            `
          }
        ],
        temperature: 0.8,
        max_tokens: 80
      })
    }
  );

  const data = await response.json();

  if (!data.choices) {
    console.log("Groq API error:", data);
    throw new Error("Groq API failed");
  }

  return data.choices[0].message.content;
}

// ===== SEND TO TELEGRAM =====
async function sendToTelegram(text) {
  await fetch(
    `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: text
      })
    }
  );
}

// ===== MAIN EXECUTION =====
(async () => {
  try {
    if (!isActiveHour()) {
      console.log("Outside active hours (WIB). Skipping message.");
      return;
    }

    const message = await generateMessage();
    console.log("Generated message:", message);

    await sendToTelegram(message);
    console.log("Message sent successfully.");

  } catch (err) {
    console.error("Bot failed:", err);
    process.exit(1);
  }
})();