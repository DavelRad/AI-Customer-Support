import { NextResponse } from 'next/server'
import { getRelevantContext } from '../../utils/retrieval'
import { HfInference } from "@huggingface/inference";
import admin from '../../utils/admin.js'

const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

const systemPrompts = {
  'meta-llama/llama-3.1-8b-instruct:free': `
    You are Lani the Llama, a calm and highly knowledgeable support specialist. Your goal is to provide clear, structured, and reassuring advice, especially in troubleshooting, platform support, and interview preparation. Approach every query with patience and precision, ensuring the user feels confident and supported. Use the following context to inform your responses, but don’t mention the context explicitly in your answer:
    
    {context}
    
    Provide only information you are sure of, and if you are unsure about an answer, let the user know rather than guessing.`,
  
  'openchat/openchat-7b:free': `
    You are Byte the Tech Owl, a highly intelligent and tech-savvy guide. You excel in coding, algorithms, and solving complex technical problems. Be detailed, analytical, and always ready to dive deep into technical explanations. Your goal is to help users solve their programming and technical challenges with precision. Use the following context to inform your responses, but don’t mention the context explicitly in your answer:
    
    {context}
    
    Provide only information you are sure of, and if you are unsure about an answer, let the user know rather than making assumptions.`,
  
  'gryphe/mythomist-7b:free': `
    You are Myra the Myth Weaver, a creative and imaginative storyteller. Your goal is to weave intricate stories, craft vivid worlds, and guide users through role-playing scenarios and creative writing exercises. Approach each interaction with whimsy and empathy, inspiring creativity and imagination in the user. Use the following context to inform your responses, but don’t mention the context explicitly in your answer:
    
    {context}
    
    Provide only information you are sure of, and if you are unsure about an answer, let the user know rather than creating something that might not align with the user's needs.`
};


const modelCategories = [
  { model: 'meta-llama/llama-3.1-8b-instruct:free', category: 'general support, platform information, interview preparation' },
  { model: 'openchat/openchat-7b:free', category: 'coding, programming, technical questions, algorithms, data structures' },
  { model: 'gryphe/mythomist-7b:free', category: 'creative writing, storytelling, role-playing scenarios, hypothetical situations' }
];

async function getEmbedding(text) {
  try {
    const response = await hf.featureExtraction({
      model: 'sentence-transformers/paraphrase-multilingual-mpnet-base-v2',
      inputs: text
    });
    return response;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
}

function cosineSimilarity(vecA, vecB) {
  const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
  const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
  return dotProduct / (magnitudeA * magnitudeB);
}

async function selectModel(query) {
  console.log("Selecting model for query:", query);
  const queryEmbedding = await getEmbedding(query);
  let bestMatch = { model: modelCategories[0].model, similarity: -Infinity };

  for (const category of modelCategories) {
    const categoryEmbedding = await getEmbedding(category.category);
    const similarity = cosineSimilarity(queryEmbedding, categoryEmbedding);
    console.log(`Similarity for ${category.model}: ${similarity}`);
    if (similarity > bestMatch.similarity) {
      bestMatch = { model: category.model, similarity };
    }
  }

  console.log("Selected model:", bestMatch.model);
  return bestMatch.model;
}

export async function POST(req) {
  // Validate the token
  const token = req.headers.get('Authorization')?.split('Bearer ')[1];
  
  if (!token) {
    return new NextResponse(JSON.stringify({ error: 'Unauthorized: No token provided' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    console.log('Token is valid:', decodedToken);
  } catch (error) {
    console.error('Token verification failed:', error);
    return new NextResponse(JSON.stringify({ error: 'Unauthorized: Invalid token' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // Destructure the incoming data
    const { messages, userId } = await req.json();

    // Validate the structure of messages and ensure there's at least one message
    if (!Array.isArray(messages) || messages.length === 0) {
      throw new Error('Invalid messages array');
    }

    // Get the last message
    const lastMessage = messages[messages.length - 1];

    // Check if lastMessage is a valid object and has a 'content' property
    if (!lastMessage || typeof lastMessage.content !== 'string') {
      throw new Error('Invalid last message format');
    }

    const userMessage = lastMessage.content;

    console.log("User message:", userMessage);
    console.log("User ID:", userId);

    // Retrieve relevant context based on the user's message and userId
    const context = await getRelevantContext(userMessage, userId);

    const selectedModel = await selectModel(userMessage);
    console.log("Selected model:", selectedModel);

    const systemPrompt = systemPrompts[selectedModel]

    // Construct the messages to send, replacing 'data' with 'messages'
    const messagesToSend = [
      { role: 'system', content: systemPrompt.replace('{context}', context) },
      ...messages
    ];

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'https://your-website-url.com',
        'X-Title': 'Headstarter Support Chat'
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: messagesToSend,
        stream: true
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    async function* streamAsyncIterator() {
      let leftover = '';
      let modelSent = false;
      while (true) {
        const { done, value } = await reader.read();
        if (done) return;

        const chunk = decoder.decode(value, { stream: true });
        const lines = (leftover + chunk).split('\n');
        leftover = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') return;
            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices[0]?.delta?.content || '';
              if (!modelSent) {
                yield JSON.stringify({ model: selectedModel }) + '\n';
                modelSent = true;
              }
              if (content) yield content;
            } catch (e) {
              console.error('Error parsing JSON:', e);
              yield '\nError: Unable to parse response\n';
            }
          }
        }
      }
    }

    return new NextResponse(streamAsyncIterator());
  } catch (error) {
    console.error('Error in POST function:', error);
    return new NextResponse(JSON.stringify({ error: 'An error occurred processing your request' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}