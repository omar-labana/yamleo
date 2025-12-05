import { defineCommand, CommandDef } from "citty";
import Sequence from "./Sequence.ts";
import Modifier from "./Modifier.ts";
import ExcelAdapter from "./ExcelAdapter.ts";
import Auditor from "./Auditor.ts";

export default class Main {
  cli(): CommandDef {
    return defineCommand({
      meta: {
        name: "yamleo",
        version: "0.0.1",
        description: "YAML translation manager",
      },
      subCommands: {
        compare: {
          meta: { description: "Compare two YAML files" },
          args: {
            base: { type: "positional", description: "Base YAML file", required: true },
            target: { type: "positional", description: "Target YAML file", required: true },
          },
          run: async ({ args }) => {
            const seq = new Sequence(args.base as string, args.target as string);
            await seq.start();
          },
        },
        sort: {
          meta: { description: "Sort YAML file alphabetically" },
          args: {
            file: { type: "positional", description: "YAML file to sort", required: true },
          },
          run: async ({ args }) => {
            const modifier = new Modifier();
            await modifier.sort(args.file as string);
          },
        },
        sync: {
          meta: { description: "Add missing keys from base to target" },
          args: {
            base: { type: "positional", description: "Base YAML file", required: true },
            target: { type: "positional", description: "Target YAML file", required: true },
          },
          run: async ({ args }) => {
            const modifier = new Modifier();
            await modifier.sync(args.base as string, args.target as string);
          },
        },
        "to-excel": {
          meta: { description: "Convert YAML to Excel" },
          args: {
            yaml: { type: "positional", description: "YAML file", required: true },
            excel: { type: "positional", description: "Output Excel file", required: true },
          },
          run: async ({ args }) => {
            const adapter = new ExcelAdapter();
            await adapter.toExcel(args.yaml as string, args.excel as string);
          },
        },
        "from-excel": {
          meta: { description: "Convert Excel to YAML" },
          args: {
            excel: { type: "positional", description: "Excel file", required: true },
            yaml: { type: "positional", description: "Output YAML file", required: true },
          },
          run: async ({ args }) => {
            const adapter = new ExcelAdapter();
            await adapter.fromExcel(args.excel as string, args.yaml as string);
          },
        },
        unused: {
          meta: { description: "Check for unused keys in Vue files" },
          args: {
            yaml: { type: "positional", description: "YAML file to check", required: true },
            folder: { type: "positional", description: "Folder containing Vue files", required: true },
            output: { type: "string", description: "Output file for unused keys list", required: false },
            delete: { type: "boolean", description: "Delete unused keys from YAML file", required: false },
          },
          run: async ({ args }) => {
            const auditor = new Auditor();
            await auditor.checkUnused(args.yaml as string, args.folder as string, args.output, args.delete);
          },
        },
      },
    });
  }
}
