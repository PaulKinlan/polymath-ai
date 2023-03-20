/*
  Removes urls and emojis from a string

  Equivalent to python's clean-text pip package.
*/
const cleanText = (input: string): string => {
  return input
    .replace(/(https?:\/\/[^\s]+)/g, "") // Remove urls
  //.replace(/[^\u{1F600}-\u{1F6FF}\s]/ug, ""); // Remove emojis (https://stackoverflow.com/questions/24672834/how-do-i-remove-emoji-from-string)
}


// NOTE: Dependant on the model we are using with OpenAI, we need to chunk the data in to optimal sizes. In some cases we might only have one bit for an entire document.
const MIN_CHUNK_SIZE = 5;
const MAX_CHUNK_SIZE = 10; // We need to check which model we are using with OpenAI because they all have different limits.

const GOLDIELOCKS = {
  "min": MAX_CHUNK_SIZE - MIN_CHUNK_SIZE,
  "max": MAX_CHUNK_SIZE + MIN_CHUNK_SIZE
}

const MEH_SIZE = GOLDIELOCKS.min / 2

function getLastPunctuation(input: string): number {
  const lastPeriod = input.lastIndexOf(".");
  const lastExclamation = input.lastIndexOf("!");
  const lastQuestion = input.lastIndexOf("?");

  return Math.max(lastPeriod, lastExclamation, lastQuestion);
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

  // Override this method to return the data to be encoded.
  *getChunks(): Generator<string> {
    yield "";
  }

  /*
    This method should return a generator that yields chunks of data to the embedding encoder. The chunks of data will be optimally sized for the embedding encoder.

    This is overridable by an importer if so desired.
  */
  *generateChunks(): Generator<string> {
    console.log("[LOG] Generating Chunks");
    // Accumulate the buffer.
    let buffer: string = "";
    const strings = this.getChunks();
    for (const stringToEncode of strings) {
      console.log(`[LOG] ${stringToEncode}`);
      const cleanedText = cleanText(stringToEncode);

      if (cleanText.length == 0) {
        continue;
      }

      // Add to the buffer because if it's too large we will break it up anyway.
      buffer += cleanedText;

      if (buffer.length + cleanedText.length <= GOLDIELOCKS.max) {
        // accumulate the chunks in to the optimal size. We're good to continue
        continue;
      }
      
      console.log("max", buffer.length, GOLDIELOCKS.max)

      // Buffer is too big, we need to break this up.
      // find the end of the sentence in the buffer.
      let trimmedBuffer = buffer.substring(0, GOLDIELOCKS.max);
      let remainingBuffer = buffer.substring(GOLDIELOCKS.max);

      do {
        // Find the last sentence in the buffer.
        const sentenceEnd = getLastPunctuation(trimmedBuffer); // What do we do if there is no sentence end?...
        if (sentenceEnd == -1) {
          // We couldn't find a sentence end, so just yield and hope let the error percolate down.
          console.warn("[WARN] Couldn't find sentence end. Emitting entire buffer.");
          break;
        }

        const fullSentence = trimmedBuffer.substring(0, sentenceEnd + 1);
        remainingBuffer = trimmedBuffer.substring(sentenceEnd + 1) + remainingBuffer;

        if (sentenceEnd == fullSentence.length) {
          // The sentence end is at the end of the buffer, so we can just yield and move on.
          console.warn("[WARN] The sentence is still too long and can't be broken down further. Emitting.");
          yield fullSentence;
          break;
        }

        // Add the scraps of the sentence to the remaining buffer.
        trimmedBuffer = remainingBuffer.substring(0, GOLDIELOCKS.max);
        remainingBuffer = remainingBuffer.substring(GOLDIELOCKS.max);
      } while (remainingBuffer.length > GOLDIELOCKS.max)

      // Yield the last chunk
      if (buffer.length > 0) {
        yield "\n" + buffer;
      }

      buffer = "";
    }

    return;
  }
}