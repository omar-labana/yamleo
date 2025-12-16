import { stringify } from "yaml";
import Loader from "./Loader.ts";
import { consola } from "consola";

export default class Modifier {
  loader: Loader;

  constructor() {
    this.loader = new Loader();
  }

  async sort(filePath: string) {
    consola.start(`Sorting ${filePath}...`);
    const { content } = await this.loader.loadFile(filePath);
    const sorted = this.sortObject(content);
    await Deno.writeTextFile(filePath, stringify(sorted));
    consola.success(`Sorted ${filePath}`);
  }

  async sync(basePath: string, targetPath: string) {
    consola.start(`Syncing keys from ${basePath} to ${targetPath}...`);
    const base = await this.loader.loadFile(basePath);
    const target = await this.loader.loadFile(targetPath);

    const synced = this.mergeKeys(base.content, target.content);
    await Deno.writeTextFile(targetPath, stringify(synced));
    consola.success(`Synced ${targetPath}`);
  }

  // deno-lint-ignore no-explicit-any
  private sortObject(obj: any): any {
    if (typeof obj !== "object" || obj === null) {
      return obj;
    }
    if (Array.isArray(obj)) {
      // deno-lint-ignore no-explicit-any
      return obj.map((item: any) => this.sortObject(item));
    }
    const sortedKeys = Object.keys(obj).sort();
    // deno-lint-ignore no-explicit-any
    const result: any = {};
    sortedKeys.forEach((key) => {
      result[key] = this.sortObject(obj[key]);
    });
    return result;
  }

  // deno-lint-ignore no-explicit-any
  private markAsTmp(obj: any, keyName?: string): any {
    if (typeof obj === "string") {
      return (keyName || obj) + " TMP";
    }
    if (typeof obj === "object" && obj !== null) {
      if (Array.isArray(obj)) {
        // deno-lint-ignore no-explicit-any
        return obj.map((item: any) => this.markAsTmp(item));
      }
      // deno-lint-ignore no-explicit-any
      const result: any = {};
      for (const key in obj) {
        result[key] = this.markAsTmp(obj[key], key);
      }
      return result;
    }
    return obj;
  }

  // deno-lint-ignore no-explicit-any
  private mergeKeys(base: any, target: any): any {
    if (typeof base !== "object" || base === null) {
       return target !== undefined ? target : this.markAsTmp(base);
    }
    
    if (typeof target !== "object" || target === null) {
       if (target === undefined) return this.markAsTmp(base);
       return target;
    }

    if (Array.isArray(base)) {
        return target;
    }

    // deno-lint-ignore no-explicit-any
    const result: any = { ...target };
    
    for (const key in base) {
      if (Object.prototype.hasOwnProperty.call(base, key)) {
        if (!(key in target)) {
          result[key] = this.markAsTmp(base[key], key); 
        } else {
          result[key] = this.mergeKeys(base[key], target[key]);
        }
      }
    }
    return result;
  }
}
