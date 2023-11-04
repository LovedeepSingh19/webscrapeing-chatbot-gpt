import { Configuration, OpenAIApi } from 'openai';

const configuration = new Configuration({
  apiKey: "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",
});

const openai = new OpenAIApi(configuration);

export default openai;
