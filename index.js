import openai from './config/open-ai.js';
import readlineSync from 'readline-sync';
import colors from 'colors';
import cheerio from 'cheerio';

async function searchWikipedia(query) {
  const apiUrl = `https://en.wikipedia.org/w/api.php?action=parse&format=json&page=${query}`;

  try {
    const response = await fetch(apiUrl);
    if (response.ok) {
      const data = await response.json();
      if (data.parse && data.parse.text) {
        return data.parse.text['*'];
      } else {
        return null;
      }
    } else {
      console.error('Error fetching data from Wikipedia API');
      return null;
    }
  } catch (error) {
    console.error('Error:', error);
    return null;
  }
}

async function scrapeWikipedia(query) {
  const htmlContent = await searchWikipedia(query);

  if (htmlContent) {
    const $ = cheerio.load(htmlContent);

    const paragraphs = [];
    $('p').each((index, element) => {
      paragraphs.push($(element).text());
    });

    return paragraphs;
  } else {
    return null;
  }
}

async function main() {
  console.log(colors.bold.green('Welcome to the Chatbot Program!'));
  console.log(colors.bold.green('You can start chatting with the bot.'));

  const chatHistory = [];

  const topicInput = readlineSync.question(colors.yellow('topic: '));
  while (true) {

    const userInput = readlineSync.question(colors.yellow('You: '));

    let list = []

  await scrapeWikipedia(topicInput)
    .then(paragraphs => {
    if (paragraphs) {
      console.log('Extracted paragraphs');
      paragraphs.forEach((paragraph, index) => {
      list.push(`${paragraph}`)
      });
    } else {
      console.log('No data found.');
    }
  })
  .catch(error => {
    console.error('Error:', error);
  });
    
    const first50Items = list.slice(0, 100);
    
    const sentence = first50Items.join(', ');
    const trimmedText = sentence.substring(0, 100);
    console.log(colors.blue('Wiki: ') + `${trimmedText}`)
    try {
      const messages = chatHistory.map(([role, content]) => ({
        role,
        content,
      }));
      if(list.length !== 0){
        messages.push({ role: 'user', content: `${trimmedText} using this data tell me ${userInput}` });
      }else{
        messages.push({ role: 'user', content: userInput });
      }

      const completion = await openai.createChatCompletion({
        model: 'gpt-3.5-turbo',
        messages: messages,
      });

      const completionText = completion.data.choices[0].message.content;

      if (userInput.toLowerCase() === 'exit') {
        console.log(colors.green('Bot: ') + completionText);
        return;
      }      
      console.log(colors.green('Bot: ') + completionText);

      chatHistory.push(['user', userInput]);
      chatHistory.push(['assistant', completionText]);
    } catch (error) {
      console.error(colors.red(error));
    }
  }
}

main();
