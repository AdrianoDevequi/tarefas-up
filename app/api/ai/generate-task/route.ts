import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
        }

        if (!process.env.GEMINI_API_KEY) {
            return NextResponse.json({
                error: "GEMINI_API_KEY not configured",
                details: "Please add your API Key to the .env file"
            }, { status: 500 });
        }

        // Convert file to base64
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64Image = buffer.toString("base64");

        // Prepare Prompt
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

        const prompt = `
            Analyze this media (image or audio).
            If it's an audio, transcribe it and extract the task details.
            If it's an image, extract text/context.

            Extract the task details and return ONLY a valid JSON object with the following fields:
            - title: A concise summary of the task (max 50 chars).
            - description: A clear description of what needs to be done based on the conversation/text.
              IMPORTANT FORMATTING RULES:
              1. Use **bold** syntax (double asterisks) to highlight important names, dates, values, or key terms.
              2. Use double line breaks (\n\n) to separate paragraphs strictly. Do not produce long blocks of text without spacing.
              3. Keep it professional and organized.
            - estimatedTime: Make a best guess based on complexity ("Rápido", "Mediano", or "Demorado"). defaults to "Mediano".
            
            Do NOT return markdown formatting for the JSON itself (like \`\`\`json). Just the raw JSON string.
            IMPORTANT: Ensure the JSON is valid. Escape all newlines within strings (use \\n, not actual line breaks).
            Translate everything to Portuguese (Brazil).
        `;

        const mediaPart = {
            inlineData: {
                data: base64Image,
                mimeType: file.type,
            },
        };

        const result = await model.generateContent([prompt, mediaPart]);
        const response = await result.response;
        let text = response.text();

        // 1. Remove Markdown
        text = text.replace(/```json/g, "").replace(/```/g, "").trim();

        // 2. Fix common JSON errors from AI (unescaped newlines inside strings)
        // This regex looks for newlines that are NOT followed by a likely JSON key or end of object
        // It's a heuristic, but often helps with "Bad control character"
        // A safer generic cleaning:
        text = text.replace(/(?:\r\n|\r|\n)/g, (match) => {
            // If the newline is surrounded by quotes, it might be valid JSON structure (pretty print). 
            // But if it's inside a value... hard to tell without context.
            // Simpler approach: Ask AI for single line, or try to parse and catch.
            return match;
        });

        // Better approach: Try to parse, if fail, try to sanitize
        let data;
        try {
            data = JSON.parse(text);
        } catch (e) {
            console.warn("JSON Parse Failed, attempting to sanitize...", text);
            // Bruteforce fix: Escaping newlines that are likely inside strings
            // We assume key-value structure. 
            // Let's rely on the prompt first, but if that fails, we return error with details.
            // Try to escape unescaped control characters
            const sanitized = text.replace(/[\u0000-\u001F]+/g, (match) => {
                if (match === '\n' || match === '\r\n') return ''; // Remove formatting newlines? No, that breaks structure if not careful.
                return '';
            });
            try {
                data = JSON.parse(sanitized);
            } catch (e2) {
                // Last resort: If the AI gave us garbage, we might just fail.
                // But let's try one more trick: escaping newlines inside double quotes?
                // Too complex for regex.
                throw new Error("Invalid JSON format from AI: " + (e instanceof Error ? e.message : String(e)));
            }
        }

        // Enforce Rule: Due Date is always 2 days from now
        const today = new Date();
        today.setDate(today.getDate() + 2);
        data.dueDate = today.toISOString().split('T')[0];

        return NextResponse.json(data);

    } catch (error) {
        console.error("AI processing error:", error);
        return NextResponse.json({ error: "Failed to process image", details: error instanceof Error ? error.message : String(error) }, { status: 500 });
    }
}
