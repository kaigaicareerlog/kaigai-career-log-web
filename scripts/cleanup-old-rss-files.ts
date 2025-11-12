import * as fs from 'fs';
import * as path from 'path';
import { parseTimestampFromFilename } from '../src/utils/formatters.js';
import { createLogger } from '../src/utils/logger.js';

const logger = createLogger();

/**
 * Cleans up old RSS XML files, keeping only the newest one
 */
function cleanupRssXmlFiles(rssDir: string): void {
  logger.section('Cleaning up RSS XML files');

  const files = fs
    .readdirSync(rssDir)
    .filter((file) => file.endsWith('-rss-file.xml'))
    .map((file) => ({
      name: file,
      path: path.join(rssDir, file),
      date: parseTimestampFromFilename(file),
    }))
    .filter((file) => file.date !== null);

  if (files.length === 0) {
    logger.info('No RSS XML files found');
    return;
  }

  // Sort by date descending (newest first)
  files.sort((a, b) => b.date!.getTime() - a.date!.getTime());

  const newestFile = files[0];
  logger.info(`Keeping newest RSS XML: ${newestFile.name}`);

  // Delete all other files
  const filesToDelete = files.slice(1);
  if (filesToDelete.length > 0) {
    logger.info(`Deleting ${filesToDelete.length} old RSS XML file(s):`);
    filesToDelete.forEach((file) => {
      logger.info(`- ${file.name}`, 1);
      fs.unlinkSync(file.path);
    });
  } else {
    logger.info('No old RSS XML files to delete');
  }
}

/**
 * Cleans up episode JSON files older than the specified number of days
 */
function cleanupEpisodeFiles(rssDir: string, daysToKeep: number): void {
  logger.section('Cleaning up episode JSON files');
  logger.info(`Keeping files from the last ${daysToKeep} days`);

  const now = new Date();
  const cutoffDate = new Date(now.getTime() - daysToKeep * 24 * 60 * 60 * 1000);

  const files = fs
    .readdirSync(rssDir)
    .filter((file) => file.endsWith('-episodes.json'))
    .map((file) => ({
      name: file,
      path: path.join(rssDir, file),
      date: parseTimestampFromFilename(file),
    }))
    .filter((file) => file.date !== null);

  if (files.length === 0) {
    logger.info('No episode JSON files found');
    return;
  }

  const filesToDelete = files.filter((file) => file.date! < cutoffDate);

  if (filesToDelete.length > 0) {
    logger.info(
      `Deleting ${filesToDelete.length} episode file(s) older than ${cutoffDate.toISOString()}:`
    );
    filesToDelete.forEach((file) => {
      logger.info(`- ${file.name} (${file.date!.toISOString()})`, 1);
      fs.unlinkSync(file.path);
    });
  } else {
    logger.info('No old episode files to delete');
  }

  const keptFiles = files.filter((file) => file.date! >= cutoffDate);
  if (keptFiles.length > 0) {
    logger.info(`Keeping ${keptFiles.length} recent episode file(s):`);
    keptFiles.forEach((file) => {
      logger.info(`- ${file.name} (${file.date!.toISOString()})`, 1);
    });
  }
}

/**
 * Main cleanup function
 */
function main(): void {
  const rssDir = path.join(process.cwd(), 'public', 'rss');

  if (!fs.existsSync(rssDir)) {
    logger.error(`Error: RSS directory not found: ${rssDir}`);
    process.exit(1);
  }

  logger.info(`Cleaning up old RSS files in: ${rssDir}`);

  try {
    // Clean up RSS XML files (keep only the newest)
    cleanupRssXmlFiles(rssDir);

    // Clean up episode JSON files (keep files from last 3 days)
    const daysToKeep = 3;
    cleanupEpisodeFiles(rssDir, daysToKeep);

    logger.success('Cleanup completed successfully');
  } catch (error) {
    logger.error('Error during cleanup:', error);
    process.exit(1);
  }
}

// Run the script
main();
