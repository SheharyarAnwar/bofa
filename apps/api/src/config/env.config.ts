import { plainToInstance } from 'class-transformer';
import { IsNotEmpty, validateSync } from 'class-validator';

class EnvironmentVariables {
  @IsNotEmpty({ message: 'OPEN_API_KEY is required' })
  OPEN_API_KEY: string;

  @IsNotEmpty({ message: 'PG_DATABASE_URL is required' })
  PG_DATABASE_URL: string;

  @IsNotEmpty({ message: 'MONGODB_URI is required' })
  MONGODB_URI: string;
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }
  return validatedConfig;
}

export interface IEnvConfig {
  OPEN_API_KEY: string;
  PG_DATABASE_URL: string;
  MONGODB_URI: string;
}
