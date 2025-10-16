/**
 * Utility functions for audio transcription using AssemblyAI
 */

interface TranscriptWord {
  text: string;
  start: number;
  end: number;
  confidence: number;
  speaker?: string;
}

interface TranscriptUtterance {
  speaker: string;
  text: string;
  start: number;
  end: number;
  words: TranscriptWord[];
}

interface TranscriptionResult {
  text: string;
  utterances: TranscriptUtterance[];
  words: TranscriptWord[];
  audio_duration: number;
}

/**
 * Transcribe audio using AssemblyAI
 * @param audioUrl - URL of the audio file to transcribe
 * @param apiKey - AssemblyAI API key
 * @returns Transcription result with speaker diarization
 */
export async function transcribeAudio(
  audioUrl: string,
  apiKey: string
): Promise<TranscriptionResult> {
  const baseUrl = "https://api.assemblyai.com/v2";

  // Submit transcription job
  const uploadResponse = await fetch(`${baseUrl}/transcript`, {
    method: "POST",
    headers: {
      authorization: apiKey,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      audio_url: audioUrl,
      speaker_labels: true,
      language_code: "ja", // Japanese language
      punctuate: true,
      format_text: true,
    }),
  });

  if (!uploadResponse.ok) {
    throw new Error(`AssemblyAI upload failed: ${uploadResponse.statusText}`);
  }

  const { id } = await uploadResponse.json();
  console.log(`Transcription job submitted with ID: ${id}`);

  // Poll for completion
  let transcriptResponse;
  let attempts = 0;
  const maxAttempts = 120; // 10 minutes max

  while (attempts < maxAttempts) {
    await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait 5 seconds

    transcriptResponse = await fetch(`${baseUrl}/transcript/${id}`, {
      headers: {
        authorization: apiKey,
      },
    });

    if (!transcriptResponse.ok) {
      throw new Error(
        `AssemblyAI polling failed: ${transcriptResponse.statusText}`
      );
    }

    const result = await transcriptResponse.json();

    if (result.status === "completed") {
      console.log("Transcription completed successfully");
      return {
        text: result.text,
        utterances: result.utterances || [],
        words: result.words || [],
        audio_duration: result.audio_duration || 0,
      };
    } else if (result.status === "error") {
      throw new Error(`Transcription failed: ${result.error}`);
    }

    console.log(`Status: ${result.status}... waiting`);
    attempts++;
  }

  throw new Error("Transcription timed out");
}

/**
 * Format timestamp in MM:SS format
 * @param milliseconds - Time in milliseconds
 * @returns Formatted timestamp string
 */
export function formatTimestamp(milliseconds: number): string {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}`;
}

/**
 * Generate markdown transcript with speaker labels and timestamps
 * @param result - Transcription result from AssemblyAI
 * @returns Formatted markdown transcript
 */
export function generateMarkdownTranscript(
  result: TranscriptionResult
): string {
  let markdown = "# Transcript\n\n";

  if (result.utterances.length > 0) {
    markdown += "## Speakers\n\n";

    result.utterances.forEach((utterance) => {
      const timestamp = formatTimestamp(utterance.start);
      markdown += `**${utterance.speaker}** [${timestamp}]\n\n`;
      markdown += `${utterance.text}\n\n`;
    });
  } else {
    markdown += result.text;
  }

  return markdown;
}

/**
 * Generate JSON transcript with full metadata
 * @param result - Transcription result from AssemblyAI
 * @param episodeGuid - Episode GUID
 * @param episodeTitle - Episode title
 * @returns JSON transcript object
 */
export function generateJSONTranscript(
  result: TranscriptionResult,
  episodeGuid: string,
  episodeTitle: string
) {
  return {
    episodeGuid,
    episodeTitle,
    transcribedAt: new Date().toISOString(),
    duration: result.audio_duration,
    fullText: result.text,
    utterances: result.utterances.map((utterance) => ({
      speaker: utterance.speaker,
      text: utterance.text,
      start: utterance.start,
      end: utterance.end,
      timestamp: formatTimestamp(utterance.start),
    })),
  };
}

/**
 * Load transcript for an episode if it exists
 * @param episodeGuid - Episode GUID
 * @returns Transcript JSON or null if not found
 */
export async function loadTranscript(episodeGuid: string) {
  try {
    const response = await fetch(`/transcripts/${episodeGuid}.json`);
    if (!response.ok) {
      return null;
    }
    return await response.json();
  } catch (error) {
    console.error(`Failed to load transcript for ${episodeGuid}:`, error);
    return null;
  }
}
