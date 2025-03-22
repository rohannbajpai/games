import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});


export async function POST(req: Request) {
    try {
        // Parse the request body
        let promptData;
        try {
            promptData = await req.json();
        } catch (error) {
            return NextResponse.json(
            { error: "Invalid JSON in request body" },
            { status: 400 }
            );
        }

        const { prompt } = promptData;
        if (!prompt) {
            return NextResponse.json(
            { error: "Prompt is required" },
            { status: 400 }
            );
        }

        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
              { role: "system", content: "Your goal is to name the game the user is requesting. Only output the name, nothing else." },
              { role: "user", content: prompt },
            ],
          });
          return response.choices[0].message.content.trim();

    } catch (error) {
        return NextResponse.json(
            { error: "Error processing request" },
            { status: 500 }
        );
    }
}