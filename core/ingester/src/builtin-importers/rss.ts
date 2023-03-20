import { PolymathEndpoint } from "@polymath-ai/client";
import { Importer, Bit } from "../importer.js";
import RSSParser from 'rss-parser';

export default class RSS extends Importer {

  constructor(options: Options) {
    super(options);
  }

  async *getStringsFromSource(source: string): AsyncGenerator<Bit> {
    const feed = await (new RSSParser).parseURL(source);
    console.log(feed.title); // feed will have a `foo` property, type as a string

    for (const item of feed.items) {
      yield {
        text: item.content || "",
        info: {
          url: item.link || "",
          title: item.title || "",
        }
      };
    }
  }
}