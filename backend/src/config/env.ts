/**
 * Environment configuration.
 *
 * Validates that required environment variables are present on startup
 * rather than failing at runtime when a Supabase call is made.
 */

import dotenv from 'dotenv';
dotenv.config();

interface EnvConfig {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  PORT: number;
  NODE_ENV: string;
}

class Environment {
  get SUPABASE_URL(): string {
    const raw = process.env.SUPABASE_URL || '';
    return raw.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
  }

  get SUPABASE_ANON_KEY(): string {
    return process.env.SUPABASE_ANON_KEY!;
  }

  get SUPABASE_SERVICE_ROLE_KEY(): string {
    return process.env.SUPABASE_SERVICE_ROLE_KEY!;
  }

  get PORT(): number {
    return parseInt(process.env.PORT || '3000', 10);
  }

  get NODE_ENV(): string {
    return process.env.NODE_ENV || 'development';
  }

  /**
   * Validate that all required environment variables are present.
   * Call this once on startup.
   */
  validate(): void {
    const required: (keyof EnvConfig)[] = [
      'SUPABASE_URL',
      'SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY',
    ];

    const missing = required.filter((key) => !process.env[key]);

    if (missing.length > 0) {
      console.error(
        `[AlgoMentor] Missing required environment variables: ${missing.join(', ')}`
      );
      console.error(
        '[AlgoMentor] Copy .env.example to .env and fill in the values.'
      );
      process.exit(1);
    }
  }
}

export const env = new Environment();
