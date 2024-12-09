const { OpenAI } = require('openai'); // Correct import
require('dotenv').config();

// Instantiate OpenAI with the API key
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Ensure this is set in your .env file
});

// NLP Query Processor
const processQuery = async (query) => {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: query }],
    });

    return response.choices[0].message.content; // Extract the chat response
  } catch (error) {
    console.error('NLP processing error:', error);
    throw new Error('Failed to process the query.');
  }
};

// Intent Router
const routeQuery = (query) => {
  const lowerCaseQuery = query.toLowerCase(); // Normalize the query for consistency
  if (lowerCaseQuery.includes('orders')) return 'orders';
  if (lowerCaseQuery.includes('Users')) return 'Users';
  if (lowerCaseQuery.includes('customers')) return 'customers';
  return null;
};

module.exports = { processQuery, routeQuery };
