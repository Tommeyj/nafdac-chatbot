// app/api/chat/route.ts
import Groq from "groq-sdk";
import { NextResponse } from "next/server";
import { findFAQ, findRelevantFAQ } from "../../lib/faqHelper";
import fs from "fs";
import path from "path";
import csvParser from "csv-parser";
import { google } from "googleapis";
import { authenticate } from "../../lib/googleAuth";  // Add Google authentication helper (explained below)
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

// Initialize Groq API client with API key from environment variables
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Maximum number of messages to retain for context
const MAX_CONVERSATION_LENGTH = 512; // Adjust based on your needs



// Default maximum token length for bot responses
const DEFAULT_MAX_TOKENS = parseInt(process.env.DEFAULT_MAX_TOKENS || "200");

// Define chatbot's purpose

const chatPurpose = `
I am NAFGuard, an AI assistant designed to answer questions about NAFDAC regulations, drug registration, and consumer health tips. My goal is to provide accurate, concise information to improve access to regulatory guidelines and promote public health safety. I do not respond to questions outside this context no matter how basic it is.

I respond to greetings and ask how I can assist. If I do not understand a query, I request clarification or suggest contacting NAFDAC support. I avoid assumptions, generalized responses, or discussing my training data's limitations or timestamp.

For long responses, I break them into sections of no more than 50 words each and check if users want more details. I never hallucinate answers and ensure every response aligns with my scope. For specific inquiries I can't address, I guide users to the support team.

I represent NAFDAC as a core component of its mission, confidently delivering reliable and helpful responses.

I do not provide information overload. I break probable long responses into sections of no more than 50 words each and check if users want more details. When users want to proceed, my responses are relevant, concise and still no more than 75 words. 

I prioritize conciseness and brevity of no more than 75 words in my responses.

Take note of the following updated information:

"
NAFDAC Governing Council

Dr. Mansur Kabir – Chairman
Alh. Tukur S. Fada Tambuwal – Member (Appointed by FGN)
Dr. Mufutau Bolaji Yahaya – Member (Appointed by FGN)
Permanent Secretary, Federal Ministry of Health – Member
Director-General, National Institute for Pharmaceutical Research and Development (NIPRD) – Member
Director General, Standard Organisation of Nigeria (SON) – Member
Chairman, National Drug Law Enforcement Agency (NDLEA) – Member
Chairman, Pharmacists Council of Nigeria (PCN) – Member
Chairman, Pharmaceutical Manufacturing Group of Manufacturers Association of Nigeria (PMG-MAN) – Member
Representative, Food and Beverage Group of Manufacturers Association of Nigeria (FBG – MAN) – Member
Director General, National Agency for Food and Drug Administration and Control – Member         Prof. Mojisola Christianah Adeyeye 


NAFDAC Mandate

OVERVIEW

The National Agency for Food and Drug Administration and Control (NAFDAC) was established by Decree No. 15 of 1993 as amended by Decree No. 19 of 1999 and now the National Agency for Food and Drug Administration and Control Act Cap N1 Laws of the Federation of Nigeria (LFN) 2004. The act mandates the Agency to regulate and control the manufacture, importation, exportation, distribution, advertisement, sale and use of Food, Drugs, Cosmetics, Medical Devices, Packaged Water, Chemicals and Detergents (collectively known as regulated products). The Agency was officially established in October 1992. 

Vision

To be a World Class Regulator that ensures availability of quality and safe Food, Drugs, and other Regulated Products.

Mission

To protect and promote the public health by instituting an effective and efficient regulatory system that ensures only the right quality Food, Drugs and other regulated products are manufactured, exported, imported, advertised, distributed, sold, and used.

Core Values

Ensure availability of efficacious and good quality NAFDAC regulatedproducts.
Maintain reference laboratories of International Standards.
Promote an effective and efficient well motivated and disciplined workforce.
FUNCTIONS OF NAFDAC

The functions of NAFDAC as provided in the enabling law that establishes it are to:
Regulate and control the importation, exportation, manufacture, advertisement, distribution, sale and use of food, drugs, cosmetics, medical devices, bottled water, Chemicals and detergents (Regulated Products);
Conduct appropriate tests and ensure compliance with standard specifications designated and approved by the Council for effective control of quality of regulated products and their raw materials as well as their production processes in factories and other establishments;
Undertake appropriate investigation into the production premises and raw materials for regulated products and establish relevant quality assurance systems, including certification of the production sites and of the regulated products;
Undertake inspection of imported regulated products and establish relevant quality assurance systems, including certification of the production sites.
Compile standard specifications regulations and guidelines for the production, importation, exportation, sales, distribution and registration of regulated products;
Undertake the registration of foods, drugs, cosmetics, medical devices bottled water, Chemicals and detergents;
Control the exportation and issue quality certification of products intended for export;
Establish and maintain relevant laboratories or other institutions in strategic areas of Nigeria as may be necessary for the performance of its functions;
Pronounce on the quality and safety of Products after appropriate analysis;
Take measures to ensure that the use of narcotic drugs and psychotropic substances are limited to only medical and scientific purposes;
Grant authorization for the import and export of narcotic drugs and psychotropic substances as well as other controlled substances;
Collaborate with National Drug Law Enforcement Agency (NDLEA) in the bid to eradicate drug abuse in Nigeria;
Advice Governments, the private sector and other interested bodies regarding the quality, safety and regulatory provisions on regulated products;
Issue guidelines, grant approvals and monitor the advertisement of food, drugs, cosmetics, medical devices, bottled water, Chemicals and detergents;
Compile and publish relevant data resulting from the performance of the functions of the Agency or from other sources;
Sponsor such national and International conferences as may be considered appropriate;
Liaise with relevant establishments within and outside Nigeria in pursuance of its functions and;
Carry out such activities as are necessary or expedient for the performance of its functions.

"

`;


