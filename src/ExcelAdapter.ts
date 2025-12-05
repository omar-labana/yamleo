import * as XLSX from "xlsx";
import flatten from "flat";
import { stringify } from "yaml";
import Loader from "./Loader.ts";
import { consola } from "consola";

export default class ExcelAdapter {
  loader: Loader;

  constructor() {
    this.loader = new Loader();
  }

  async toExcel(yamlPath: string, excelPath: string) {
    consola.start(`Converting ${yamlPath} to ${excelPath}...`);
    const { content } = await this.loader.loadFile(yamlPath);
    
    const flattened: Record<string, unknown> = flatten(content);
    
    const rows = Object.entries(flattened).map(([key, value]) => {
        const parts = key.split(".");
        return { parts, value };
    });

    const data = rows.map((row) => {
        // deno-lint-ignore no-explicit-any
        const obj: any = {};
        row.parts.forEach((part, index) => {
            obj[`Level ${index + 1}`] = part;
        });
        obj["Value"] = String(row.value);
        return obj;
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, "Translations");

    XLSX.writeFile(wb, excelPath);
    consola.success(`Created ${excelPath}`);
  }

  async fromExcel(excelPath: string, yamlPath: string) {
    consola.start(`Converting ${excelPath} to ${yamlPath}...`);
    
    const wb = XLSX.readFile(excelPath);
    const sheetName = wb.SheetNames[0];
    const ws = wb.Sheets[sheetName];
    
    // deno-lint-ignore no-explicit-any
    const data: any[] = XLSX.utils.sheet_to_json(ws);
    
    const flattened: Record<string, unknown> = {};
    data.forEach((row) => {
        const parts: string[] = [];
        let i = 1;
        while (row[`Level ${i}`]) {
            parts.push(row[`Level ${i}`]);
            i++;
        }
        
        if (parts.length === 0 && row["Key"]) {
             parts.push(...String(row["Key"]).split("."));
        }

        if (parts.length > 0) {
            flattened[parts.join(".")] = row["Value"] !== undefined ? row["Value"] : "";
        }
    });

    // deno-lint-ignore no-explicit-any
    const content = (flatten as any).unflatten(flattened);
    await Deno.writeTextFile(yamlPath, stringify(content));
    consola.success(`Created ${yamlPath}`);
  }
}
