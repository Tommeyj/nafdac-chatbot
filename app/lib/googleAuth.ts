// lib/googleAuth.ts
import { google } from "googleapis";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

export async function authenticate() {
  // Use environment variables for credentials instead of reading from credentials.json
  const { GOOGLE_SHEET_CLIENT_EMAIL, GOOGLE_SHEET_PRIVATE_KEY } = process.env;

  // Check if the necessary environment variables are set
  if (!GOOGLE_SHEET_CLIENT_EMAIL || !GOOGLE_SHEET_PRIVATE_KEY) {
    throw new Error("Google credentials are missing from environment variables.");
  }

  // Replace escaped newlines in private key string (if any)
  const privateKey = GOOGLE_SHEET_PRIVATE_KEY.replace(/\\n/g, "\n");

  // Set up Google authentication with the credentials
  const auth = new google.auth.JWT(
    GOOGLE_SHEET_CLIENT_EMAIL, // Client email from environment variables
    undefined,  // No need for a keyFile or a specific keyId, we're using private_key directly
    privateKey, // Private key from environment variables (with fixed line breaks)
    ["https://www.googleapis.com/auth/spreadsheets"] // Scope for Google Sheets API
  );

  // Ensure authentication is successful
  await auth.authorize();

  return auth; // Return the authenticated JWT client
}
