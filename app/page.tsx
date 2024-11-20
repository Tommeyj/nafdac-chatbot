"use client";

import { useState, useEffect, FormEvent, useRef } from "react";
import Image from 'next/image';

type Message = {
  id: number;
  sender: "user" | "bot";
  text: string;
};

const formatText = (text: string) => {
  // Handle Markdown-style links: [text](url)
  const markdownLinksFormatted = text.replace(
    /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-500 underline">$1</a>'
  );

  // Handle Markdown-style email links: [email](mailto:email)
  const markdownEmailsFormatted = markdownLinksFormatted.replace(
    /\[([^\]]+)\]\(mailto:([^\s)]+)\)/g,
    '<a href="mailto:$2" class="text-blue-500 underline">$1</a>'
  );

  // Handle plain email addresses: info@nafdac.gov.ng
  const plainEmailFormatted = markdownEmailsFormatted.replace(
    /\b([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b/g,
    '<a href="mailto:$1" class="text-blue-500 underline">$1</a>'
  );

  // Handle malformed emails without 'mailto:' in Markdown: [info@nafdac.gov.ng](info@nafdac.gov.ng)
  const malformedMarkdownEmailsFormatted = plainEmailFormatted.replace(
    /\[([^\]]+)\]\(([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\)/g,
    '<a href="mailto:$2" class="text-blue-500 underline">$1</a>'
  );

  // Handle inline code: `code`
  const inlineCodeFormatted = malformedMarkdownEmailsFormatted.replace(
    /`([^`]+)`/g,
    '<code class="bg-gray-200 p-1 rounded">$1</code>'
  );

  // Handle block code: ```code block```
  const blockCodeFormatted = inlineCodeFormatted.replace(
    /```([\s\S]+?)```/g,
    '<pre><code class="bg-gray-200 p-2 rounded block overflow-auto">$1</code></pre>'
  );

  // Handle bold text: **bold**
  const boldFormatted = blockCodeFormatted.replace(
    /\*\*(.*?)\*\*/g,
    "<strong>$1</strong>"
  );

  // Handle italic text: *italic*
  const italicFormatted = boldFormatted.replace(/\*(.*?)\*/g, "<em>$1</em>");

  // Handle strikethrough text: ~~strikethrough~~
  const strikethroughFormatted = italicFormatted.replace(
    /~~(.*?)~~/g,
    "<del>$1</del>"
  );

  // Handle ordered lists: 1. item
  const orderedListFormatted = strikethroughFormatted.replace(
    /(?:^|\n)(\d+)\.\s([^\n]+)/g,
    "<ol><li>$2</li></ol>"
  );

  // Handle unordered lists: * item or - item
  const unorderedListFormatted = orderedListFormatted.replace(
    /(?:^|\n)([*-])\s([^\n]+)/g,
    "<ul><li>$2</li></ul>"
  );

  // Handle blockquotes: > blockquote
  const blockquoteFormatted = unorderedListFormatted.replace(
    /(?:^|\n)> (.*?)\n/g,
    '<blockquote class="border-l-4 pl-4 my-2 text-gray-700">$1</blockquote>'
  );

  // Handle newlines: \n
  const withLineBreaks = blockquoteFormatted.replace(/\n/g, "<br />");

  // Return the fully formatted HTML text
  return withLineBreaks;
};

const ChatPage = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const MessagesEndRef = useRef<HTMLDivElement>(null);

  // Function to scroll to the latest message
  const scrollToBottom = () => {
    MessagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    // Welcome message added when the component is first rendered
    const welcomeMessage: Message = {
      id: Date.now(),
      sender: "bot",
      text: "Welcome to NAFGuard! How can I assist you today?",
    };
    setMessages([welcomeMessage]); // Set the welcome message as the first message
    scrollToBottom();
  }, []); // Empty dependency array ensures this runs only once when the component mounts

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const animateText = (text: string, callback: () => void, delay = 30) => {
    let index = 0;
    const botMessage: Message = {
      id: Date.now(),
      sender: "bot",
      text: "",
    };

    // Append a new bot message with empty text for animation
    setMessages((prev) => [...prev, botMessage]);

    const interval = setInterval(() => {
      index++;
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === botMessage.id
            ? { ...msg, text: text.slice(0, index) }
            : msg
        )
      );

      if (index === text.length) {
        clearInterval(interval);
        callback();
      }
    }, delay);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now(),
      sender: "user",
      text: input.trim(),
    };

    // Add user's message to the chat
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      // Prepare the conversation context
      const conversationContext = messages.map((msg) => ({
        role: msg.sender === "user" ? "user" : "assistant",
        content: msg.text,
      }));

      conversationContext.push({ role: "user", content: userMessage.text });

      // Send the full conversation context to the backend
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessage.text,
          conversation: conversationContext,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Animate the bot's response
        animateText(data.response, () => setLoading(false));
      } else {
        // Display error message
        const errorMessage: Message = {
          id: Date.now() + 1,
          sender: "bot",
          text: data.error || "Something went wrong.",
        };
        setMessages((prev) => [...prev, errorMessage]);
        setLoading(false);
      }
    } catch (error) {
      console.error("Error fetching chat:", error);
      const errorMessage: Message = {
        id: Date.now() + 1,
        sender: "bot",
        text: "An unexpected error occurred.",
      };
      setMessages((prev) => [...prev, errorMessage]);
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
{/* Header */}
<header className="bg-[#D0F4DD] shadow px-4 py-4 flex items-center justify-between">
  <div className="flex items-center space-x-2">
    <Image 
      src="/NAFDAC-Logo-1-768x152.png" 
      alt="NAFGuard Logo" 
      width={768} 
      height={152} 
      className="object-contain"
      priority // Ensures the logo is loaded quickly for better LCP
    />
    {/* <h1 className="text-xl font-semibold text-[#014E2C]">
      Chat with NAFGuard
    </h1> */}
  </div>
</header>

      {/* Chat Box */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${
              msg.sender === "user" ? "justify-end" : "justify-start"
            } mb-4`}
          >
            <div
              className={`rounded-lg px-4 py-2 max-w-xl ${
                msg.sender === "user"
                  ? "bg-[#227645] text-white"
                  : "bg-white text-black"
              }`}
              dangerouslySetInnerHTML={{
                __html: msg.sender === "bot" ? formatText(msg.text) : msg.text,
              }}
            />
          </div>
        ))}

        {/* Loading Indicator */}
        {loading && (
          <div className="flex justify-start mb-4">
            <div className="flex space-x-1">
              <span className="block w-2 h-2 bg-gray-400 rounded-full animate-pulse"></span>
              <span className="block w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-200"></span>
              <span className="block w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-400"></span>
            </div>
          </div>
        )}

        {/* Bottom Reference */}
        <div ref={MessagesEndRef} />
      </div>

      {/* Input Form */}
      <form
        onSubmit={handleSubmit}
        className="flex p-4 bg-white shadow mt-auto"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-800"
          disabled={loading}
        />
        <button
          aria-label="Submit Input"
          type="submit"
          className="ml-4 bg-[#227645] text-white p-2 rounded-full hover:bg-green-600 focus:outline-none disabled:bg-green-300"
          disabled={loading}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 8l7.89 2.632a3 3 0 001.11 0L21 8M5 19h14a2 2 0 002-2v-7a2 2 0 00-2-2H5a2 2 0 00-2 2v7a2 2 0 002 2z"
            />
          </svg>
        </button>
      </form>
    </div>
  );
};

export default ChatPage;
