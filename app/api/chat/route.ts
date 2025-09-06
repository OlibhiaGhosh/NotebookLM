import { NextRequest, NextResponse } from "next/server";
import { OpenAIEmbeddings } from '@langchain/openai';
import { QdrantVectorStore } from '@langchain/qdrant';
import "dotenv/config"
import OpenAI from 'openai';
// const client = new OpenAI();

export async function POST(request: NextRequest){
    const body = await request.json();
    const inputMessage = body?.inputMessage ?? "";
    const mode = body?.mode 
    if(!mode){
      return NextResponse.json({message: "Mode is required"}, {status: 400});
    }
      const embeddings = new OpenAIEmbeddings({
    model: 'text-embedding-3-large',
  });
  let vectorStore;
  if(mode === 'files'){
    vectorStore = await QdrantVectorStore.fromExistingCollection(
      embeddings,
      {
        url: 'http://localhost:6333',
        collectionName: 'pdf-collection',
      }
    );
  }
  if(mode === 'text'){
    vectorStore = await QdrantVectorStore.fromExistingCollection(
      embeddings,
      {
        url: 'http://localhost:6333',
        collectionName: 'text-collection',
      }
    );
  }
  if(mode === 'website'){
    vectorStore = await QdrantVectorStore.fromExistingCollection(
      embeddings,
      {
        url: 'http://localhost:6333',
        collectionName: 'web-collection',
      }
    );
  }
  if(mode === 'youtube'){
    vectorStore = await QdrantVectorStore.fromExistingCollection(
      embeddings,
      {
        url: 'http://localhost:6333',
        collectionName: 'youtube-collection',
      }
    );
  }
  if(!vectorStore){
    return NextResponse.json({message: "Vector Store is not found"}, {status: 400});
  }
   const vectorSearcher = vectorStore.asRetriever({
    k: 3,
  });
  const relevantChunk = await vectorSearcher.invoke(inputMessage);
  console.log("Context Retrieved: ", relevantChunk)
  const System_prompt = `You are an AI assistant who helps resolving user query based on the
    context available to you from a PDF file with the content and page number or from a website url or from some text provided by user or some youtube link.

    Only ans based on the available context from either of previous mentioned source only. If you don't know the answer, just say that you don't know, don't try to make up an answer.
    Context: ${JSON.stringify(relevantChunk)}
    read from relevantchunk[i].document.pageContent for the response message
    When it i9s from any pdf file include the page number too at the end of the content by document.metadata?.loc?.pageNumber after fetching the answer from the context if available`;
    const client = new OpenAI({
    baseURL: 'https://api.studio.nebius.com/v1/',
    apiKey: process.env.NEBIUS_API_KEY,
});
    const response = await client.chat.completions.create({
      "temperature": 0.1,
      model: "Qwen/Qwen3-235B-A22B-Instruct-2507",
      messages:[
        {role: "system", content: System_prompt},
        {role: "user", content: inputMessage},
      ]
    })
    const aiResponse = response.choices[0].message.content;
    return NextResponse.json({ aiResponse }, { status: 200 });
}