import { Configuration, OpenAIApi } from "openai";
import { encode } from "gpt-3-encoder";
import { PolymathPinecone } from "./pinecone.js";
import { PolymathResults } from "./results.js";
import { PolymathEndpoint } from "./endpoint.js";
import { PolymathLocal } from "./local.js";
import {
  getMaxTokensForModel,
  DEFAULT_MAX_TOKENS_COMPLETION,
} from "./utils.js";

// Initialize .env variables
import * as dotenv from "dotenv";
import { findUpSync } from "find-up";
dotenv.config({
  path: findUpSync(".env"),
});

// --------------------------------------------------------------------------
// This Polymath has some class.
// --------------------------------------------------------------------------
// Simple usage:
//
// let p = new Polymath({
//    apiKey: process.env.OPENAI_API_KEY,
//    libraryFiles: ['./libraries/knowledge-string.json']
// });
//
// let r = await p.ask("How long is a piece of string?");
// console.log("Context: ", r.context);
// --------------------------------------------------------------------------
class Polymath {
  constructor(options) {
    // The OpenAI API Key
    if (!options.apiKey) {
      throw new Error("Polymath requires an api_key");
    }
    this.openai = new OpenAIApi(
      new Configuration({
        apiKey: options.apiKey,
      })
    );

    // Reusable default ask options for embeddings
    this.askOptions = options.askOptions;

    // Reusable default completion options for completions
    this.completionOptions = options.completionOptions;

    // An array of JSON library filenames
    this.libraries = options.libraryFiles;

    // An array of Polymath server endpoints
    this.servers = options.servers;

    // A Pinecone config
    this.pinecone = options.pinecone;

    // The prompt template. {context} and {query} will be replaced
    // The default is the classic from: https://github.com/openai/openai-cookbook/blob/main/examples/Question_answering_using_embeddings.ipynb
    this.promptTemplate =
      options.promptTemplate ||
      options.completionOptions?.prompt_template ||
      'Answer the question as truthfully as possible using the provided context, and if the answer is not contained within the text below, say "I don\'t know".\n\nContext:{context}\n\nQuestion: {query}\n\nAnswer:';

    // `debug; true` was passed in
    this.debug = options.debug
      ? (output) => console.log("DEBUG: " + output)
      : () => {};
  }

  // Returns true if the Polymath is configured with at least one source
  validate() {
    return this.libraries || this.servers || this.pinecone;
  }

  // Given a users query, return the Polymath results which contain the bits that will make a good context for a completion
  async ask(query, askOptions) {
    if (!this.validate()) {
      throw new Error(
        "Polymath requires at least one library or polymath server or pinecone server"
      );
    }

    // If passed the query_embedding, use it. Otherwise, generate it.
    // Beware the fact that there is a chance generateEMbedding(query) != queryEmbedding
    let queryEmbedding =
      askOptions?.query_embedding || (await this.generateEmbedding(query));

    // For each server and/or local library, get the results and merge it all together!
    let bits = [];

    // First, let's ask each of the servers
    if (Array.isArray(this.servers)) {
      this.debug("Asking servers: " + this.servers.join("\n"));

      const promises = this.servers.map((server) => {
        const ps = new PolymathEndpoint(server);
        return ps.ask(queryEmbedding, askOptions);
      });

      const resultsArray = await Promise.all(promises);

      for (let results of resultsArray) {
        this.debug("Server Results: " + JSON.stringify(results));
        if (results.bits) {
          bits.push(...results.bits);
        }
      }
    }

    // Second, let's ask pinecone for some
    if (this.pinecone) {
      let ps = new PolymathPinecone(this.pinecone);
      let results = await ps.ask(queryEmbedding, askOptions);

      this.debug("Pinecone Results: " + JSON.stringify(results, 2));

      if (results) {
        bits.push(...results);
      }
    }

    // Third, look for local bits
    if (Array.isArray(this.libraries)) {
      let ls = new PolymathLocal(this.libraries);
      let results = ls.ask(queryEmbedding);

      this.debug("Local Results: " + JSON.stringify(results, 2));

      if (results) {
        bits.push(...results);
      }
    }

    // Finally, clean up the results and return them!
    return new PolymathResults(bits, askOptions);
  }

  // Given input text such as the users query, return an embedding
  async generateEmbedding(input) {
    try {
      const response = await this.openai.createEmbedding({
        model: "text-embedding-ada-002",
        input: input,
      });

      return response.data.data[0].embedding;
    } catch (error) {
      this.debug(`Embedding Error: ${JSON.stringify(error)}`);
      return {
        error: error,
      };
    }
  }

  // Given a users query, return a completion with polymath results and the answer
  async completion(query, polymathResults, askOptions, completionOptions) {
    if (!polymathResults) {
      // get the polymath results here
      polymathResults = await this.ask(query, askOptions);
    }

    completionOptions ||= this.completionOptions;

    let model = completionOptions?.model || "text-davinci-003";

    // How much room do we have for the content?
    // 4000 - 1024 - tokens for the prompt with the query without the context
    let contextTokenCount =
      getMaxTokensForModel(model) -
      DEFAULT_MAX_TOKENS_COMPLETION -
      this.getPromptTokenCount(query);

    let prompt = this.getPrompt(
      query,
      polymathResults.context(contextTokenCount)
    );

    try {
      let response;
      let responseText;
      if (model == "gpt-3.5-turbo") {
        let messages = [];
        if (completionOptions?.system) {
          messages.push({
            role: "system",
            content: completionOptions.system,
          });
        }
        messages.push({
          role: "user",
          content: prompt,
        });

        response = await this.openai.createChatCompletion({
          model: model,
          messages: messages,
          temperature: completionOptions?.temperature || 0,
          max_tokens:
            completionOptions?.max_tokens || DEFAULT_MAX_TOKENS_COMPLETION,
          top_p: completionOptions?.top_p || 1,
          n: completionOptions?.n || 1,
          stream: completionOptions?.stream || false,
          stop: completionOptions?.stop || null,
          presence_penalty: completionOptions?.presence_penalty || 0,
          frequency_penalty: completionOptions?.frequency_penalty || 0,
        });
        responseText = response.data.choices[0].message.content;
      } else {
        // text-davinci-003
        response = await this.openai.createCompletion({
          model: model,
          prompt: prompt,
          temperature: completionOptions?.temperature || 0,
          max_tokens:
            completionOptions?.max_tokens || DEFAULT_MAX_TOKENS_COMPLETION,
          top_p: completionOptions?.top_p || 1,
          n: completionOptions?.n || 1,
          stream: completionOptions?.stream || false,
          logprobs: completionOptions?.stream || null,
          echo: completionOptions?.echo || false,
          stop: completionOptions?.stop || null,
          presence_penalty: completionOptions?.presence_penalty || 0,
          frequency_penalty: completionOptions?.frequency_penalty || 0,
          best_of: completionOptions?.best_of || 1,
        });
        responseText = response.data.choices[0].text;
      }

      // returning the first option for now
      return {
        bits: polymathResults.bits(),
        infos: polymathResults.infoSortedBySimilarity(),
        completion: responseText?.trim(),
      };
    } catch (error) {
      console.log("Error: ", error);
      this.debug(`Completion Error: ${JSON.stringify(error)}`);
      return {
        error: error,
      };
    }
  }

  getPrompt(query, context) {
    return this.promptTemplate
      .replace("{context}", context)
      .replace("{query}", query);
  }

  // given the query, add the prompt template and return the encoded total
  getPromptTokenCount(query) {
    return encode(query + this.promptTemplate).length;
  }
}

// Polymath, go back and help people!
export { Polymath, PolymathEndpoint };
