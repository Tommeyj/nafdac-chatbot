---

# NAFGuard AI Chatbot: Project README

Welcome to the **NAFGuard AI Chatbot** repository! This project is designed to provide a smart, interactive, and responsive chatbot tailored to the needs of users seeking information on **NAFDAC regulations**, **drug registration processes**, and **consumer health tips**. NAFGuard leverages advanced AI capabilities to deliver accurate, context-aware, and concise responses while adhering to the organization's guidelines.

---

## **Project Overview**

The NAFGuard AI Chatbot serves as a digital assistant, ensuring improved access to regulatory guidelines and enhancing public health safety. 

### **Core Features**
1. **Accurate Information Retrieval**:
   - Answers questions related to NAFDAC regulations, drug registration, and public health.
   - Handles FAQs dynamically, providing exact or relevant matches based on user queries.

2. **Human-Like Interaction**:
   - Greets users and engages in natural, interactive conversations.
   - Breaks down long responses into manageable sections and prompts users for further inquiries.

3. **Error Management**:
   - Does not hallucinate responses or provide inaccurate details.
   - Encourages users to clarify queries or directs them to contact NAFDAC support for additional assistance.

4. **Log Export to Google Sheets**:
   - Captures and logs chatbot conversations in real time.
   - Exports logs to a designated Google Sheet for data analysis, debugging, or future improvements.
   - Environment variables for this functionality:
     - `SPREADSHEET_ID`: The unique identifier of the target Google Sheet.
     - `GOOGLE_SHEET_CLIENT_EMAIL`: The service account email with access to the Google Sheet.
     - `GOOGLE_SHEET_PRIVATE_KEY`: The private key for authenticating the service account securely.

5. **Enhanced Responsiveness**:
   - Mobile-friendly design ensures smooth interaction across devices.
   - Tailored to respond quickly while adhering to organizational standards.

---

## **Technical Specifications**

### **Frontend**
- Developed using **React** and **Tailwind CSS**.
- Features an interactive user input form for seamless communication.

### **Backend**
- Built with **Next.js** API routes.
- Powered by **Groq SDK** for intelligent, context-aware conversational responses.
- **FAQs Integration**:
  - Pulls data from a CSV file (`data/faqs.csv`) for quick retrieval.
  - Supports both exact and contextually relevant matches.
- **Google Sheets Integration**:
  - Logs conversation data securely and dynamically to Google Sheets.
  - Requires the following `.env` variables:
    - `SPREADSHEET_ID`
    - `GOOGLE_SHEET_CLIENT_EMAIL`
    - `GOOGLE_SHEET_PRIVATE_KEY`

### **AI Model**
- Uses the **Llama 3.1 70B Versatile** model for generating responses.
- Configurable settings:
  - Default maximum tokens: 500.
  - Default temperature: 0.7 (for controlled randomness).

---

## **Setup Instructions**

### Prerequisites
- Node.js >= 14.x
- Environment variables configured in `.env`:
  - `GROQ_API_KEY`
  - `SPREADSHEET_ID`
  - `GOOGLE_SHEET_CLIENT_EMAIL`
  - `GOOGLE_SHEET_PRIVATE_KEY`
  - `DEFAULT_MAX_TOKENS`
  - `DEFAULT_TEMPERATURE`

### Steps
1. Clone this repository:
   ```bash
   git clone <repository-url>
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
4. Access the chatbot at `http://localhost:3000`.

---

## **Contributing**

Contributions are welcome! Please follow these steps:
1. Fork the repository.
2. Create a feature branch:
   ```bash
   git checkout -b feature-name
   ```
3. Commit changes and push to your fork.
4. Create a pull request detailing the changes.

---

## **Future Enhancements**
- **Multi-language Support**: To serve a broader audience.
- **Advanced Analytics**: Track and optimize user interactions.
- **Customizable Chat Themes**: Personalize user experiences.
- **Integration with External APIs**: Enable seamless access to third-party resources.

---

## **License**
This project is licensed under the MIT License. See the `LICENSE` file for details.

---

## **Acknowledgments**
Special thanks to the NAFDAC team, SYL Multimedia team, 3MTT Cohort ALC Team 1, and contributors for their support in making this project a reality. The chatbot's AI capabilities were built with insights into user needs and organizational goals.

For inquiries, please contact **[tomiwaoladipo1@gmail.com]**.

---

