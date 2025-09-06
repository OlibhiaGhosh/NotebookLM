import "dotenv/config";

import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { OpenAIEmbeddings } from "@langchain/openai";
import { QdrantVectorStore } from "@langchain/qdrant";
import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { Document } from "@langchain/core/documents";
import { YoutubeLoader } from "@langchain/community/document_loaders/web/youtube";

export async function POST(request: NextRequest, response: NextResponse) {
  const { filename, websiteUrl, textContent, youtubeUrl } =
    await request.json();
  let chunks;
  if (filename) {
    const loader = new PDFLoader(
      path.join(process.cwd(), "public", "uploads", filename)
    );
    chunks = await loader.load();
    if (!chunks) {
    return new Response(JSON.stringify({ message: "No chunks is found" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });
  const docs = await splitter.splitDocuments(chunks);
  const embeddings = new OpenAIEmbeddings({
    model: "text-embedding-3-large",
  });
  const vectorStore = await QdrantVectorStore.fromDocuments(docs, embeddings, {
    url: "http://localhost:6333",
    collectionName: "pdf-collection",
  });
  console.log("Indexing of pdf done...");
  } else if (websiteUrl) {
    const loader = new CheerioWebBaseLoader(websiteUrl);
    chunks = await loader.load();
    if (!chunks) {
    return new Response(JSON.stringify({ message: "No chunks is found" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });
  const docs = await splitter.splitDocuments(chunks);
  const embeddings = new OpenAIEmbeddings({
    model: "text-embedding-3-large",
  });
  const vectorStore = await QdrantVectorStore.fromDocuments(docs, embeddings, {
    url: "http://localhost:6333",
    collectionName: "web-collection",
  });
  console.log("Indexing of web url done...");
  } else if (textContent) {
    // Create document directly from text content
    const textDoc = new Document({
      pageContent: textContent.trim(),
      metadata: { source: "user_input", type: "text" },
    });
    chunks = [textDoc]; 
    if (!chunks) {
    return new Response(JSON.stringify({ message: "No chunks is found" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });
  const docs = await splitter.splitDocuments(chunks);
  const embeddings = new OpenAIEmbeddings({
    model: "text-embedding-3-large",
  });
  const vectorStore = await QdrantVectorStore.fromDocuments(docs, embeddings, {
    url: "http://localhost:6333",
    collectionName: "text-collection",
  });
  console.log("Indexing of text done...");
  } else if (youtubeUrl) {
    const loader = YoutubeLoader.createFromUrl(youtubeUrl, {
      language: "en",
      addVideoInfo: true,
    });

    chunks = await loader.load();
    if (!chunks) {
    return new Response(JSON.stringify({ message: "No chunks is found" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });
  const docs = await splitter.splitDocuments(chunks);
  const embeddings = new OpenAIEmbeddings({
    model: "text-embedding-3-large",
  });
  const vectorStore = await QdrantVectorStore.fromDocuments(docs, embeddings, {
    url: "http://localhost:6333",
    collectionName: "youtube-collection",
  });
  console.log("Indexing of youtube url done...");
  }
  return new Response("Indexing done successfully...");
}
