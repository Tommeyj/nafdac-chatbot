// app/api/chat/route.ts
import Groq from "groq-sdk";
import { NextResponse } from "next/server";
import { findFAQ } from "../../lib/faqHelper";
import fs from "fs";
import path from "path";
import csvParser from "csv-parser";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Maximum number of messages to retain for context
const MAX_CONVERSATION_LENGTH = 512; // Adjust based on your needs

export async function POST(request: Request) {
    try {
        const { message, conversation } = await request.json(); // Include conversation history

        if (!message) {
            return NextResponse.json({ error: "Message content is required." }, { status: 400 });
        }

        // If there's no conversation history, start one
        const updatedConversation = conversation || [];

        // Append the new message to the conversation
        updatedConversation.push({ role: "user", content: message });

        // Ensure the conversation does not exceed the maximum allowed length (for both user and assistant messages)
        const truncatedConversation = truncateConversation(updatedConversation);

        // Here, you can integrate FAQ handling and fallback to the API
        const faqs = await loadFaqData(); // Load your CSV FAQs
        const faqResponse = findFAQ(message, faqs);
        if (faqResponse) {
            return NextResponse.json({ response: faqResponse });
        }

        // If no FAQ match, proceed with Groq API request
        const chatCompletion = await groq.chat.completions.create({
            messages: truncatedConversation, // Send the truncated conversation history
            model: "llama-3.1-70b-versatile",
        });

        const responseMessage = chatCompletion.choices[0]?.message.content || "No response from Llama.";

        // Append bot's response to the conversation
        truncatedConversation.push({ role: "assistant", content: responseMessage });

        return NextResponse.json({ response: responseMessage, conversation: truncatedConversation }); // Return the updated conversation

    } catch (error) {
        console.error("Error in chat API:", error);
        return NextResponse.json({ error: "An error occurred while processing your request." }, { status: 500 });
    }
}

// Helper function to load CSV FAQs
async function loadFaqData() {
    const faqs: any[] = [];
    const filePath = path.join(process.cwd(), "data", "faqs.csv");

    return new Promise<any[]>((resolve, reject) => {
        fs.createReadStream(filePath)
            .pipe(csvParser())
            .on("data", (row) => {
                faqs.push(row);
            })
            .on("end", () => resolve(faqs))
            .on("error", (err) => reject(err));
    });
}

// Function to truncate conversation if it exceeds MAX_CONVERSATION_LENGTH
function truncateConversation(conversation: any[]) {
    // If conversation exceeds MAX_CONVERSATION_LENGTH, slice it
    if (conversation.length > MAX_CONVERSATION_LENGTH) {
        // Retain only the last MAX_CONVERSATION_LENGTH messages
        return conversation.slice(conversation.length - MAX_CONVERSATION_LENGTH);
    }
    return conversation; // No truncation needed
}
