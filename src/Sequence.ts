import { consola } from "consola";
import Loader from "./Loader.ts";
import Comparator from "./Comparator.ts";
import { ComparisonReport } from "./interfaces.ts";

export default class Sequence {
  basePath: string;
  targetPath: string;
  loader: Loader;
  comparator: Comparator;

  constructor(basePath: string, targetPath: string) {
    this.basePath = basePath;
    this.targetPath = targetPath;
    this.loader = new Loader();
    this.comparator = new Comparator();
  }

  async start() {
    try {
      consola.start(`Loading files: ${this.basePath} and ${this.targetPath}`);

      const base = await this.loader.loadFile(this.basePath);
      const target = await this.loader.loadFile(this.targetPath);

      consola.info("Comparing files...");

      const report = this.comparator.compare(
        base.content,
        target.content,
        base.raw,
        target.raw,
      );

      this.displayReport(report, this.basePath, this.targetPath);
    } catch (error) {
      consola.error(error);
      Deno.exit(1);
    }
  }

  private displayReport(
    report: ComparisonReport,
    basePath: string,
    targetPath: string,
  ) {
    consola.info(`Comparison: ${basePath} -> ${targetPath}`);
    if (report.missingInTarget.length > 0) {
      consola.warn(`Missing keys in ${targetPath} (present in ${basePath}):`);
      report.missingInTarget.forEach((key: string) => console.log(` - ${key}`));
    } else {
      consola.success(`No missing keys in ${targetPath}.`);
    }

    consola.info(`Comparison: ${targetPath} -> ${basePath}`);
    if (report.missingInBase.length > 0) {
      consola.warn(`Missing keys in ${basePath} (present in ${targetPath}):`);
      report.missingInBase.forEach((key: string) => console.log(` - ${key}`));
    } else {
      consola.success(`No missing keys in ${basePath}.`);
    }

    if (report.duplicatesInBase.length > 0) {
      consola.error(`Duplicate keys found in ${basePath}:`);
      report.duplicatesInBase.forEach((key: string) =>
        console.log(` - ${key}`)
      );
    }

    if (report.duplicatesInTarget.length > 0) {
      consola.error(`Duplicate keys found in ${targetPath}:`);
      report.duplicatesInTarget.forEach((key: string) =>
        console.log(` - ${key}`)
      );
    }
  }
}
