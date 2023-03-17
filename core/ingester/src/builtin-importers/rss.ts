import { PolymathEndpoint } from "@polymath-ai/client";
import { Importer } from "../importer.js";

export default class RSS extends Importer {

  constructor(options: Options) {
    super(options);
  }

  *getChunks(): Generator {
    yield "Hello world";
    yield "Hello world1";
    yield "Hello world2";
    yield "Hello world3";
  }
}