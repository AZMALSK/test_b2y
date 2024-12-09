// const { OrderTabelModel,CustomerModel,UserManagementModel} = require('../ConnectionDB/Connect');
// const { processQuery, routeQuery } = require('../middleware/chatbotOpenAi');

// // Chatbot Controller
// const handleChatQuery = async (req, res) => {
//   const { message } = req.body;

//   if (!message) {
//     return res.status(400).send({ error: 'Message is required.' });
//   }

//   try {
//     // Step 1: Process the query using NLP
//     const processedQuery = await processQuery(message);

//     // Step 2: Determine the intent
//     const intent = routeQuery(processedQuery);
//     if (!intent) {
//       return res.send({ reply: "Sorry, I couldn't understand your query." });
//     }

//     // Step 3: Fetch relevant data
//     let responseData;
//     if (intent === 'orders') {
//       responseData = await OrderTabelModel.find({}); // Example: Fetch all Orders
//     } else if (intent === 'customers') {
//       responseData = await CustomerModel.find({}); // Example: Fetch all customers
//     } else if (intent === 'Users') {
//       responseData = await UserManagementModel.find({}); // Example: Fetch all Users
//     }

//     // Step 4: Respond with data
//     res.send({ reply: responseData });
//   } catch (error) {
//     console.error('Chatbot error:', error);
//     res.status(500).send({ error: 'Failed to handle the query.' });
//   }
// };

// module.exports = { handleChatQuery };


const { OrderTabelModel, CustomerModel, UserManagementModel } = require('../ConnectionDB/Connect');
const Anthropic = require('@anthropic-ai/sdk');
require('dotenv').config();
const { Op } = require('sequelize');


// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Process query using Claude
const processQuery = async (query) => {
  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 150,
      messages: [{
        role: 'user',
        content: `Analyze this query and extract the following information in JSON format: {
          intent: <intent>,
          identifiers: {
            OrderNumber: <OrderNumber>,
            CustomerNumber: <CustomerNumber>,
            Email: <Email>
          }
        }`,
      }],
    });

    const analysisResult = JSON.parse(response.content[0].text || '{}');
    if (!analysisResult.intent) throw new Error('Invalid response from Claude API.');
    return processAnalysisResult(analysisResult);
  } catch (error) {
    console.error('Claude API error:', error);
    // Fallback to routeQuery
    return { intent: routeQuery(query), params: extractParametersFromQuery(query) };
  }
};

// Fallback parameter extraction
const extractParametersFromQuery = (query) => {
  const params = {};
  if (/order number/i.test(query)) {
    params.OrderNumber = query.match(/order number\s*(\S+)/i)?.[1];
  }
  if (/customer number/i.test(query)) {
    params.CustomerNumber = query.match(/customer number\s*(\S+)/i)?.[1];
  }
  if (/email/i.test(query)) {
    params.Email = query.match(/email\s*(\S+)/i)?.[1];
  }
  return params;
};



// Process Claude's analysis into query parameters
const processAnalysisResult = (analysis) => {
  const result = {
    intent: analysis.intent,
    params: {}
  };

  // Add identifiers to params
  if (analysis.identifiers) {
    Object.entries(analysis.identifiers).forEach(([key, value]) => {
      result.params[key] = value;
    });
  }

  // Add filters to params
  if (analysis.filters) {
    Object.entries(analysis.filters).forEach(([key, value]) => {
      result.params[key] = value;
    });
  }

  return result;
};
// Enhanced data fetching with specific queries

const fetchDataForIntent = async (intent, params) => {
  try {
    const queryOptions = { raw: true, attributes: [] };

    // Validate params
    if (typeof params !== 'object') throw new Error('Invalid parameters for query.');

    switch (intent) {
      case 'customers':
        queryOptions.attributes = ['CustomerID', 'FirstName', 'Email', 'CustomerNumber'];
        
        // Add filters dynamically
        if (Object.keys(params).length > 0) {
          queryOptions.where = {
            [Op.and]: Object.entries(params).map(([key, value]) => ({
              [key]: { [Op.iLike]: `%${value}%` } // Case-insensitive partial match
            }))
          };
        }
        return await CustomerModel.findAll(queryOptions);

      case 'orders':
        queryOptions.attributes = ['OrderID', 'CustomerID', 'OrderNumber', 'OrderStatus', 'CreatedAt'];
        
        // Add filters dynamically
        if (Object.keys(params).length > 0) {
          queryOptions.where = {
            [Op.and]: Object.entries(params).map(([key, value]) => ({
              [key]: { [Op.iLike]: `%${value}%` }
            }))
          };
        }
        return await OrderTabelModel.findAll(queryOptions);

      case 'users':
        queryOptions.attributes = ['UserID', 'FirstName', 'LastName', 'Email'];
        
        // Add filters dynamically
        if (Object.keys(params).length > 0) {
          queryOptions.where = {
            [Op.and]: Object.entries(params).map(([key, value]) => ({
              [key]: { [Op.iLike]: `%${value}%` }
            }))
          };
        }
        return await UserManagementModel.findAll(queryOptions);

      default:
        return null;
    }
  } catch (error) {
    console.error(`Error fetching ${intent} data:`, error);
    throw new Error(`Failed to fetch ${intent} data: ${error.message}`);
  }
};




// Chatbot Controller
const handleChatQuery = async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).send({ error: 'Message is required.' });
  }

  try {
    const queryAnalysis = await processQuery(message);

    if (!queryAnalysis.intent) {
      return res.send({ 
        reply: "Sorry, I couldn't understand your query. Try asking about specific customers, orders, or users." 
      });
    }

    const responseData = await fetchDataForIntent(queryAnalysis.intent, queryAnalysis.params);

    if (!responseData || responseData.length === 0) {
      return res.send({ 
        reply: `No ${queryAnalysis.intent} found matching your criteria.` 
      });
    }

    const formattedResponse = formatResponseData(responseData, queryAnalysis.intent);
    res.send({ reply: formattedResponse });

  } catch (error) {
    console.error('Chatbot error:', error);
    res.status(500).send({ 
      error: 'Failed to handle the query.',
      details: error.message 
    });
  }
};



// Helper function to format response data
const formatResponseData = (data, intent) => {
  if (!Array.isArray(data)) return data;

  return data.map(item => {
    switch (intent) {
      case 'orders':
        return {
          orderId: item?.OrderID || 'N/A',
          customerId: item?.CustomerID || 'N/A',
          OrderNumber: item?.OrderNumber || 'N/A',
          total: item?.TotalAmount || 'N/A',
          status: item?.OrderStatus || 'N/A',
          date: item?.CreatedAt || 'N/A',
        };
      case 'customers':
        return {
          id: item?.CustomerID || 'N/A',
          name: item?.FirstName || 'N/A',
          email: item?.Email || 'N/A',
          customerNumber: item?.CustomerNumber || 'N/A',
        };
      case 'users':
        return {
          id: item?.UserID || 'N/A',
          firstName: item?.FirstName || 'N/A',
          lastName: item?.LastName || 'N/A',
          email: item?.Email || 'N/A',
        };
      default:
        return item;
    }
  });
};


// // Intent Router
const routeQuery = (query) => {
  const lowerCaseQuery = query?.toLowerCase() || '';
  if (lowerCaseQuery.includes('order')) return 'orders';
  if (lowerCaseQuery.includes('user')) return 'users';
  if (lowerCaseQuery.includes('customer')) return 'customers';
  return null;
};
module.exports = { handleChatQuery };