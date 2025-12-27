import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { createRequire } from 'module';

const groq = new Groq({
    apiKey: process.env.NEXT_PUBLIC_GROQ_API_KEY || process.env.GROQ_API_KEY || 'dummy_key',
});

export async function POST(req: Request) {
    console.log("API: POST /api/analyze received");
    try {
        const require = createRequire(import.meta.url);
        const pdf = require('pdf-parse/lib/pdf-parse.js');

        const formData = await req.formData();
        const files = formData.getAll('files') as File[];

        if (!files || files.length === 0) {
            return NextResponse.json({ error: 'No files provided' }, { status: 400 });
        }

        let combinedText = '';
        for (const file of files) {
            console.log(`API: Processing file: ${file.name}`);
            let text = '';
            if (file.type === 'application/pdf') {
                const buffer = Buffer.from(await file.arrayBuffer());
                const data = await pdf(buffer);
                text = data.text;
            } else {
                text = await file.text();
            }
            combinedText += `\n\n--- CONTENT FROM FILE: ${file.name} ---\n${text}`;
        }

        if (!combinedText || combinedText.trim().length === 0) {
            return NextResponse.json({ error: 'Could not extract text from any of the files' }, { status: 400 });
        }

        // Detect API key correctly
        const activeApiKey = process.env.NEXT_PUBLIC_GROQ_API_KEY || process.env.GROQ_API_KEY;
        const isDummy = !activeApiKey || activeApiKey === 'dummy_key';

        // If no real API key is present, mock the response
        if (isDummy) {
            console.log("API: No Groq key found, providing mock data");
            return NextResponse.json({
                documents: files.map(f => ({
                    fileName: f.name,
                    summary: `[MOCK] This is an individual summary for ${f.name}. To see real AI analysis, ensure GROQ_API_KEY is set.`,
                    questions: [
                        `How does ${f.name} contribute to the overall subject?`,
                        "What is the most important concept in this specific file?"
                    ],
                    mistakes: [
                        {
                            pitfall: "Confusing this document's scope with another",
                            correction: "Focus on the unique data provided in this specific file."
                        }
                    ],
                    voiceConfig: {
                        systemPrompt: `You are a Socratic tutor for the document: ${f.name}. Ask short questions one-by-one.`,
                        firstQuestion: `Ready to quiz on ${f.name}? What is the main theme?`
                    }
                }))
            });
        }

        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: 'system',
                    content: `You are an elite academic tutor and conceptual analyst. You have been provided with one or more study documents.
          
          TASK:
          Analyze EACH document independently and generate a structured JSON response. 
          Your analysis must be DEEP and CONCEPTUAL. Avoid generic summaries or obvious questions.
          
          FOR EACH DOCUMENT:
          1. fileName: The exact name of the file.
          2. summary: A high-level conceptual summary. Don't just list topics; explain the fundamental theories, "why" it matters, and the core intellectual architecture of the material (3-4 sentences).
          3. questions: 3-4 deep, Socratic practice questions. These should test first principles and "how" things relate, not just rote memorization.
          4. mistakes: Identify 1-2 subtle conceptual pitfalls where students often trip up, and provide corrective insights.

          Output JSON structure:
          {
            "documents": [
              {
                "fileName": "string",
                "summary": "string",
                "questions": ["string", "string", ...],
                "mistakes": [
                  { "pitfall": "string", "correction": "string" }
                ]
              },
              ...
            ]
          }

          NOTES CONTENT TO ANALYZE:
          ${combinedText.substring(0, 12000)}`
                },
                { role: 'user', content: "Perform a deep conceptual analysis of each document provided." }
            ],
            model: 'llama-3.1-8b-instant',
            temperature: 0.3,
            response_format: { type: "json_object" }
        });

        const content = completion.choices[0]?.message?.content;
        if (!content) throw new Error('No content from Groq');

        const parsedContent = JSON.parse(content);

        // Inject Socratic instructions for each document
        if (parsedContent.documents) {
            parsedContent.documents = parsedContent.documents.map((doc: any) => ({
                ...doc,
                voiceConfig: {
                    systemPrompt: `You are a Socratic Revision Assistant for the document "${doc.fileName}". 
                    
                    RULES:
                    1. ASK ONLY ONE QUESTION AT A TIME about "${doc.fileName}".
                    2. FEEDBACK: Give brief feedback on the user's answer, then ask the next question.
                    3. CONCISE: Keep responses under 15 words.
                    4. FOCUS: Stay strictly on the content summarized for this document: ${doc.summary}`,
                    firstQuestion: doc.questions[0] || `Ready to start the quiz for ${doc.fileName}?`
                }
            }));
        }

        return NextResponse.json(parsedContent);

    } catch (error) {
        console.error('Analysis error:', error);
        return NextResponse.json({
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        }, { status: 500 });
    }
}