// const chatPurpose = `
// I am an AI assistant called NAFGuard. I assist with answering questions related to NAFDAC regulations, drug registration processes, and consumer health tips. I aim to provide accurate and helpful information for improving access to regulatory guidelines and ensuring public health safety. I do not respond to questions outside this context no matter how basic it is. When greeted, i respond and ask how i can help. When asked something i don't understand, i don't assume or hallucinate; instead,  i ask the user to provide more context, clarification or send an email to nafdac support. I do not provide any information about my training data's limitation. I am confident i can help out users. I provide relevant and concise responses and try to avoid boring my users with long responses. When a prompt requires a long response (more than 100 tokens), i break them down into sections and ask if my user would like to know more at the end of each section. I ensure each section response is within ${Math.floor(DEFAULT_MAX_TOKENS * 0.75)} words. When asked a question that requires specific responses that i don't know, i do not assume nor provide generalized responses but rather direct them to contact support team for details. I do not hallucinate any response. I see myself as a crucial part of the organization and not a third-party. When prompted about my training data and timestamp, i respond by confidently reassuring the user i've been well trained with several data within my scope to provide relevant and help responses. i do not expose my knowledge cutoff or timestamp. 
// `;

// Default temperature setting
const DEFAULT_TEMPERATURE = parseFloat(process.env.DEFAULT_TEMPERATURE || "0.9");

let userIdCounter = 1;  // A simple counter to generate user IDs

export async function POST(request: Request) {
  try {
    const { message, conversation, maxTokens, temperature } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: "Message content is required." },
        { status: 400 }
      );
    }

    // Initialize or update conversation
    const updatedConversation = conversation || [];
    updatedConversation.push({ role: "user", content: message });

    // Include the system message defining the chatbot's purpose
    const systemMessage = { role: "system", content: chatPurpose };
    const conversationWithSystem = [systemMessage, ...updatedConversation];

    // Ensure the conversation does not exceed the maximum allowed length
    const truncatedConversation = truncateConversation(conversationWithSystem);

    // Check FAQs for a response
    const faqs = await loadFaqData();

    // 1. Attempt exact match
    const faqResponse = findFAQ(message, faqs);

    if (faqResponse) {
      const userId = userIdCounter++;  // Generate a unique user ID
      await logToGoogleSheet(userId, message, faqResponse);
      return NextResponse.json({ response: faqResponse });
    }

    // 2. Attempt relevant match
    const relevantFaqResponse = findRelevantFAQ(message, faqs);

    if (relevantFaqResponse) {
      const userId = userIdCounter++;  // Generate a unique user ID
      await logToGoogleSheet(userId, message, relevantFaqResponse);
      return NextResponse.json({ response: relevantFaqResponse });
    }

    // If no FAQ match, proceed with Groq API request
    const chatCompletion = await groq.chat.completions.create({
      messages: truncatedConversation,
      model: "llama-3.1-70b-versatile",
      max_tokens: maxTokens || DEFAULT_MAX_TOKENS,
      temperature: temperature || DEFAULT_TEMPERATURE,
    });

    let responseMessage =
      chatCompletion.choices[0]?.message.content || "No response from the AI.";

    // Post-process response to limit length further if needed
    responseMessage = truncateResponse(responseMessage, maxTokens || DEFAULT_MAX_TOKENS);

    // Append bot's response to the conversation
    truncatedConversation.push({ role: "assistant", content: responseMessage });

    const userId = userIdCounter++;  // Generate a unique user ID
    // Log conversation to Google Sheets
    await logToGoogleSheet(userId, message, responseMessage);

    return NextResponse.json({
      response: responseMessage,
      conversation: truncatedConversation,
    });
  } catch (error) {
    console.error("Error in chat API:", error);
    return NextResponse.json(
      { error: "An error occurred while processing your request." },
      { status: 500 }
    );
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
  if (conversation.length > MAX_CONVERSATION_LENGTH) {
    // Retain only the last MAX_CONVERSATION_LENGTH messages
    return conversation.slice(conversation.length - MAX_CONVERSATION_LENGTH);
  }
  return conversation;
}

// Function to truncate response text
function truncateResponse(response: string, maxTokens: number): string {
  const maxWords = Math.floor(maxTokens * 0.75); // Approximate word count
  const words = response.split(" ");
  if (words.length > maxWords) {
    return words.slice(0, maxWords-5).join(" ") + "...";
  }
  return response;
}

// Helper function to log interaction to Google Sheets
async function logToGoogleSheet(userId: number, userMessage: string, botResponse: string) {
  try {
    const auth = await authenticate();
    const sheets = google.sheets({ version: "v4", auth });

    // Define the spreadsheet ID and range (Update the range as per your Google Sheet)
    const spreadsheetId = process.env.SPREADSHEET_ID || 'your-google-sheet-id';
    const range = "Sheet1!A:D"; // Added User ID column (A:D: Timestamp, User ID, User Message, Bot Response)

    // Get the current timestamp
    const timestamp = new Date().toISOString();

    // Prepare data to log in Google Sheets
    const values = [[timestamp, userId, userMessage, botResponse]];

    // Append the data to the Google Sheet
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range,
      valueInputOption: "RAW",
      requestBody: {
        values,
      },
    });
    console.log("Logged to Google Sheets successfully.");
  } catch (error) {
    console.error("Error logging to Google Sheets:", error);
  }
}
