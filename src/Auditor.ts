import { expandGlob } from "std/fs/expand_glob.ts";
import flatten from "flat";
import { stringify } from "yaml";
import Loader from "./Loader.ts";
import { consola } from "consola";

export default class Auditor {
  loader: Loader;

  constructor() {
    this.loader = new Loader();
  }

  async checkUnused(yamlPath: string, vueFolder: string, outputPath?: string, deleteUnused?: boolean) {
    consola.start(`Checking unused keys from ${yamlPath} in ${vueFolder}...`);
    
    const { content } = await this.loader.loadFile(yamlPath);
    const flattened: Record<string, unknown> = flatten(content);
    const keys = Object.keys(flattened);
    
    const files: string[] = [];

    for await (const file of expandGlob(`${vueFolder}/**/*.{vue,ts,js}`)) {
        files.push(file.path);
    }

    consola.info(`Found ${files.length} files (.vue, .ts, .js).`);

    if (files.length === 0) {
        consola.warn("No .vue files found.");
        return;
    }

    const fileContents = await Promise.all(files.map(path => Deno.readTextFile(path)));
    const combinedContent = fileContents.join("\n");

    const unused: string[] = [];
    
    for (const key of keys) {
        if (!combinedContent.includes(key)) {
            unused.push(key);
        }
    }

    if (unused.length > 0) {
        consola.warn(`Found ${unused.length} unused keys.`);
        
        if (outputPath) {
            await Deno.writeTextFile(outputPath, unused.join("\n"));
            consola.success(`Unused keys written to ${outputPath}`);
        } else {
             unused.slice(0, 50).forEach(key => console.log(` - ${key}`));
             if (unused.length > 50) console.log(`... and ${unused.length - 50} more.`);
        }

        if (deleteUnused) {
            consola.info("Deleting unused keys...");
            unused.forEach(key => {
                delete flattened[key];
            });
            
            const newContent = (flatten as any).unflatten(flattened);
            await Deno.writeTextFile(yamlPath, stringify(newContent));
            consola.success(`Deleted ${unused.length} unused keys from ${yamlPath}`);
        }
    } else {
        consola.success("No unused keys found.");
    }
  }
}
