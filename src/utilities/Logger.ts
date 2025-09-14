import fs from 'node:fs/promises';
import path from 'node:path';
import { format } from 'node:util';
import ansiColors from 'ansi-colors';
import { ensureDirExists } from './HelperFunctions';

type LogLevel = 'error' | 'warn' | 'info' | 'debug' | 'trace';
type Transport = 'console' | 'file' | 'both';

interface LoggerOptions {
  level?: LogLevel;
  transports?: Transport;
  filePath?: string;
  maxFileSize?: number; // in MB
  maxFiles?: number;
  timestamp?: boolean;
  colors?: boolean;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  trace: 0,
  debug: 1,
  info: 2,
  warn: 3,
  error: 4,
};

class Logger {
  private level: number;
  private transports: Transport;
  private filePath?: string;
  private maxFileSize: number;
  private maxFiles: number;
  private timestamp: boolean;
  private colors: boolean;
  private fileHandle?: fs.FileHandle;
  private currentFileSize = 0;

  constructor(options: LoggerOptions = {}) {
    this.level = LOG_LEVELS[options.level || 'info'];
    this.transports = options.transports || 'console';
    this.filePath = options.filePath;
    this.maxFileSize = options.maxFileSize || 10; // 10MB default
    this.maxFiles = options.maxFiles || 5;
    this.timestamp = options.timestamp ?? true;
    this.colors = options.colors ?? true;

    if (this.transports !== 'console' && !this.filePath) {
      throw new Error('File path must be specified for file logging');
    }
  }

  /**
   * Initialize logger (required for file transport)
   */
  async init(): Promise<void> {
    if (this.transports !== 'console' && this.filePath) {
      await ensureDirExists(this.filePath);
      this.fileHandle = await fs.open(this.filePath, 'a');
      const stats = await fs.stat(this.filePath);
      this.currentFileSize = stats.size;
    }
  }

  /**
   * Close logger (important for file handles)
   */
  async close(): Promise<void> {
    if (this.fileHandle) {
      await this.fileHandle.close();
    }
  }

  error(message: any, ...args: any[]): void {
    this.log('error', message, ...args);
  }

  warn(message: any, ...args: any[]): void {
    this.log('warn', message, ...args);
  }

  info(message: any, ...args: any[]): void {
    this.log('info', message, ...args);
  }

  debug(message: any, ...args: any[]): void {
    this.log('debug', message, ...args);
  }

  trace(message: any, ...args: any[]): void {
    this.log('trace', message, ...args);
  }

  /**
   * Core logging method
   */
  private log(level: LogLevel, message: any, ...args: any[]): void {
    if (LOG_LEVELS[level] < this.level) return;

    const formattedMessage = this.formatMessage(level, message, args);

    if (this.transports === 'console' || this.transports === 'both') {
      this.consoleLog(level, formattedMessage);
    }

    if ((this.transports === 'file' || this.transports === 'both') && this.fileHandle) {
      this.fileLog(formattedMessage + '\n');
    }
  }

  private formatMessage(level: LogLevel, message: any, args: any[]): string {
    const timestamp = this.timestamp ? new Date().toISOString() + ' ' : '';
    const levelStr = `[${level.toUpperCase()}]`.padEnd(7);
    const formatted = format(message, ...args);
    return `${timestamp}${levelStr} ${formatted}`;
  }

  private consoleLog(level: LogLevel, message: string): void {
    const colorMap = {
      error: ansiColors.red,
      warn: ansiColors.yellow,
      info: ansiColors.green,
      debug: ansiColors.blue,
      trace: ansiColors.gray,
    };

    const output = this.colors ? colorMap[level](message) : message;
    const stream = level === 'error' ? process.stderr : process.stdout;
    stream.write(output + '\n');
  }

  private async fileLog(message: string): Promise<void> {
    if (!this.fileHandle) return;

    // Rotate file if needed
    if (this.currentFileSize + message.length > this.maxFileSize * 1024 * 1024) {
      await this.rotateLogFile();
    }

    await this.fileHandle.write(message);
    this.currentFileSize += message.length;
  }

  private async rotateLogFile(): Promise<void> {
    if (!this.filePath || !this.fileHandle) return;

    await this.fileHandle.close();

    // Rotate existing files
    for (let i = this.maxFiles - 1; i > 0; i--) {
      const current = `${this.filePath}.${i}`;
      const next = `${this.filePath}.${i + 1}`;

      try {
        await fs.rename(current, next);
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
          this.consoleLog('error', `Failed to rotate log file: ${error}`);
        }
      }
    }

    // Move current to .1
    await fs.rename(this.filePath, `${this.filePath}.1`);

    // Create new log file
    this.fileHandle = await fs.open(this.filePath, 'a');
    this.currentFileSize = 0;
  }

  /**
   * Create a child logger with extended context
   */
  child(context: Record<string, any>): Logger {
    return new ChildLogger(this, context);
  }
}

class ChildLogger extends Logger {
  constructor(
    private parent: Logger,
    private context: Record<string, any>,
  ) {
    super();
  }

  private formatWithContext(message: any, ...args: any[]): string {
    const contextStr = Object.entries(this.context)
      .map(([key, value]) => `${key}=${JSON.stringify(value)}`)
      .join(' ');
    return format(message, ...args) + ' ' + contextStr;
  }

  error(message: any, ...args: any[]): void {
    this.parent.error(this.formatWithContext(message, ...args));
  }

  warn(message: any, ...args: any[]): void {
    this.parent.warn(this.formatWithContext(message, ...args));
  }

  info(message: any, ...args: any[]): void {
    this.parent.info(this.formatWithContext(message, ...args));
  }

  debug(message: any, ...args: any[]): void {
    this.parent.debug(this.formatWithContext(message, ...args));
  }

  trace(message: any, ...args: any[]): void {
    this.parent.trace(this.formatWithContext(message, ...args));
  }
}

export default Logger;
