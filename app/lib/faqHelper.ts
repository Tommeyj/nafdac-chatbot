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

// NEW: Function for finding relevant FAQ based on keyword or similarity matching
export function findRelevantFAQ(userInput: string, faqs: FAQ[]): string | null {
    let bestMatch = { question: "", response: "", score: 0 };

    const normalizedInput = normalizeText(userInput);

    faqs.forEach((faq) => {
        // Calculate keyword overlap
        const normalizedQuestion = normalizeText(faq.Question);
        const questionWords = new Set(normalizedQuestion.split(" "));
        const inputWords = new Set(normalizedInput.split(" "));

        const intersection = new Set(
            [...questionWords].filter((word) => inputWords.has(word))
        );

        const similarityScore = intersection.size / questionWords.size;

        // Weighting for critical keywords
        const criticalKeywords = ["drug", "registration", "approval", "guideline"];
        const criticalMatch = criticalKeywords.some((keyword) =>
            normalizedInput.includes(keyword)
        )
            ? 0.1
            : 0;

        const adjustedScore = similarityScore + criticalMatch;

        // Keep track of the highest score
        if (adjustedScore > bestMatch.score) {
            bestMatch = {
                question: faq.Question,
                response: faq.Response,
                score: adjustedScore,
            };
        }
    });

    // Updated threshold
    const RELEVANCE_THRESHOLD = 0.7;

    // Contextual filtering
    if (bestMatch.score >= RELEVANCE_THRESHOLD) {
        const isContextual = validateContext(bestMatch.response);
        return isContextual ? bestMatch.response : null;
    }

    return null; // No relevant match found
}

// NEW: Function to validate response context
function validateContext(response: string): boolean {
    const allowedTopics = ["drug", "regulation", "health", "approval"];
    const normalizedResponse = normalizeText(response);

    return allowedTopics.some((topic) => normalizedResponse.includes(topic));
}

