import fs from 'node:fs/promises';
import path from 'node:path';
import Client, { ConnectOptions } from 'ssh2-sftp-client';
import { ensureDirExists, withRetry } from './HelperFunctions';
import { constants } from 'node:fs';
import Logger from './Logger';

type SFTPOptions = ConnectOptions & {
  maxRetries?: number;
  retryDelay?: number;
  timeout?: number;
};

type TransferOptions = {
  overwrite?: boolean;
  progressCallback?: (transferred: number) => void;
  chunkSize?: number;
};

class SFTP {
  private client: Client;
  private options: SFTPOptions;
  private isConnected: boolean = false;
  private logger: Logger;

  constructor(options: SFTPOptions, logger: Logger) {
    this.client = new Client();
    this.options = {
      maxRetries: 3,
      retryDelay: 1000,
      timeout: 30000,
      ...options,
    };
    this.logger = logger;
  }

  async connect(): Promise<void> {
    if (this.isConnected) return;

    await withRetry(
      async () => {
        await this.client.connect(this.options);
        this.isConnected = true;
      },
      {
        retries: this.options.maxRetries,
        delay: this.options.retryDelay,
      },
    );
  }

  async uploadFile(localPath: string, remotePath: string, options: TransferOptions = {}): Promise<boolean | undefined> {
    await this.ensureConnected();
    await this.verifyLocalFile(localPath);
    await this.ensureRemoteDirectory(path.dirname(remotePath));

    return withRetry<boolean>(
      async () => {
        if (!options.overwrite && (await this.exists(remotePath))) {
          throw new Error(`Remote file exists: ${remotePath}`);
        }

        await this.client.fastPut(localPath, remotePath, {
          step: options.progressCallback,
          chunkSize: options.chunkSize || 65536,
        });
        this.logger.info(`File uploaded to ${remotePath}`);
        return true;
      },
      {
        retries: this.options.maxRetries,
        delay: this.options.retryDelay,
      },
    );
  }

  async downloadFile(remotePath: string, localPath: string, options: TransferOptions = {}): Promise<void> {
    await this.ensureConnected();
    await ensureDirExists(path.dirname(localPath));

    return withRetry(
      async () => {
        if (!options.overwrite && (await this.localExists(localPath))) {
          throw new Error(`Local file exists: ${localPath}`);
        }

        await this.client.fastGet(remotePath, localPath, {
          step: options.progressCallback,
          chunkSize: options.chunkSize,
        });
      },
      {
        retries: this.options.maxRetries,
        delay: this.options.retryDelay,
      },
    );
  }

  async disconnect(): Promise<void> {
    if (this.isConnected) {
      await this.client.end();
      this.isConnected = false;
    }
  }

  // Private helpers
  private async ensureConnected(): Promise<void> {
    if (!this.isConnected) {
      await this.connect();
    }
  }

  private async ensureRemoteDirectory(remoteDir: string): Promise<void> {
    try {
      await this.client.mkdir(remoteDir, true);
    } catch (error) {
      if (!this.isDirectoryExistsError(error)) throw error;
    }
  }

  private async verifyLocalFile(localPath: string): Promise<void> {
    try {
      await fs.access(localPath, constants.R_OK);
    } catch {
      throw new Error(`Local file not accessible: ${localPath}`);
    }
  }

  private async exists(remotePath: string): Promise<boolean> {
    try {
      await this.client.stat(remotePath);
      return true;
    } catch {
      return false;
    }
  }

  private async localExists(localPath: string): Promise<boolean> {
    try {
      await fs.access(localPath);
      return true;
    } catch {
      return false;
    }
  }

  private isDirectoryExistsError(error: unknown): boolean {
    return error instanceof Error && /(already exists|EEXIST)/i.test(error.message);
  }
}
export default SFTP;
