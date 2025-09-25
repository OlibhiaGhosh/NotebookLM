# NotebookLM
![NotebookLM Demo video](./assests/oli.mp4)

This is a Next.js application that allows users to chat with a large language model (LLM) with context from various sources, including uploaded files, websites, text, and YouTube videos.

## Getting Started

First, install the dependencies:

```bash
npm install
```

Then, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Features

*   **Chat Interface:** A simple and intuitive chat interface to interact with the LLM.
*   **Context from various sources:**
    *   **File Upload:** Upload PDF files to provide context for the chat.
    *   **Website:** Provide a URL to a website to use as context.
    *   **Text:** Paste in any text to use as context.
    *   **YouTube:** Provide a YouTube video URL to use as context.
*   **Vector Search:** The application uses Qdrant to store and search for relevant context from the provided sources.
*   **Streaming Responses:** The LLM's responses are streamed to the user for a more interactive experience.

## API Routes

The application has the following API routes:

*   **`/api/upload`:** Handles file uploads. It accepts a `POST` request with a `multipart/form-data` payload containing the file to be uploaded.
*   **`/api/indexing`:** Indexes the content from the provided source (file, website, text, or YouTube video). It accepts a `POST` request with a JSON payload containing the source information.
*   **`/api/chat`:** Handles the chat interaction. It accepts a `POST` request with a JSON payload containing the user's message and the current context mode.

## Technologies Used

*   **Next.js:** A React framework for building server-side rendered and static web applications.
*   **TypeScript:** A typed superset of JavaScript that compiles to plain JavaScript.
*   **LangChain:** A framework for developing applications powered by language models.
*   **Qdrant:** A vector similarity search engine.
*   **OpenAI:** The API for the large language model.
*   **Tailwind CSS:** A utility-first CSS framework for rapidly building custom user interfaces.
*   **Shadcn/ui:** A collection of re-usable components that are built on top of Radix UI and Tailwind CSS.

## Project Structure

```
.
├── app
│   ├── api
│   │   ├── chat
│   │   │   └── route.ts
│   │   ├── indexing
│   │   │   └── route.ts
│   │   └── upload
│   │       └── route.ts
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components
│   ├── ai-elements
│   └── ui
├── public
│   └── uploads
├── lib
│   └── utils.ts
├── next.config.mjs
├── package.json
├── tsconfig.json
└── README.md
```
