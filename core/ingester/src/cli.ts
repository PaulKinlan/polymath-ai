import fs from "fs";

import { Command, Option } from "commander";

import { Import } from "./import.js";

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

    program.name("polymath").description(description).version(version);

    program.option("-d, --debug", "output extra debugging");
    program.addOption(
      new Option("--openai-api-key <key>", "OpenAI API key").env(
        "OPENAI_API_KEY"
      )
    );

    program.option("-p, --pinecone", "Use pinecone");
    program.addOption(
      new Option("--pinecone-api-key <key>", "pinecone api key").env(
        "PINECONE_API_KEY"
      )
    );
    program.addOption(
      new Option("--pinecone-base-url <url>", "pinecone base url").env(
        "PINECONE_BASE_URL"
      )
    );
    program.addOption(
      new Option("--pinecone-namespace <namespace>", "pinecone namespace").env(
        "PINECONE_NAMESPACE"
      )
    );

    //
    // SUB COMMANDS
    //

    program
      .argument("[question]", "Which ingester should the Polymath use?")
      .action((...args: string[]) => {
        const importer = new Import();
        const [options, command] = args.slice(-2);
        args = args.slice(0, -2);
        //const action: Action = new importer(program.opts());
        importer.run({ args, options, command });
      });

    program.parse();
  }
}

export { CLI };