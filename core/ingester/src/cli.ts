import fs from "fs";

import { Command, Option } from "commander";

import { Import } from "./main.js";

class CLI {
  private program;

  constructor() {
    this.program = new Command();
  }

  loadVersionInfo() {
    // Get the description and version from our own package.json
    return JSON.parse(fs.readFileSync("./package.json", "utf8"));
  }

  run() {
    const program = this.program;

    const { version, description } = this.loadVersionInfo();

    program.name("polymath-ingest").description(description).version(version);

    program.option("-d, --debug", "output extra debugging");
    program.addOption(
      new Option("--openai-api-key <key>", "OpenAI API key").env(
        "OPENAI_API_KEY"
      )
    );

    //
    // SUB COMMANDS
    //

    program
      .argument("[question]", "Which ingester should the Polymath use?")
      .argument("[source]", "What source should be ingested?")
      .action((...args: string[]) => {
        const importer = new Import();
        const [options, command] = args.slice(-2);
        args = args.slice(0, -2);
        importer.run({ args, options, command });
      });

    program.parse();
  }
}

export { CLI };