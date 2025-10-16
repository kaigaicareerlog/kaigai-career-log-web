/**
 * Script to clean up an existing transcript using various methods
 * Usage: tsx scripts/cleanup-transcript.ts <episode-guid> <method>
 * Methods: simple, groq, gemini
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cost tracking
const COSTS = {
  groq: 0, // Free tier
  gemini: 0, // Free tier
};

const MAX_COST = parseFloat(process.env.MAX_CLEANUP_COST || "0.50"); // Default $0.50 max

/**
 * Groq API cleanup (FREE tier)
 */
async function cleanupGroq(text: string, apiKey: string): Promise<string> {
  const response = await fetch(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.1-70b-versatile",
        messages: [
          {
            role: "system",
            content:
              "日本語の音声認識テキストを整形してください。スペースを削除し、適切な句読点を追加してください。",
          },
          {
            role: "user",
            content: text,
          },
        ],
        temperature: 0.3,
        max_tokens: 2000,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Groq API error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content.trim();
}

/**
 * Google Gemini cleanup (FREE tier)
 */
async function cleanupGemini(text: string, apiKey: string): Promise<string> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `日本語の音声認識で生成されたテキストを整形してください。スペースを削除し、自然な句読点を追加してください。元の意味を保ってください。\n\nテキスト: ${text}`,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 2000,
        },
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.candidates[0].content.parts[0].text.trim();
}

/**
 * Main cleanup function
 */
async function cleanupTranscript(guid: string, method: string): Promise<void> {
  console.log(`\n🧹 Cleaning up transcript for: ${guid}`);
  console.log(`   Method: ${method}\n`);

  // Load existing transcript
  const transcriptsDir = path.join(__dirname, "..", "public", "transcripts");
  const jsonPath = path.join(transcriptsDir, `${guid}.json`);

  if (!fs.existsSync(jsonPath)) {
    throw new Error(`Transcript not found: ${jsonPath}`);
  }

  const transcript = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
  const utterances = transcript.utterances;

  console.log(`   Total utterances: ${utterances.length}`);
  console.log(`   Max cost allowed: $${MAX_COST.toFixed(2)}\n`);

  // Get API key
  let apiKey = "";
  if (method === "groq") {
    apiKey = process.env.GROQ_API_KEY || "";
    if (!apiKey) throw new Error("GROQ_API_KEY not set");
  } else if (method === "gemini") {
    apiKey = process.env.GEMINI_API_KEY || "";
    if (!apiKey) throw new Error("GEMINI_API_KEY not set");
  }

  let totalCost = 0;
  const cleanedUtterances = [];

  for (let i = 0; i < utterances.length; i++) {
    const utterance = utterances[i];
    console.log(
      `   Processing ${i + 1}/${utterances.length} (Cost: $${totalCost.toFixed(
        4
      )})...`
    );

    // Check cost limit
    if (totalCost >= MAX_COST) {
      console.log(`\n⚠️  Cost limit reached ($${MAX_COST}). Stopping cleanup.`);
      console.log(
        `   Cleaned ${i}/${utterances.length} utterances before stopping.\n`
      );
      break;
    }

    try {
      let cleanedText = "";

      if (method === "groq") {
        cleanedText = await cleanupGroq(utterance.text, apiKey);
        // Groq free tier - no cost
        await new Promise((resolve) => setTimeout(resolve, 2000)); // Respect rate limits
      } else if (method === "gemini") {
        cleanedText = await cleanupGemini(utterance.text, apiKey);
        // Gemini free tier - no cost
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      cleanedUtterances.push({
        ...utterance,
        text: cleanedText,
      });
    } catch (error) {
      console.error(`   ⚠️  Error: ${(error as Error).message}`);
      console.log(`   Using original text for utterance ${i + 1}`);
      cleanedUtterances.push(utterance);
    }
  }

  // Update transcript
  transcript.utterances = cleanedUtterances;
  transcript.fullText = cleanedUtterances.map((u: any) => u.text).join("");

  // Save cleaned transcript
  fs.writeFileSync(jsonPath, JSON.stringify(transcript, null, 2), "utf-8");

  console.log(`\n✨ Cleanup complete!`);
  console.log(`   Total cost: $${totalCost.toFixed(4)}`);
  console.log(
    `   Cleaned: ${cleanedUtterances.length}/${utterances.length} utterances\n`
  );
}

// Main execution
const args = process.argv.slice(2);

if (args.length < 2) {
  console.error("Usage: tsx scripts/cleanup-transcript.ts <guid> <method>");
  console.error("\nMethods:");
  console.error("  groq    - Groq AI (FREE tier, requires GROQ_API_KEY)");
  console.error(
    "  gemini  - Google Gemini (FREE tier, requires GEMINI_API_KEY)"
  );
  console.error("\nCost Protection:");
  console.error(`  Set MAX_CLEANUP_COST env var (default: $${MAX_COST})`);
  console.error("\nExamples:");
  console.error("  tsx scripts/cleanup-transcript.ts <guid> groq");
  console.error(
    "  MAX_CLEANUP_COST=1.00 tsx scripts/cleanup-transcript.ts <guid> gemini"
  );
  process.exit(1);
}

const [guid, method] = args;

if (!["groq", "gemini"].includes(method)) {
  console.error(`Invalid method: ${method}`);
  console.error("Valid methods: groq, gemini");
  process.exit(1);
}

cleanupTranscript(guid, method)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Error:", (error as Error).message);
    process.exit(1);
  });
