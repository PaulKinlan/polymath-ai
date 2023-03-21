import { Importer } from "../../src/importer.js";
import { Bit, Options } from "../../src/types.js";

export default class Test extends Importer {
  constructor(options: Options) {
    super(options);
  }

  async *getStringsFromSource(source: string): AsyncGenerator<Bit> {
    yield {
      info: { url: source + 1 },
      text: "This is a long string with no punctuation",
    };
    yield {
      info: { url: source + 2 },
      text: "Hello world 1. Hello world 1a and 1b.",
    };
    yield {
      info: { url: source + 3 },
      text: "Hello world 2.",
    };
    yield {
      info: { url: source + 4 },
      text: "Hello world 3.",
    };
    yield {
      info: { url: source + 5 },
      text: "Hello world 4.",
    };
    yield {
      info: { url: source + 6 },
      text: "Hello world 5.",
    };
  }
}
