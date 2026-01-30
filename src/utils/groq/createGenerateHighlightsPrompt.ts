export function createGenerateHighlightsPrompt(truncatedText: string): string {
  const prompt = `Generate 3 engaging highlights from this podcast episode. Each highlight should be in 140 Japanese characters maximum. These will be posted on X (Twitter) and should naturally encourage readers to listen to the full podcast.

Target audience: Japanese people who want to have a career outside of Japan.

Requirements for each highlight:
- Extract the MOST interesting, valuable, or surprising insights from the actual content
- Be truthful and authentic - DO NOT exaggerate or make false claims
- Include specific numbers, facts, or concrete examples when they exist in the transcript
- Use varied, natural Japanese openings - avoid repetitive clickbait phrases
- Make it conversational and relatable, like sharing insider knowledge with a friend
- Focus on what's genuinely useful, surprising, or thought-provoking
- Each highlight should have a different tone and angle (e.g., one factual, one emotional, one actionable)
- End each highlight with a subtle call-to-action or hint to listen to the podcast (e.g., '詳しくはPodcastで話しています')

Writing style variations to use:
- Direct quotes or paraphrases from speakers
- Questions that spark curiosity
- Contrasts or comparisons ("〜だと思ってたけど、実際は〜")
- Personal stories or experiences
- Actionable insights or lessons
- Unexpected revelations or realizations

Transcript:
${truncatedText}

Please provide exactly 3 distinct highlights with varied styles, one per line, without any numbering or bullet points. Each highlight should naturally encourage readers to check out the full podcast episode.`;

  return prompt;
}
