import test from "ava";

import os from "os";
import path from "path";

import { Import } from '../src/main.js';

test("init import with custom module", async (t) => {
  const importer = new Import();
  console.log(importer)

  const args: string[] = ["../../../ingest/tests/custom-module/test.js"];
  const options: any = { "openaiApiKey": "test" };
  const command: string = "";

  const output = await importer.run({ args, options, command })

  for await (const item of output) {
    console.log(item);
  }

  t.not(output, null);
  t.pass()
});


test("init import", (t) => {
  const importer = new Import();
  t.not(importer, null);
});
