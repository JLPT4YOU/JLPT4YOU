import Groq from 'groq-sdk';

// Use the API key provided by the user
const apiKey = process.env.GROQ_API_KEY || 'your-groq-api-key-here';
const groq = new Groq({ apiKey });

async function main() {
  console.log("Starting Groq test for openai/gpt-oss-20b with reasoning...\n");

  // --- Part 1: Streaming Request ---
  console.log("--- Testing Streaming Request ---");
  try {
    const stream = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: "How do airplanes fly? Be concise."
        }
      ],
      model: "openai/gpt-oss-20b",
      include_reasoning: true,
      stream: true
    });

    let fullContent = "";
    console.log("Received chunks:");
    for await (const chunk of stream) {
      // Log the raw chunk to inspect its structure
      // console.log(JSON.stringify(chunk));
      const contentChunk = chunk.choices[0]?.delta?.content || '';
      process.stdout.write(contentChunk);
      fullContent += contentChunk;
    }
    console.log("\n\nStream finished. The stream only provides the 'content' field.");

  } catch (error) {
    console.error("\nError during streaming request:", error);
  }
  console.log("---------------------------------\n");


  // --- Part 2: Non-Streaming Request ---
  console.log("--- Testing Non-Streaming Request ---");
  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: "How do airplanes fly? Be concise."
        }
      ],
      model: "openai/gpt-oss-20b",
      include_reasoning: true,
      stream: false // Explicitly non-streaming
    });

    console.log("Received complete object:");
    // The 'reasoning' field should be present here
    console.log(JSON.stringify(chatCompletion.choices[0].message, null, 2));
    console.log("\nNon-streaming request finished. The 'reasoning' field is only available in the final object.");

  } catch (error) {
    console.error("Error during non-streaming request:", error);
  }
  console.log("-----------------------------------\n");
}

main().catch(console.error);

