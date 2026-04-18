import type {
  Spec,
  SpecVersion,
  SpecFilters,
  CompatReport,
} from "@grapity/core";
import type { SpecStore } from "@grapity/core";

export class RegistryService {
  constructor(private store: SpecStore) {}

  async pushSpec(
    name: string,
    content: string,
    options?: {
      type?: "openapi" | "asyncapi";
      description?: string;
      owner?: string;
      sourceRepo?: string;
      tags?: string[];
      gitRef?: string;
      pushedBy?: string;
      force?: boolean;
      reason?: string;
    }
  ): Promise<{ spec: Spec; version: SpecVersion; compatReport?: CompatReport; isNewSpec: boolean }> {
    throw new Error("Not implemented");
  }

  async validateSpec(
    name: string,
    content: string
  ): Promise<{
    valid: boolean;
    errors?: string[];
    warnings?: string[];
    compatReport?: CompatReport;
  }> {
    throw new Error("Not implemented");
  }

  async deprecateVersion(
    name: string,
    semver: string,
    sunsetDate: Date
  ): Promise<SpecVersion> {
    throw new Error("Not implemented");
  }

  async sunsetVersion(name: string, semver: string): Promise<SpecVersion> {
    throw new Error("Not implemented");
  }
}