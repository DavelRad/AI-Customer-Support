import { Pinecone } from "@pinecone-database/pinecone";
import { HfInference } from "@huggingface/inference";

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
});

const index = pinecone.Index('headstarter-project3');

const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

export async function getRelevantContext(query, userId) {
  const queryEmbedding = await getEmbedding(query);
  
  const queryResponse = await index.query({
    vector: queryEmbedding,
    topK: 3,
    includeMetadata: true,
    filter: {
      userId: userId
    }
  });

  return queryResponse.matches.map(match => match.metadata.text).join("\n\n");
}

async function getEmbedding(text) {
  try {
    const response = await hf.featureExtraction({
      model: 'sentence-transformers/paraphrase-multilingual-mpnet-base-v2',
      inputs: [text]
    });
    return padTo1024Dimensions(response[0]);
  } catch (error) {
    console.error('Error getting embedding:', error);
    throw error;
  }
}

function padTo1024Dimensions(vector) {
  if (vector.length >= 1024) {
    return vector.slice(0, 1024);
  }
  return [...vector, ...Array(1024 - vector.length).fill(0)];
}