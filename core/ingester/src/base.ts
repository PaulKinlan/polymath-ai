type Options = {
  outputFile: string;
}

export class Importer {
  private options: Options;

  constructor(options: Options) {
    this.options = options;
  }

  static async load(path: string) {
    const importer = await import(`./${path}`);
    return importer.default;
  }

  get outputFile() {
    return this.options.outputFile;
  }

  getChunks() {

  }
}