import { NextResponse } from "next/server";
import { IncomingForm } from 'formidable';
import fs from 'fs/promises';
import dotenv from 'dotenv';
import path from "path";
import { Pinecone } from '@pinecone-database/pinecone';
import { HfInference } from "@huggingface/inference";
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
});

const index = pinecone.Index('headstarter-project3');
const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

function padTo1024Dimensions(vector) {
    if (vector.length >= 1024) {
      return vector.slice(0, 1024);
    }
    return [...vector, ...Array(1024 - vector.length).fill(0)];
  }

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

async function storeAndIndexFile(buffer, filename) {
    try {
      // Store the file
      const filePath = path.join(process.cwd(), "docs/" + filename);
      await fs.writeFile(filePath, buffer);
  
      // Read the file contents
      const data = await fs.readFile(filePath, 'utf-8');
      const chunks = data.split('\n\n');
  
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        let embedding = await getEmbedding(chunk);
        embedding = padTo1024Dimensions(embedding);
  
        await index.upsert([{
          id: `${filename}-chunk-${i}`,
          values: embedding,
          metadata: { text: chunk }
        }]);
  
        console.log(`Uploaded chunk ${i + 1} of ${chunks.length} for file ${filename}`);
      }
  
      return NextResponse.json({ Message: "Success", status: 201 });
    } catch (error) {
      console.error('Error in storeAndIndexFile:', error);
      return NextResponse.json({ Message: "Failed", status: 500 });
    }
  }
  
  export const POST = async (req, res) => {
    const formData = await req.formData();
  
    const file = formData.get("file");
    if (!file) {
      return NextResponse.json({ error: "No files received." }, { status: 400 });
    }
  
    // Convert the file to a buffer
    const buffer = Buffer.from(await file.arrayBuffer());
    const filename = file.name.replaceAll(" ", "_");
    console.log(filename);
  
    // Store and index the file
    return storeAndIndexFile(buffer, filename);
  };
  

// dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// export const config = {
//     api: {
//       bodyParser: false,
//     },
//   };
// const pinecone = new Pinecone({
//   apiKey: process.env.PINECONE_API_KEY,
// });

// const index = pinecone.Index('headstarter-project3');

// const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

// async function getEmbedding(text) {
//     try {
//       const response = await hf.featureExtraction({
//         model: 'sentence-transformers/paraphrase-multilingual-mpnet-base-v2',
//         inputs: text
//       });
//       return response;
//     } catch (error) {
//       console.error('Error generating embedding:', error);
//       throw error;
//     }
//   }

// function padTo1024Dimensions(vector) {
// if (vector.length >= 1024) {
//     return vector.slice(0, 1024);
// }
// return [...vector, ...Array(1024 - vector.length).fill(0)];
// }

// export async function POST(req, res) {
//     const form = new IncomingForm({
//       uploadDir: path.resolve(process.cwd(), 'docs'), 
//       keepExtensions: true, 
//     });
  
//     form.parse(req, async (err, fields, files) => {
//       if (err) {
//         console.error('Error parsing form:', err);
//         return new NextResponse('Error parsing form', { status: 500 });
//       }
  
//       const file = files.file[0];
//       if (!file) {
//         return new NextResponse('No file uploaded', { status: 400 });
//       }
  
//       try {
//         const filePath = file.filepath; // Path where the file is stored
//         const data = await fs.readFile(filePath, 'utf-8'); // Read the uploaded file
//         const chunks = data.split('\n\n');
//         for (let i = 0; i < chunks.length; i++) {
//           const chunk = chunks[i];
//           let embedding = await getEmbedding(chunk);
//           embedding = padTo1024Dimensions(embedding);
//           await index.upsert([{
//             id: `chunk-${i}`,
//             values: embedding,
//             metadata: { text: chunk }
//           }]);
//           console.log(`Uploaded chunk ${i + 1} of ${chunks.length}`);
//         }
//         return new NextResponse('File uploaded successfully', { status: 200 });
//       } catch (error) {
//         console.error('Error uploading file:', error);
//         return new NextResponse('Error uploading file', { status: 500 });
//       }
//     });
//   }