export class Bit {
  
}

export abstract class Importer {
  protected options: Options;

  constructor(options: Options) {
    this.options = options;
  }

  static async load(path: string): Promise<Importer> {
    const importer = await import(`./${path}`);
    return importer.default;
  }

  *getChunks(): Generator {
    return;
  }
}