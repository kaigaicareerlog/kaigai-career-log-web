/**
 * Amazon Music utilities for fetching podcast episode URLs
 *
 * Amazon Music doesn't have a public API, so we use browser automation
 * with Puppeteer to scrape episode information.
 */

export interface AmazonMusicEpisode {
  id: string;
  name: string;
  url: string;
}

/**
 * Extract show ID from Amazon Music URL
 * Example: https://music.amazon.co.jp/podcasts/118b5e6b-1f97-4c62-97a5-754714381b40
 * Returns: "118b5e6b-1f97-4c62-97a5-754714381b40"
 */
export function extractShowIdFromUrl(url: string): string | null {
  const match = url.match(/podcasts\/([a-zA-Z0-9-]+)/);
  return match ? match[1] : null;
}

/**
 * Get all episodes from an Amazon Music podcast show using Puppeteer
 * @param showId - The Amazon Music show ID
 * @param region - Amazon Music region (default: 'co.jp')
 * @returns Array of episodes with id, name, and url
 */
export async function getAmazonMusicEpisodes(
  showId: string,
  region: string = 'co.jp'
): Promise<AmazonMusicEpisode[]> {
  // Dynamically import puppeteer
  let puppeteer;
  try {
    puppeteer = await import('puppeteer');
  } catch (error) {
    throw new Error(
      'Puppeteer is not installed. Install with: npm install -D puppeteer'
    );
  }

  let browser = null;

  try {
    const url = `https://music.amazon.${region}/podcasts/${showId}`;

    browser = await puppeteer.default.launch({
      headless: 'new' as any,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ],
    });

    const page = await browser.newPage();

    // Set viewport and user agent
    await page.setViewport({ width: 1280, height: 800 });
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

    // Wait for episode list to be rendered
    await page
      .waitForSelector('a[href*="/episodes/"]', {
        timeout: 15000,
      })
      .catch(() => {
        // Continue even if selector not found
      });

    // Additional wait to ensure dynamic content is fully loaded
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Extract episode links
    const episodes = await page.evaluate((podcastShowId) => {
      const episodeLinks: Array<{ id: string; name: string; url: string }> = [];
      const links = document.querySelectorAll('a[href*="/episodes/"]');

      links.forEach((link) => {
        const href = link.getAttribute('href');
        if (href && href.includes(`/podcasts/${podcastShowId}/episodes/`)) {
          // Extract episode ID from href
          const match = href.match(/\/episodes\/([a-zA-Z0-9-]+)/);
          if (match) {
            const episodeId = match[1];
            let titleText = '';

            // Try to find title in aria-label first
            if (link.getAttribute('aria-label')) {
              titleText = link.getAttribute('aria-label') || '';
            }

            // If no aria-label, look for text in parent containers
            if (!titleText) {
              let current = link as Element;
              for (let i = 0; i < 3; i++) {
                if (current.parentElement) {
                  current = current.parentElement;

                  // Look for elements with substantial text
                  const textElements = current.querySelectorAll(
                    'div, span, p, h1, h2, h3, h4'
                  );
                  for (const el of textElements) {
                    const text = el.textContent?.trim();
                    // Look for text that looks like a title
                    if (
                      text &&
                      text.length > 5 &&
                      text.length < 200 &&
                      /[^\d\s]/.test(text)
                    ) {
                      titleText = text;
                      break;
                    }
                  }

                  if (titleText) break;
                }
              }
            }

            // Fallback: get text from the link itself
            if (!titleText && link.textContent) {
              titleText = link.textContent.trim();
            }

            // Clean up the title
            if (titleText) {
              titleText = titleText.replace(/\s+/g, ' ').trim();
            }

            episodeLinks.push({
              id: episodeId,
              name: titleText || `Episode ${episodeId}`,
              url: href.startsWith('http')
                ? href
                : `https://music.amazon.${window.location.hostname
                    .split('.')
                    .slice(-2)
                    .join('.')}${href}`,
            });
          }
        }
      });

      // Remove duplicates based on episode ID
      const unique: Array<{ id: string; name: string; url: string }> = [];
      const seen = new Set<string>();
      for (const episode of episodeLinks) {
        if (!seen.has(episode.id)) {
          seen.add(episode.id);
          unique.push(episode);
        }
      }

      return unique;
    }, showId);

    if (episodes.length === 0) {
      throw new Error(
        'Could not find any episodes. The page might require authentication or have a different structure.'
      );
    }

    return episodes;
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('timeout')) {
        throw new Error(
          'Page loading timed out. Amazon Music might require authentication or be unavailable.'
        );
      }
      throw error;
    }
    throw new Error('Unknown error fetching Amazon Music episodes');
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * Find Amazon Music episode URL by matching title
 * Uses the same fuzzy matching logic as other platforms
 */
export function findAmazonMusicEpisodeByTitle(
  episodes: AmazonMusicEpisode[],
  title: string
): string | null {
  // Filter out any null/undefined episodes
  const validEpisodes = episodes.filter((episode) => episode && episode.name);

  // Try exact match first
  const exactMatch = validEpisodes.find((episode) => episode.name === title);
  if (exactMatch) {
    return exactMatch.url;
  }

  // Try normalized match (remove extra spaces, normalize characters)
  const normalizedTitle = title.trim().replace(/\s+/g, ' ');
  const normalizedMatch = validEpisodes.find(
    (episode) => episode.name.trim().replace(/\s+/g, ' ') === normalizedTitle
  );
  if (normalizedMatch) {
    return normalizedMatch.url;
  }

  // Try partial match (title contains the search term or vice versa)
  const partialMatch = validEpisodes.find(
    (episode) => episode.name.includes(title) || title.includes(episode.name)
  );
  if (partialMatch) {
    return partialMatch.url;
  }

  return null;
}
