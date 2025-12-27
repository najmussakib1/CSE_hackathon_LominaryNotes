import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const groq = new Groq({
    apiKey: process.env.NEXT_PUBLIC_GROQ_API_KEY || process.env.GROQ_API_KEY || 'dummy_key',
});

export async function POST(req: Request) {
    try {
        const { userAnswer, currentQuestion, documentSummary, fileName, mode = 'quiz' } = await req.json();

        const activeApiKey = process.env.NEXT_PUBLIC_GROQ_API_KEY || process.env.GROQ_API_KEY;
        if (!activeApiKey || activeApiKey === 'dummy_key') {
            return NextResponse.json({
                response: mode === 'quiz'
                    ? "That's an interesting perspective. Since I'm in mock mode without an API key, I'll just say good job! What else can you tell me about this?"
                    : "In mock mode, I can't answer specific questions, but I'm sure it's a great doubt! Please set your API key to get real answers."
            });
        }

        const systemPrompt = mode === 'quiz'
            ? `You are a Socratic Revision Assistant for the document "${fileName}".
          
          DOCUMENT CONTEXT:
          ${documentSummary}

          YOUR TASK:
          1. Evaluate the user's answer to "${currentQuestion}".
          2. Provide a spoken response that acknowledges the answer and asks the next question.
          3. Provide a structured analysis for the UI.

          OUTPUT FORMAT (JSON ONLY):
          {
            "spokenResponse": "Brief feedback + next question. Keep under 40 words. No markdown.",
            "analysis": {
              "status": "correct | incorrect | partial",
              "feedback": "Concise feedback on their answer.",
              "mistakes": ["List any conceptual errors or missing points"],
              "suggestions": ["Specific tips to improve their understanding of this specific topic"]
            }
          }

          RULES:
          - Focus on 'why' and 'how'.
          - Be encouraging.`
            : `You are a Doubt Clearing Assistant for the document "${fileName}".
          
          DOCUMENT CONTEXT:
          ${documentSummary}

          YOUR TASK:
          1. Directly answer the user's question.
          2. Provide structured analysis for the UI if applicable.

          OUTPUT FORMAT (JSON ONLY):
          {
            "spokenResponse": "Direct answer. Keep under 50 words. No markdown.",
            "analysis": {
              "status": "explained",
              "feedback": "Summary of the explanation.",
              "mistakes": [],
              "suggestions": ["Related concepts to look into"]
            }
          }

          RULES:
          - Be concise and clear.`;

        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: 'system',
                    content: systemPrompt
                },
                {
                    role: 'user',
                    content: mode === 'quiz'
                        ? `My answer to "${currentQuestion}" is: "${userAnswer}"`
                        : `I have a doubt: "${userAnswer}" (referring to what we discussed: ${currentQuestion})`
                }
            ],
            model: 'llama-3.1-8b-instant',
            temperature: 0.7,
            response_format: { type: "json_object" }
        });

        const parsedResponse = JSON.parse(completion.choices[0]?.message?.content || "{}");

        return NextResponse.json(parsedResponse);

    } catch (error) {
        console.error('Quiz API error:', error);
        return NextResponse.json({ error: 'Failed to process quiz response' }, { status: 500 });
    }
}
