import { PolymathEndpoint } from "@polymath-ai/client";
import { Importer } from "../importer.js";

export default class RSS extends Importer {

  constructor(options: Options) {
    super(options);
  }

  *getChunks() {
    yield "This is a long string with no punctuation";
    yield "Hello world 1. Hello world 1a and 1b.";
    yield "Hello world 2.";
    yield "Hello world 3.";
    yield "Hello world 4.";
    yield "Hello world 5.";
  }
}