import { Pinecone } from '@pinecone-database/pinecone';
import { HfInference } from "@huggingface/inference";
import fs from 'fs/promises';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
});

const index = pinecone.Index('headstarter-project3');
const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

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

function padTo1024Dimensions(vector) {
  if (vector.length >= 1024) {
    return vector.slice(0, 1024);
  }
  return [...vector, ...Array(1024 - vector.length).fill(0)];
}

async function populatePinecone() {
  try {
    const data = await fs.readFile('headstarter.txt', 'utf-8');
    const chunks = data.split('\n\n');

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      let embedding = await getEmbedding(chunk);
      embedding = padTo1024Dimensions(embedding);
      
      await index.upsert([{
        id: `chunk-${i}`,
        values: embedding,
        metadata: { text: chunk }
      }]);

      console.log(`Uploaded chunk ${i + 1} of ${chunks.length}`);
    }
  } catch (error) {
    console.error('Error in populatePinecone:', error);
    throw error;
  }
}

populatePinecone()
  .then(() => console.log('Done!'))
  .catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
  });