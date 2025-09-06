"use client";

import type React from "react";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import {
  Upload,
  Send,
  Bot,
  User,
  FileText,
  Globe,
  Youtube,
  Loader,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { set } from "date-fns";

interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
}
type ContextMode = "text" | "website" | "files" | "youtube";
export default function NotebookLLM() {
  const [context, setContext] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadedfileData, setuploadedfileData] = useState<any>({filename: "", relativePath: "" });
  const [textContent, setTextContent] = useState("");
  const [url, setUrl] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeMode, setActiveMode] = useState<ContextMode>("text");
  const [isDragging, setIsDragging] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const tabs = [
    { id: "text" as ContextMode, label: "Text", icon: FileText },
    { id: "website" as ContextMode, label: "Website", icon: Globe },
    { id: "files" as ContextMode, label: "Files", icon: Upload },
    { id: "youtube" as ContextMode, label: "YouTube", icon: Youtube },
  ];

  // const handleContextSubmit = () => {
  //   if (!context.trim()) return

  //   const contextMessage: Message = {
  //     id: Date.now().toString(),
  //     content: `Context updated: ${context}`,
  //     role: "assistant",
  //     timestamp: new Date(),
  //   }

  //   setMessages((prev) => [...prev, contextMessage])
  // }
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileUpload = async (event: any) => {
    const file = event.target.files[0] ?? null;
    setSelectedFile(file);
    console.log("Selected file: ", event.target.files[0]);
    event.preventDefault();

    if (!file) {
      alert("Please select a file");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setuploadedfileData(data);
      console.log("File uploaded successfully:", data);
      alert("PDF uploaded successfully!");
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("Error uploading PDF.");
    }
  };
  const handleContextSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    setSubmitLoading(true);
    event.preventDefault();
    console.log("Inside handleContextSubmit")
    if (!uploadedfileData.filename && !url && !textContent && !youtubeUrl) {
    alert("Please provide at least one context source (file, URL, text, or YouTube URL)");
    return;
  }

    try {
      const indexingResponse = await fetch("/api/indexing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: uploadedfileData.filename,
          websiteUrl: url,
          textContent: textContent,
          youtubeUrl: youtubeUrl,
        }),
      });
      console.log("Indexing response:", indexingResponse);
    } catch (error) {
      console.error("Error in indexing:", error);
      alert("Error in indexing.");
    }
    finally {
      setSubmitLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!currentMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: currentMessage,
      role: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setCurrentMessage("");
    setIsLoading(true);

    // Simulate AI response
    const Response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ inputMessage: currentMessage , mode: activeMode}),
    });

    const { aiResponse } = await Response.json();
    const aiMessage: Message = {
      id: Date.now().toString(),
      content: aiResponse,
      role: "assistant",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, aiMessage]);
    setIsLoading(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex h-screen bg-gray-900">
      {/* Left Panel - Context */}
      <form
        onSubmit={handleContextSubmit}
        className=" w-1/2 p-6 border-r border-gray-700"
      >
        <h2 className="text-4xl font-semibold mb-4 text-green-400">Context</h2>
        <div className="h-full flex flex-col gap-8">
          <div className="flex gap-2 p-1 bg-secondary/50 rounded-lg backdrop-blur-sm">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <Button
                  key={tab.id}
                  variant="outline"
                  type="button"
                  data-active={activeMode === tab.id}
                  onClick={() => setActiveMode(tab.id)}
                  className={`flex-1 ${activeMode === tab.id ? "bg-tertiary text-foreground" : "text-muted-foreground"}`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </Button>
              );
            })}
          </div>
          <div className="mt-6">
            {activeMode === "text" && (
              <div className="space-y-4 animate-in fade-in-0 duration-300">
                <Textarea
                  placeholder="Enter your context here..."
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  className="min-h-[320px] bg-input/50 border-border/50 text-foreground placeholder:text-muted-foreground resize-none"
                />
              </div>
            )}

            {/* Website Mode */}
            {activeMode === "website" && (
              <div className="space-y-4 animate-in fade-in-0 duration-300">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Website URL
                  </label>
                  <Input
                    type="url"
                    placeholder="https://example.com"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="bg-input/50 border-border/50 text-foreground placeholder:text-muted-foreground"
                  />
                </div>
                <div className="mt-8 p-8 bg-muted/30 rounded-lg border border-dashed border-border/50 text-center">
                  <Globe className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Enter a website URL to extract context from the webpage
                  </p>
                </div>
              </div>
            )}

            {/* Files Mode */}
            {activeMode === "files" && (
              <div className="space-y-4 animate-in fade-in-0 duration-300">
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={cn(
                    "relative h-[320px] border-2 border-dashed rounded-lg transition-all duration-300",
                    isDragging
                      ? "border-primary bg-primary/5"
                      : "border-border/50 bg-muted/30 hover:border-primary/50",
                    selectedFile && "bg-primary/5 border-primary/50"
                  )}
                >
                  <input
                    type="file"
                    onChange={handleFileUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    accept=".txt,.pdf,.doc,.docx,.json,.csv"
                  />
                  <div className="flex flex-col items-center justify-center h-full pointer-events-none">
                    <Upload
                      className={cn(
                        "w-16 h-16 mb-4 transition-colors",
                        isDragging ? "text-primary" : "text-muted-foreground"
                      )}
                    />
                    {selectedFile ? (
                      <div className="text-center">
                        <p className="text-lg font-medium text-foreground mb-1">
                          {selectedFile.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {(selectedFile.size / 1024).toFixed(2)} KB
                        </p>
                        <p className="text-xs text-primary mt-2">
                          Click or drag to replace
                        </p>
                      </div>
                    ) : (
                      <div className="text-center">
                        <p className="text-lg font-medium text-foreground mb-2">
                          Drop your file here, or click to browse
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Supports TXT, PDF, DOC, DOCX, JSON, CSV
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* YouTube Mode */}
            {activeMode === "youtube" && (
              <div className="space-y-4 animate-in fade-in-0 duration-300">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    YouTube Video URL
                  </label>
                  <Input
                    type="url"
                    placeholder="https://youtube.com/watch?v=..."
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    className="bg-input/50 border-border/50 text-foreground placeholder:text-muted-foreground"
                  />
                </div>
                <div className="mt-8 p-8 bg-muted/30 rounded-lg border border-dashed border-border/50 text-center">
                  <Youtube className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Enter a YouTube video URL to extract context from the video
                    transcript
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3 mt-6">
            <Button
              type="submit"
              className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
              {submitLoading ? "Submitting..." : "Submit Context"}
            </Button>

            {/* <Button
              variant="outline"
              type="button"
              onClick={() => {
                fileInputRef.current?.click();
                console.log("File input clicked");
              }}
              className="w-full border-gray-600 bg-gray-800 text-gray-100 hover:bg-gray-700 hover:border-green-500"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload File
            </Button>

            <input
              ref={fileInputRef}
              type="file"
              name="file"
              accept=".pdf"
              onChange={handleFileUpload}
              className="hidden"
            /> */}
          </div>
        </div>
      </form>

      {/* Right Panel - Chat */}
      <div className="w-1/2 p-6 flex flex-col bg-gray-900">
        <h2 className="text-xl font-semibold mb-4 text-blue-400">AI Chat</h2>

        <ScrollArea className="flex-1 mb-4">
          <div className="space-y-4 pr-4">
            {messages.map((message) => (
              <Card
                key={message.id}
                className={`p-4 border-0 ${
                  message.role === "user"
                    ? "bg-blue-900/50 text-blue-100 ml-8 border-l-4 border-l-blue-500"
                    : "bg-gray-800 text-gray-100 mr-8 border-l-4 border-l-green-500"
                }`}
              >
                <div className="flex items-start gap-3">
                  {message.role === "user" ? (
                    <User className="w-5 h-5 mt-0.5 flex-shrink-0 text-blue-400" />
                  ) : (
                    <Bot className="w-5 h-5 mt-0.5 flex-shrink-0 text-green-400" />
                  )}
                  <div className="flex-1">
                    <p className="text-sm leading-relaxed">{message.content}</p>
                    <span className="text-xs opacity-70 mt-2 block">
                      {message.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              </Card>
            ))}

            {isLoading && (
              <Card className="p-4 bg-gray-800 text-gray-100 mr-8 border-0 border-l-4 border-l-green-500">
                <div className="flex items-start gap-3">
                  <Bot className="w-5 h-5 mt-0.5 flex-shrink-0 text-green-400 animate-pulse" />
                  <div className="flex-1">
                    <p className="text-sm">AI is thinking...</p>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </ScrollArea>

        <div className="flex gap-2">
          <Textarea
            placeholder="Type your message..."
            value={currentMessage}
            onChange={(e) => setCurrentMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1 min-h-[60px] max-h-[120px] resize-none bg-gray-800 border-gray-600 text-gray-100 placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!currentMessage.trim() || isLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 disabled:bg-gray-700 disabled:text-gray-400"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
