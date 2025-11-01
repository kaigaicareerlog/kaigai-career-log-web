import * as fs from 'fs/promises';
import * as path from 'path';

interface ChannelInfo {
  title: string;
  description: string;
  link: string;
  language: string;
  image: string;
}

/**
 * Extract text content from CDATA or regular text
 */
function extractText(text: string | undefined): string {
  if (!text) return '';

  // Remove CDATA wrapper
  const cdataMatch = text.match(/<!\[CDATA\[([\s\S]*?)\]\]>/);
  if (cdataMatch) {
    return cdataMatch[1].trim();
  }

  return text.trim();
}

/**
 * Extract content using regex
 */
function extractWithRegex(text: string, regex: RegExp): string {
  const match = text.match(regex);
  if (!match) return '';

  let content = match[1] || '';
  content = extractText(content);

  return content;
}

async function extractChannelInfo(xmlFilePath: string): Promise<ChannelInfo> {
  const xmlContent = await fs.readFile(xmlFilePath, 'utf-8');

  // Extract channel info from the RSS feed using regex
  const title = extractWithRegex(xmlContent, /<title>(.*?)<\/title>/);
  const description = extractWithRegex(
    xmlContent,
    /<description>(.*?)<\/description>/
  );
  const link = extractWithRegex(xmlContent, /<link>(.*?)<\/link>/);
  const language = extractWithRegex(xmlContent, /<language>(.*?)<\/language>/);

  // Extract iTunes image
  const imageMatch = xmlContent.match(/<itunes:image\s+href="([^"]+)"/);
  const image = imageMatch ? imageMatch[1] : '';

  const channelInfo: ChannelInfo = {
    title,
    description,
    link,
    language,
    image,
  };

  return channelInfo;
}

async function updateChannelInfo(
  xmlFilePath: string,
  outputPath: string
): Promise<void> {
  try {
    const newChannelInfo = await extractChannelInfo(xmlFilePath);

    let shouldUpdate = false;
    let existingChannelInfo: ChannelInfo | null = null;

    // Check if channel-info.json already exists
    try {
      const existingContent = await fs.readFile(outputPath, 'utf-8');
      existingChannelInfo = JSON.parse(existingContent);

      // Compare the data
      if (
        JSON.stringify(existingChannelInfo) !== JSON.stringify(newChannelInfo)
      ) {
        console.log('📝 Channel info has changed. Updating...');
        shouldUpdate = true;
      } else {
        console.log('✅ Channel info is up to date. No changes needed.');
        return;
      }
    } catch (error) {
      // File doesn't exist, create it
      console.log('📝 Creating new channel-info.json file...');
      shouldUpdate = true;
    }

    if (shouldUpdate) {
      // Ensure directory exists
      const dir = path.dirname(outputPath);
      await fs.mkdir(dir, { recursive: true });

      // Write the updated channel info
      await fs.writeFile(
        outputPath,
        JSON.stringify(newChannelInfo, null, 2),
        'utf-8'
      );

      console.log(
        `✅ Channel info ${existingChannelInfo ? 'updated' : 'created'} successfully at: ${outputPath}`
      );
      console.log('Channel Info:');
      console.log(`  Title: ${newChannelInfo.title}`);
      console.log(`  Link: ${newChannelInfo.link}`);
      console.log(`  Language: ${newChannelInfo.language}`);
      console.log(
        `  Description: ${newChannelInfo.description.substring(0, 100)}...`
      );
      console.log(`  Image: ${newChannelInfo.image}`);
    }
  } catch (error) {
    console.error('❌ Error updating channel info:', error);
    throw error;
  }
}

// Main execution
const args = process.argv.slice(2);

if (args.length < 1) {
  console.error(
    'Usage: npx tsx scripts/update-channel-info.ts <rss-xml-file> [output-path]'
  );
  console.error(
    'Example: npx tsx scripts/update-channel-info.ts public/rss/20251101-0815-rss-file.xml public/rss/channel-info.json'
  );
  process.exit(1);
}

const xmlFilePath = args[0];
const outputPath = args[1] || 'public/rss/channel-info.json';

updateChannelInfo(xmlFilePath, outputPath)
  .then(() => {
    console.log('✨ Done!');
  })
  .catch((error) => {
    console.error('❌ Failed:', error.message);
    process.exit(1);
  });
