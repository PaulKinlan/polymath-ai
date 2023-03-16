import { join } from 'path';

import { PolymathEndpoint } from "@polymath-ai/client";
import { Importer } from "./base.js";
import chalk from "chalk";

const error = (...args: any[]) => console.error(chalk.red("ERROR:", ...args));
const log = (msg: string, ...args: any[]) =>
  console.log(chalk.green(`\n${msg}`), chalk.bold(...args));
const debug = (...args: any[]) => console.log(chalk.blue("DEBUG:", ...args));


export interface RunArguments {
  args: string[];
  options: any;
  command: string;
}

export class Import {
  async run({ args, options, command }: RunArguments) {
    const importer = args[0];
    const output = options?.output;

    let loadedImporter;

    if (args.length == 0) {
      error("Please configure an importer");
      return -1;
    }

    if(!importer.startsWith('../') && !importer.startsWith('./')) {
      log(`Loading built-in importer: ${importer}`);
      loadedImporter = await Importer.load(join('builtin-importers', `${importer}.js`));
    }
    else {
      log(`Loading external importer: ${importer}`);
      // We should probably do some validations.
      loadedImporter = await Importer.load(importer);
    }

    if (!loadedImporter) {
      error(`Importer ${importer} not found`);
      return -1;
    }

    new loadedImporter(options)

    log("\nDone importing\n\n");
  }
}