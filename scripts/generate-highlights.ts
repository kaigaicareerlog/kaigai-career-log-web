import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { config } from "dotenv";

// Load environment variables from .env file
config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Generate highlights using Groq AI
 */
async function generateHighlights(fullText: string): Promise<string[]> {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    throw new Error("GROQ_API_KEY environment variable is not set");
  }

  // Truncate text to fit within token limits (approximately 15,000 characters ≈ 4,000 tokens)
  // Groq free tier has 12,000 token limit, we need to leave room for prompt and response
  const maxChars = 15000;
  const truncatedText =
    fullText.length > maxChars
      ? fullText.substring(0, maxChars) + "..."
      : fullText;

  if (fullText.length > maxChars) {
    console.log(
      `   Note: Transcript truncated from ${fullText.length} to ${maxChars} characters to fit API limits`
    );
  }

  const prompt = `Generate 3 viral highlights from this podcast episode. Each highlight should be in 140 Japanese characters maximum. These will be posted on X (Twitter) to go viral.

Target audience: Japanese people who want to have a career outside of Japan.

Requirements for each highlight:
- Must be shocking, controversial, or surprising to catch attention
- Use emotional triggers (fear, excitement, curiosity)
- Include specific numbers or facts when possible (e.g., "300-500人と競争", "4-5ヶ月かかった")
- Start with impact words like "衝撃", "知らないと損", "99%が失敗", "実は", "驚愕" etc.
- Create FOMO (fear of missing out) or urgency
- Make people want to click and read more
- Use conversational, punchy Japanese that feels authentic

Transcript:
${truncatedText}

Please provide exactly 3 viral-optimized highlights, one per line, without any numbering or bullet points.`;

  console.log("   Calling Groq API to generate highlights...");

  const response = await fetch(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Groq API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content.trim();

  // Parse the response - split by newlines and filter out empty lines
  const highlights = content
    .split("\n")
    .map((line: string) => line.trim())
    .filter((line: string) => line.length > 0);

  if (highlights.length !== 3) {
    console.warn(
      `   Warning: Expected 3 highlights but got ${highlights.length}`
    );
  }

  return highlights.slice(0, 3); // Take only first 3
}

/**
 * Main function to generate highlights for a transcript
 */
async function generateTranscriptHighlights(guid: string): Promise<void> {
  console.log(`\n✨ Generating highlights for: ${guid}\n`);

  // Load existing transcript
  const transcriptsDir = path.join(__dirname, "..", "public", "transcripts");
  const jsonPath = path.join(transcriptsDir, `${guid}.json`);

  if (!fs.existsSync(jsonPath)) {
    throw new Error(`Transcript not found: ${jsonPath}`);
  }

  const transcript = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));

  // Check if highlights already exist
  if (transcript.highlight1 || transcript.highlight2 || transcript.highlight3) {
    const answer = process.argv.includes("--force");
    if (!answer) {
      console.log("   Highlights already exist. Use --force to regenerate.");
      return;
    }
    console.log("   Regenerating highlights (--force flag used)...");
  }

  // Generate highlights
  const highlights = await generateHighlights(transcript.fullText);

  // Add highlights to transcript
  transcript.highlight1 = highlights[0] || "";
  transcript.highlight2 = highlights[1] || "";
  transcript.highlight3 = highlights[2] || "";

  // Save updated transcript
  fs.writeFileSync(jsonPath, JSON.stringify(transcript, null, 2), "utf-8");

  console.log(`\n✅ Highlights generated successfully!`);
  console.log(`   Highlight 1: ${transcript.highlight1}`);
  console.log(`   Highlight 2: ${transcript.highlight2}`);
  console.log(`   Highlight 3: ${transcript.highlight3}\n`);
}

// Main execution
const args = process.argv.slice(2).filter((arg) => !arg.startsWith("--"));

if (args.length < 1) {
  console.error("Usage: tsx scripts/generate-highlights.ts <guid> [--force]");
  console.error("\nExample:");
  console.error(
    "  tsx scripts/generate-highlights.ts cc15a703-73c7-406b-8abc-ad7d0a192d05"
  );
  console.error(
    "  tsx scripts/generate-highlights.ts cc15a703-73c7-406b-8abc-ad7d0a192d05 --force"
  );
  console.error("\nOptions:");
  console.error(
    "  --force    Regenerate highlights even if they already exist"
  );
  process.exit(1);
}

const [guid] = args;

generateTranscriptHighlights(guid)
  .then(() => {
    console.log("Done!");
  })
  .catch((error) => {
    console.error("\n❌ Error:", error.message);
    process.exit(1);
  });
