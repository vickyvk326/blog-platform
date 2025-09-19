import path from 'node:path';
import Logger from '../utilities/Logger';

// Singleton instance
let logger: Logger | null = null;

const rootPath = process.cwd();
const logFilePath = path.join(rootPath, 'logs', 'app.log');

export async function getLogger() {
  if (!logger) {
    logger = new Logger({
      level: 'debug',
      transports: 'both',
      filePath: logFilePath,
      maxFileSize: 5 * 1024 * 1024, // 5MB
      maxFiles: 3,
    });

    // Only required for file/both transports
    await logger.init();
  }

  return logger;
}
