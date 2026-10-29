import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';

export interface HealthStatus {
  status: 'ok' | 'error';
  server: { status: 'up' };
  database: { status: 'up' | 'down' };
  timestamp: string;
}

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(private readonly dataSource: DataSource) {}

  async check(): Promise<HealthStatus> {
    const database = await this.checkDatabase();
    const result: HealthStatus = {
      status: database.status === 'up' ? 'ok' : 'error',
      server: { status: 'up' },
      database,
      timestamp: new Date().toISOString(),
    };

    if (result.status === 'error') {
      throw new ServiceUnavailableException(result);
    }
    return result;
  }

  private async checkDatabase(): Promise<HealthStatus['database']> {
    try {
      await this.dataSource.query('SELECT 1');
      return {
        status: 'up',
      };
    } catch (error) {
      this.logger.error(
        'Database health check failed',
        error instanceof Error ? error.stack : String(error),
      );
      return { status: 'down' };
    }
  }
}
