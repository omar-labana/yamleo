import { parse } from "yaml";
import { YamlContent } from "./interfaces.ts";

export default class Loader {
  async loadFile(path: string): Promise<{ content: YamlContent; raw: string }> {
    try {
      const raw = await Deno.readTextFile(path);
      const content = parse(raw);
      return { content, raw };
    } catch (error) {
      throw new Error(`Failed to load file at ${path}: ${error}`);
    }
  }
}
