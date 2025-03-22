import { NextResponse } from "next/server";
import OpenAI from "openai";
import Anthropic from '@anthropic-ai/sdk';


// Initialize the OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const anthropic = new Anthropic({
  apiKey: process.env.ANHROPIC_API_KEY
});

// Helper function for OpenAI agent calls
async function queryOpenAI(
  role: string,
  prompt: string,
  model: string = "gpt-4o"
): Promise<string> {
  const response = await openai.chat.completions.create({
    model,
    messages: [
      { role: "system", content: role },
      { role: "user", content: prompt },
    ],
  });
  return response.choices[0].message.content.trim();
}

// New helper function for Anthropics' Claude 3.7 Sonnet
async function queryAnthropic(
  role: string,
  prompt: string
): Promise<string> {

  const response = await anthropic.messages.create({
    model: "claude-3-7-sonnet-20250219",
    max_tokens: 16384,
    messages: [
      { role: "assistant", content: role },
      { role: "user", content: prompt }
    ],
  });

  let responseText = '';

  for (const content of response.content) {
    responseText += content.type === 'text' ? content.text : '';
  }
  return responseText.trim();
}

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
    const task = prompt; // Use the prompt as the task description

    // 1. Perception Agent (Primary Sensory Cortex)
    const perceptionRole =
      "You are the sensory perception module, modeled after the primary sensory cortex. Your role is to receive the raw game design request and reframe it into a clear, structured game concept with core mechanics, theme, and user experience details.";
    const perceptionOutput = await queryOpenAI(perceptionRole, task, "gpt-4o");

    console.log(perceptionOutput)

    // 2. Attention Agent (Parietal Cortex)
    const attentionRole =
      "You are the attention and relevance filter, akin to the parietal cortex. Analyze the structured game concept from the Perception Agent and extract the most critical elements—such as game mechanics, control schemes, themes, and visual style. Provide a concise, prioritized list.";
    const attentionOutput = await queryOpenAI(
      attentionRole,
      `Task: ${task}\nPerception Output: ${perceptionOutput}`,
      "gpt-4o"
    );

    console.log(attentionOutput)

    // 3. Memory Agent (Hippocampus)
    const memoryRole =
      "You are the memory recall system, comparable to the hippocampus. Retrieve all relevant background knowledge, design patterns, tutorials, and successful ThreeJS game design examples related to the identified elements. Summarize this information to support the game concept.";
    const memoryOutput = await queryOpenAI(
      memoryRole,
      `Task: ${task}\nPerception Output: ${perceptionOutput}\nAttention Output: ${attentionOutput}`,
      "gpt-4o-search-preview"
    );

    console.log(memoryOutput)

    // 4. Emotion Agent (Amygdala & Ventral Striatum)
    const emotionRole =
      "You are the emotion and reward processing module, similar to the amygdala and ventral striatum. Evaluate the emotional impact and user engagement potential of the game concept, highlighting how the design might evoke positive feelings and player satisfaction.";
    const emotionOutput = await queryOpenAI(
      emotionRole,
      `Task: ${task}\nPerception Output: ${perceptionOutput}\nAttention Output: ${attentionOutput}\nMemory Output: ${memoryOutput}`,
      "gpt-4.5-preview"
    );
    console.log(emotionOutput)

    // 5. Context Agent (Medial Prefrontal Cortex & Default Mode Network)
    const contextRole =
      "You are the narrative and context synthesis module, modeled after the medial prefrontal cortex and default mode network. Integrate the game concept with broader contextual elements like market trends, long-term engagement, and societal values. Generate a comprehensive narrative that sets the stage for the game.";
    const contextOutput = await queryOpenAI(
      contextRole,
      `Task: ${task}\nPerception Output: ${perceptionOutput}\nAttention Output: ${attentionOutput}\nMemory Output: ${memoryOutput}\nEmotion Output: ${emotionOutput}`,
      "gpt-4.5-preview"
    );
    console.log(contextOutput)

    // 6. Planning Agent (Prefrontal Cortex)
    const planningRole =
      "You are the planning module, analogous to the prefrontal cortex. Develop multiple viable strategies or solution paths for implementing the game using no-code tools. Your plan should be detailed, step-by-step, and clearly actionable.";
    const planningOutput = await queryOpenAI(
      planningRole,
      `Task: ${task}\nPerception Output: ${perceptionOutput}\nAttention Output: ${attentionOutput}\nMemory Output: ${memoryOutput}\nEmotion Output: ${emotionOutput}\nContext Output: ${contextOutput}`,
      "o3-mini"
    );
    console.log(planningOutput)
    

    // 7. World Model Agent (Cerebellum)
    const worldModelRole =
      "You are the world model evaluator, analogous to the cerebellum, which integrates sensorimotor feedback. Assess the real-world feasibility of the proposed game design by considering practical constraints, platform limitations, and UI requirements. Provide a comprehensive evaluation.";
    const worldModelOutput = await queryOpenAI(
      worldModelRole,
      `Task: ${task}\nPlanning Output: ${planningOutput}`,
      "o3-mini"
    );
    console.log(worldModelOutput)

    // 8. Decision Agent (Orbitofrontal Cortex)
    const decisionRole =
      "You are the decision-making evaluator, similar to the orbitofrontal cortex. Review all strategies and evaluations, weigh their pros and cons, and select the most optimal game design plan. Provide a detailed justification for your decision.";
    const decisionOutput = await queryOpenAI(
      decisionRole,
      `Task: ${task}\nPlanning Output: ${planningOutput}\nWorld Model Output: ${worldModelOutput}`,
      "o1"
    );
    console.log(decisionOutput)

    // 9. Action Agent (Motor Cortex)
    const actionRole =
      "You are the motor execution system, modeled after the motor cortex. Generate a complete, ready-to-run HTML file that implements the game based on the selected design plan. The HTML must include the game area, controls, and all necessary embedded styles or scripts. Double-check for bugs before returning the final code. Your response must be ONLY the complete HTML file, starting with <!DOCTYPE html> and ending with </html>.";
    const finalOutput = await queryAnthropic(
      actionRole,
      `Task: ${task}\nDecision: ${decisionOutput}`
    );

    console.log(finalOutput);
    return NextResponse.json({ html: finalOutput });
  } catch (error: any) {
    console.error("Error in API route:", error.message || error);
    return NextResponse.json(
      { error: error.message || "Failed to generate output" },
      { status: 500 }
    );
  }
}
