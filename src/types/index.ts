/**
 * Common type definitions for the podcast application
 */

// ============================================================================
// Host Types
// ============================================================================

/**
 * Social media link information
 */
export interface SocialLink {
  href: string;
  icon: string;
  title: string;
}

/**
 * Actor/Host information with social links
 */
export interface Actor {
  name: string;
  bio: string;
  avatar: string;
  color: string;
  socialLinks: SocialLink[];
}

/**
 * Host information for transcripts (simplified)
 */
export interface HostInfo {
  name: string;
  image: string;
  color: string;
  bio?: string;
}

// ============================================================================
// Episode Types
// ============================================================================

/**
 * ポッドキャストエピソードの型定義
 */
export interface PodcastEpisodeBase {
  title: string;
  description: string;
  duration: string;
  date: string;
  link: string;
  audioUrl: string;
  guid: string;
}

export interface PodcastEpisodeAdditionalMetadata {
  spotifyUrl?: string;
  youtubeUrl?: string;
  applePodcastUrl?: string;
  amazonMusicUrl?: string;
  newEpisodeIntroPostedToX?: boolean;
}

export interface PodcastEpisode
  extends PodcastEpisodeBase,
    PodcastEpisodeAdditionalMetadata {}

/**
 * RSSチャンネルの型定義
 */
export interface RSSChannel {
  title: string;
  description: string;
  link: string;
  language: string;
  image: string;
  episodes: PodcastEpisode[];
}

// ============================================================================
// Transcription Types
// ============================================================================

/**
 * Individual word in a transcript with timing and speaker information
 */
export interface TranscriptWord {
  text: string;
  start: number;
  end: number;
  confidence: number;
  speaker?: string;
}

/**
 * Speaker utterance in a transcript
 */
export interface TranscriptUtterance {
  speaker: string;
  text: string;
  start: number;
  end: number;
  words: TranscriptWord[];
}

/**
 * Full transcription result from AssemblyAI
 */
export interface TranscriptionResult {
  text: string;
  utterances: TranscriptUtterance[];
  words: TranscriptWord[];
  audio_duration: number;
}

/**
 * Stored transcript with metadata
 */
export interface TranscriptJSON {
  episodeGuid: string;
  episodeTitle: string;
  transcribedAt: string;
  duration: number;
  fullText: string;
  utterances: Array<{
    speaker: string;
    text: string;
    start: number;
    end: number;
    timestamp: string;
  }>;
  highlight1?: string;
  highlight2?: string;
  highlight3?: string;
}

// ============================================================================
// Spotify Types
// ============================================================================

/**
 * Spotify OAuth token response
 */
export interface SpotifyAuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

/**
 * Spotify episode object
 */
export interface SpotifyEpisode {
  id: string;
  name: string;
  external_urls: {
    spotify: string;
  };
}

/**
 * Spotify show episodes API response
 */
export interface SpotifyShowEpisodesResponse {
  items: SpotifyEpisode[];
  next: string | null;
  total: number;
}
