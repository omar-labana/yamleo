export interface ComparisonReport {
  missingInTarget: string[];
  missingInBase: string[];
  duplicatesInBase: string[];
  duplicatesInTarget: string[];
}

export type YamlContent = Record<string, unknown>;
