import flatten from "flat";
import { ComparisonReport, YamlContent } from "./interfaces.ts";

export default class Comparator {
  compare(
    baseObj: YamlContent,
    targetObj: YamlContent,
    baseRaw: string,
    targetRaw: string,
  ): ComparisonReport {
    const report: ComparisonReport = {
      missingInTarget: [],
      missingInBase: [],
      duplicatesInBase: [],
      duplicatesInTarget: [],
    };

    report.missingInTarget = this.findMissingKeys(baseObj, targetObj);
    report.missingInBase = this.findMissingKeys(targetObj, baseObj);

    report.duplicatesInBase = this.findDuplicatesInRaw(baseRaw);
    report.duplicatesInTarget = this.findDuplicatesInRaw(targetRaw);

    const duplicateValuesBase = this.findDuplicateValues(baseObj);
    const duplicateValuesTarget = this.findDuplicateValues(targetObj);

    report.duplicatesInBase.push(...duplicateValuesBase);
    report.duplicatesInTarget.push(...duplicateValuesTarget);

    return report;
  }

  public missingKeys(baseObj: YamlContent, targetObj: YamlContent): string[] {
    return this.findMissingKeys(baseObj, targetObj);
  }

  public duplicates(content: YamlContent, raw?: string): string[] {
    const valueDup = this.findDuplicateValues(content);
    const rawDup = raw ? this.findDuplicatesInRaw(raw) : [];
    return [...new Set([...rawDup, ...valueDup])];
  }

  private findDuplicatesInRaw(rawInfo: string): string[] {
    const lines = rawInfo.split("\n");
    const keys = new Set<string>();
    const duplicates = new Set<string>();

    const keyRegex = /^\s*([\w.-]+):/;

    lines.forEach((line) => {
      const match = line.match(keyRegex);
      if (match) {
        const key = match[1];
        if (keys.has(key)) {
          duplicates.add(key);
        } else {
          keys.add(key);
        }
      }
    });

    return Array.from(duplicates);
  }

  private findMissingKeys(
    baseObj: YamlContent,
    targetObj: YamlContent,
  ): string[] {
    const flatBase = flatten(baseObj) as Record<string, unknown>;
    const flatTarget = flatten(targetObj) as Record<string, unknown>;
    const missing: string[] = [];
    Object.keys(flatBase).forEach((key) => {
      if (!(key in flatTarget)) {
        missing.push(key);
      }
    });
    return missing;
  }

  private findDuplicateValues(obj: YamlContent): string[] {
    const flatObj = flatten(obj) as Record<string, unknown>;
    const groups = new Map<string, string[]>();

    Object.keys(flatObj).forEach((key) => {
      const val = flatObj[key];
      let valStr = "";
      if (val === null || typeof val === "undefined") {
        valStr = "null";
      } else if (typeof val === "object") {
        try {
          valStr = JSON.stringify(val);
        } catch (_e) {
          valStr = String(val);
        }
      } else {
        valStr = String(val);
      }

      const normalized = this.normalizeValue(valStr);
      if (!groups.has(normalized)) groups.set(normalized, []);
      groups.get(normalized)!.push(key);
    });

    const duplicates: string[] = [];
    for (const [_, keys] of groups) {
      if (keys.length > 1) {
        duplicates.push(keys.join(", "));
      }
    }
    return duplicates;
  }

  private normalizeValue(value: string): string {
    if (!value) return "";
    let v = value.trim().toLowerCase();
    v = v.replace(/[.,!?"'():;\-]/g, "");
    v = v.replace(/^the\s+/i, "");
    v = v.replace(/^ال\s*/u, "");
    v = v.replace(/s$/i, "");
    v = v.replace(/\s+/g, " ");
    return v;
  }
}
