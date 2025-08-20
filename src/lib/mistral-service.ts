import { Mistral } from "@mistralai/mistralai";

// Define interfaces locally since they're missing from ai-shared-utils
interface StreamCallbackData {
  content: string;
  isComplete: boolean;
  error?: string;
}

interface AIServiceResponse {
  content: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
  };
}

export class MistralService {
  private client: Mistral;
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.client = new Mistral({
      apiKey: apiKey,
    });
  }

  async generateResponse(
    messages: Array<{ role: "user" | "assistant" | "system"; content: string }>,
    model: string = "mistral-large-latest",
    streamCallback?: (data: StreamCallbackData) => void
  ): Promise<AIServiceResponse> {
    try {
      console.log("[Mistral Service] generateResponse called with:", { messages, model, streamCallback: !!streamCallback });
      
      if (streamCallback) {
        console.log("[Mistral Service] Streaming mode enabled");
        // Stream mode
        const stream = await this.client.chat.stream({
          model: model,
          messages: messages,
          temperature: 0.7,
          maxTokens: 512,
          stream: true,
        });

        console.log("[Mistral Service] Stream created successfully");
        let fullContent = "";
        const usage = { inputTokens: 0, outputTokens: 0 };

        try {
          for await (const chunk of stream) {
            console.log("[Mistral Service] Received chunk:", JSON.stringify(chunk, null, 2));

            // Cast to any to handle different chunk structures
            const chunkData: any = chunk;

            // Mistral returns data in chunk.data property
            const data = chunkData.data || chunkData;

            // Handle streaming content
            if (data.choices && data.choices.length > 0) {
              const choice = data.choices[0];
              const content = choice.delta?.content;
              console.log("[Mistral Service] Content from chunk:", content);
              if (content && typeof content === 'string' && content.length > 0) {
                fullContent += content;
                streamCallback({
                  content: content,
                  isComplete: false,
                });
              }
            }

            // Update usage if available
            if (data.usage) {
              usage.inputTokens = data.usage.promptTokens || 0;
              usage.outputTokens = data.usage.completionTokens || 0;
            }
          }
        } catch (streamError) {
          console.error("[Mistral Service] Streaming error:", streamError);
          throw streamError;
        }

        console.log("[Mistral Service] Streaming complete, full content length:", fullContent.length);
        streamCallback({
          content: "",
          isComplete: true,
        });

        return {
          content: fullContent,
          usage: usage,
        };
      } else {
        console.log("[Mistral Service] Non-streaming mode");
        // Non-stream mode
        const response = await this.client.chat.complete({
          model: model,
          messages: messages,
          temperature: 0.7,
          maxTokens: 512,
        });

        console.log("[Mistral Service] Non-streaming response:", response);

        if (!response.choices || response.choices.length === 0) {
          throw new Error("No response from Mistral");
        }

        const messageContent = response.choices[0].message.content;
        const content = typeof messageContent === 'string' ? messageContent :
                       Array.isArray(messageContent) ? messageContent.map(c =>
                         c.type === 'text' ? c.text : ''
                       ).join('') : '';

        return {
          content: content,
          usage: {
            inputTokens: response.usage?.promptTokens || 0,
            outputTokens: response.usage?.completionTokens || 0,
          },
        };
      }
    } catch (error) {
      console.error("Mistral API error:", error);
      throw new Error(`Mistral API error: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  async validateApiKey(): Promise<boolean> {
    try {
      // Test with a simple request
      await this.client.chat.complete({
        model: "mistral-small-latest",
        messages: [{ role: "user", content: "test" }],
        maxTokens: 1,
      });
      return true;
    } catch {
      return false;
    }
  }

  getAvailableModels() {
    return [
      { id: "mistral-large-latest", name: "Mistral Large (Latest)" },
      { id: "mistral-medium-latest", name: "Mistral Medium (Latest)" },
      { id: "mistral-small-latest", name: "Mistral Small (Latest)" },
      { id: "open-mistral-nemo", name: "Open Mistral Nemo" },
      { id: "open-mixtral-8x7b", name: "Open Mixtral 8x7B" },
      { id: "open-mixtral-8x22b", name: "Open Mixtral 8x22B" },
    ];
  }
}
