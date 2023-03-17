import test from "ava";

import os from "os";
import path from "path";

import { Import } from '../src/main.js';

test("init import", (t) => {
  const importer = new Import();
  t.not(importer, null);
});