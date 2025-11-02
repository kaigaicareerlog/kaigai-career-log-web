/**
 * Simple logger utility for scripts with different log levels and formatting
 */

export type LogLevel = 'info' | 'success' | 'warning' | 'error' | 'debug';

export interface LoggerOptions {
  verbose?: boolean;
  prefix?: string;
}

const ICONS = {
  info: '🔍',
  success: '✅',
  warning: '⚠️',
  error: '❌',
  debug: '🐛',
  progress: '📊',
  processing: '🔎',
  skip: '⏭️',
  auth: '🔐',
} as const;

export class Logger {
  private verbose: boolean;
  private prefix: string;

  constructor(options: LoggerOptions = {}) {
    this.verbose = options.verbose ?? false;
    this.prefix = options.prefix ?? '';
  }

  private format(message: string, indent: number = 0): string {
    const indentation = '  '.repeat(indent);
    return `${this.prefix}${indentation}${message}`;
  }

  info(message: string, indent: number = 0): void {
    console.log(this.format(`${ICONS.info} ${message}`, indent));
  }

  success(message: string, indent: number = 0): void {
    console.log(this.format(`${ICONS.success} ${message}`, indent));
  }

  warning(message: string, indent: number = 0): void {
    console.log(this.format(`${ICONS.warning} ${message}`, indent));
  }

  error(message: string, indent: number = 0): void {
    console.error(this.format(`${ICONS.error} ${message}`, indent));
  }

  debug(message: string, indent: number = 0): void {
    if (this.verbose) {
      console.log(this.format(`${ICONS.debug} ${message}`, indent));
    }
  }

  progress(current: number, total: number, context: string, indent: number = 0): void {
    console.log(this.format(`${ICONS.progress} ${context}: ${current}/${total}`, indent));
  }

  processing(item: string, indent: number = 1): void {
    console.log(this.format(`${ICONS.processing} Processing: "${item}"`, indent));
  }

  found(item: string, url: string, indent: number = 2): void {
    if (this.verbose) {
      console.log(this.format(`${ICONS.success} Found: ${url}`, indent));
    }
  }

  notFound(item: string, indent: number = 2): void {
    if (this.verbose) {
      console.log(this.format(`❌ Not found`, indent));
    }
  }

  skip(reason: string, indent: number = 0): void {
    console.log(this.format(`${ICONS.skip} ${reason}`, indent));
  }

  auth(message: string, indent: number = 0): void {
    console.log(this.format(`${ICONS.auth} ${message}`, indent));
  }

  section(title: string): void {
    console.log(`\n${title}`);
  }

  summary(stats: Record<string, number | string>): void {
    console.log(this.format(`\n${ICONS.progress} Summary:`, 0));
    for (const [key, value] of Object.entries(stats)) {
      console.log(this.format(`${key}: ${value}`, 1));
    }
  }

  list(items: string[], indent: number = 1): void {
    for (const item of items) {
      console.log(this.format(item, indent));
    }
  }
}

/**
 * Create a logger instance
 */
export function createLogger(options?: LoggerOptions): Logger {
  return new Logger(options);
}

