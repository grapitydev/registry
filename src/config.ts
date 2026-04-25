export interface ServerConfig {
  port: number;
  database: "sqlite" | "postgresql";
  sqlitePath?: string;
  postgresUrl?: string;
  gracePeriodDays: number;
  auth?: {
    mode: "none" | "api-key" | "jwt";
    apiKeyHashes?: string[];
    jwtSecret?: string;
  };
  audit?: {
    enabled: boolean;
  };
}

export const defaultConfig: ServerConfig = {
  port: 3750,
  database: "sqlite",
  sqlitePath: undefined,
  gracePeriodDays: 30,
};
