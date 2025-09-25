"use client";

import type React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Upload, FileText, Globe, Youtube } from "lucide-react";
import { cn } from "@/lib/utils";
import { AuroraText } from "@/components/ui/aurora-text";
import { RainbowButton } from "@/components/ui/rainbow-button";

// AI Elements imports
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent } from "@/components/ai-elements/message";
import { Response } from "@/components/ai-elements/response";
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputSubmit,
  PromptInputToolbar,
  PromptInputButton,
  PromptInputTools,
} from "@/components/ai-elements/prompt-input";
import { Loader } from "@/components/ai-elements/loader";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Suggestions, Suggestion } from "@/components/ai-elements/suggestion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
}
type ContextMode = "text" | "website" | "files" | "youtube";

export default function NotebookLLM() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadedfileData, setuploadedfileData] = useState<any>({
    filename: "",
    relativePath: "",
  });
  const [textContent, setTextContent] = useState("");
  const [url, setUrl] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [activeMode, setActiveMode] = useState<ContextMode>("text");

  const [isTextDialogOpen, setIsTextDialogOpen] = useState(false);
  const [isWebsiteDialogOpen, setIsWebsiteDialogOpen] = useState(false);
  const [isFileDialogOpen, setIsFileDialogOpen] = useState(false);
  const [isYouTubeDialogOpen, setIsYouTubeDialogOpen] = useState(false);
  const [isPdfSubmitted, setIsPdfSubmitted] = useState(false);

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
      setIsPdfSubmitted(true);
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("Error uploading PDF.");
    }
  };

  const handleContextSubmit = async (
    contextType: "text" | "website" | "youtube" | "file"
  ) => {
    setSubmitLoading(true);

    let body: any = {};
    switch (contextType) {
      case "text":
        body = { textContent };
        break;
      case "website":
        body = { websiteUrl: url };
        break;
      case "youtube":
        body = { youtubeUrl };
        break;
      case "file":
        body = { filename: uploadedfileData.filename };
        break;
    }

    if (contextType !== "file" && !Object.values(body).some((v) => v)) {
      alert("Please provide a context source.");
      setSubmitLoading(false);
      return;
    }

    try {
      const indexingResponse = await fetch("/api/indexing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      console.log("Indexing response:", indexingResponse);
      alert("Context submitted successfully!");
      switch (contextType) {
        case "text":
          setIsTextDialogOpen(false);
          break;
        case "website":
          setIsWebsiteDialogOpen(false);
          break;
        case "youtube":
          setIsYouTubeDialogOpen(false);
          break;
        case "file":
          setIsFileDialogOpen(false);
          setSelectedFile(null);
          setuploadedfileData({ filename: "", relativePath: "" });
          break;
      }
    } catch (error) {
      console.error("Error in indexing:", error);
      alert("Error in indexing.");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleSendMessage = async (
    e?: React.FormEvent<HTMLFormElement> | string
  ) => {
    if (typeof e !== "string") {
      e?.preventDefault();
    }

    const messageToSend = typeof e === "string" ? e : currentMessage;

    if (!messageToSend.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: messageToSend,
      role: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setCurrentMessage("");
    setIsLoading(true);
    console.log("mode before sending message:", activeMode);
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ inputMessage: messageToSend, mode: activeMode }),
    });

    const { aiResponse } = await response.json();
    const aiMessage: Message = {
      id: Date.now().toString(),
      content: aiResponse,
      role: "assistant",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, aiMessage]);
    setIsLoading(false);
  };

  const promptInputComponent = (
    <PromptInput
      onSubmit={handleSendMessage}
      className={`w-full ${messages.length > 0 ? "mt-auto" : "mt-8"}`}
    >
      <PromptInputTextarea
        placeholder="Type your message..."
        value={currentMessage}
        onChange={(e) => setCurrentMessage(e.target.value)}
      />
      <PromptInputToolbar>
        <PromptInputTools>
          {/* Text Context Dialog */}
          <Dialog open={isTextDialogOpen} onOpenChange={setIsTextDialogOpen}>
            <DialogTrigger asChild>
              <PromptInputButton>
                <FileText className="w-4 h-4 mr-2" />
                Text
              </PromptInputButton>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Text Context</DialogTitle>
              </DialogHeader>
              <Textarea
                placeholder="Enter your context here..."
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                className="min-h-[200px] resize-none"
              />
              <DialogFooter>
                <Button
                  onClick={() => {
                    setActiveMode("text" as ContextMode);
                    handleContextSubmit("text");
                  }}
                  disabled={submitLoading}
                >
                  {submitLoading ? "Submitting..." : "Submit Context"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Website Context Dialog */}
          <Dialog
            open={isWebsiteDialogOpen}
            onOpenChange={() => setIsWebsiteDialogOpen(true)}
          >
            <DialogTrigger asChild>
              <PromptInputButton>
                <Globe className="w-4 h-4 mr-2" />
                Website
              </PromptInputButton>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Website Context</DialogTitle>
              </DialogHeader>
              <Input
                type="url"
                placeholder="https://example.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
              <DialogFooter>
                <Button
                  onClick={() => {
                    setActiveMode("website" as ContextMode);
                    handleContextSubmit("website");
                  }}
                  disabled={submitLoading}
                >
                  {submitLoading ? "Submitting..." : "Submit Context"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* File Context Dialog */}
          <Dialog open={isFileDialogOpen} onOpenChange={setIsFileDialogOpen}>
            <DialogTrigger asChild>
              <PromptInputButton>
                <Upload className="w-4 h-4 mr-2" />
                File
              </PromptInputButton>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload a File</DialogTitle>
              </DialogHeader>
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={cn(
                  "relative h-64 border-2 border-dashed rounded-lg transition-all duration-300",
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
                      "w-12 h-12 mb-4 transition-colors",
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
              <DialogFooter>
                <Button
                  onClick={() => {
                    setActiveMode("file" as ContextMode);
                    handleContextSubmit("file");
                  }}
                  disabled={submitLoading || !isPdfSubmitted}
                >
                  {submitLoading ? "Submitting..." : "Submit Context"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* YouTube Context Dialog */}
          <Dialog
            open={isYouTubeDialogOpen}
            onOpenChange={setIsYouTubeDialogOpen}
          >
            <DialogTrigger asChild>
              <PromptInputButton>
                <Youtube className="w-4 h-4 mr-2" />
                YouTube
              </PromptInputButton>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add YouTube Context</DialogTitle>
              </DialogHeader>
              <Input
                type="url"
                placeholder="https://youtube.com/watch?v=..."
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
              />
              <DialogFooter>
                <Button
                  onClick={() => {
                    setActiveMode("youtube" as ContextMode);
                    handleContextSubmit("youtube");
                  }}
                  disabled={submitLoading}
                >
                  {submitLoading ? "Submitting..." : "Submit Context"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          {/* <Select
            value={activeMode}
            onValueChange={(value) => setActiveMode(value as ContextMode)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select a mode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="text">Text</SelectItem>
              <SelectItem value="website">Website</SelectItem>
              <SelectItem value="files">Files</SelectItem>
              <SelectItem value="youtube">YouTube</SelectItem>
            </SelectContent>
          </Select> */}
        </PromptInputTools>
        <PromptInputSubmit
          disabled={!currentMessage.trim() || isLoading}
          status={isLoading ? "submitted" : "ready"}
        />
      </PromptInputToolbar>
    </PromptInput>
  );

  return (
    <div className="flex flex-col h-screen text-foreground p-6 items-center">
      <div className="flex w-full justify-around ">
        <h1 className="text-2xl font-semibold text-primary text-center">
          NotebookLM
        </h1>
        <RainbowButton>Star GitHub ⭐️</RainbowButton>
      </div>
      <div className="w-full max-w-4xl h-full flex flex-col">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1">
            <div className="flex flex-col items-center w-full justify-center">
              <h1 className="text-6xl font-bold text-center mb-2">
                Retrieve, Augment, & <AuroraText> Know Everything. </AuroraText>
              </h1>
            </div>
            {promptInputComponent}
          </div>
        ) : (
          <>
            <Conversation className="flex-1 mb-4">
              <ConversationContent>
                {messages.map((message) => (
                  <Message from={message.role} key={message.id}>
                    <MessageContent className="bg-gray-800 text-white">
                      <Response>{message.content}</Response>
                    </MessageContent>
                  </Message>
                ))}
                {isLoading && <Loader />}
              </ConversationContent>
              <ConversationScrollButton />
            </Conversation>
            {promptInputComponent}
          </>
        )}
      </div>
    </div>
  );
}
