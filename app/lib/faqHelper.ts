interface FAQ {
    Question: string;
    Response: string;
}

function normalizeText(text: string): string {
    // Remove punctuation and normalize spaces
    return text.replace(/[^\w\s]/gi, '').replace(/\s+/g, ' ').trim().toLowerCase();
}

export function findFAQ(message: string, faqs: FAQ[]): string | null {
    // Normalize the input message
    const normalizedMessage = normalizeText(message);

    for (const faq of faqs) {
        // Normalize the FAQ question
        const normalizedQuestion = normalizeText(faq.Question);
        
        // Compare the normalized message with the normalized FAQ question
        if (normalizedMessage.includes(normalizedQuestion)) {
            return faq.Response;
        }
    }

    return null; // Return null if no FAQ match is found
}
