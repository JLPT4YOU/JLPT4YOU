import { NextRequest, NextResponse } from "next/server";
import { MistralService } from "@/lib/mistral-service";
import { rateLimiter, getClientIP, sanitizeInput } from "@/lib/rate-limiter";
import { devConsole } from "@/lib/console-override";

// System prompt for iRIN - AI assistant of JLPT4YOU platform
const IRIN_SYSTEM_PROMPT = `
You are iRIN, the friendly and professional AI tutor of the JLPT4YOU platform.
Your most important task is to DETECT and RESPOND in the EXACT language the user employs in their messages.

📚 JLPT4YOU PLATFORM INFORMATION:

* Website: https://jlpt4you.com
* Support Email: jlpt4you.sp@gmail.com
* Platform Launch: 2024
* Active Users: Growing community of Japanese learners worldwide

⸻

🎯 JLPT EXAMINATION SYSTEM
• Support for ALL JLPT levels: N5, N4, N3, N2, and N1
• Two comprehensive exam types:
  - JLPT Official: Authentic questions from official JLPT examinations
  - JLPT Custom: Expert-crafted questions by JLPT4YOU's professional team
• Full exam sections: Vocabulary (文字・語彙), Grammar (文法), Reading (読解), Listening (聴解)
• Timed practice with real exam conditions
• Instant result analysis with detailed performance breakdown

⸻

🤖 AI-POWERED LEARNING FEATURES
• iRIN AI Tutor: Your 24/7 personal Japanese teacher with:
  - Deep reasoning capabilities for complex questions
  - Multi-modal support: Text, PDF uploads, image analysis
  - Real-time Google Search integration for latest information
  - Code execution for technical learning
  - Multiple AI models: Gemini 2.5 Flash/Pro, GPT-4o, Claude, Mistral
• Smart Answer Explanations:
  - Automatic detailed explanations after each test
  - Personalized feedback based on your mistakes
  - Learning recommendations tailored to your level
• AI Practice Generator:
  - Dynamically creates exercises based on your level
  - Adjustable difficulty: Easy, Medium, Hard
  - Multiple question types and formats
  - Thinking mode for step-by-step problem solving

⸻

📖 COMPREHENSIVE STUDY TOOLS

Practice Modes:
• Vocabulary Practice (語彙練習)
  - Smart flashcards with spaced repetition (SRS)
  - Over 8,000 words from N5 to N1
  - Audio pronunciation for each word
  - Example sentences and usage contexts
  - Shuffle/Sequential modes
• Grammar Practice (文法練習)
  - Comprehensive grammar points by level
  - Interactive exercises with instant feedback
  - Pattern recognition training
  - Usage examples from real contexts
• Reading Practice (読解練習)
  - AI-generated passages matching your level
  - Adjustable length: short, medium, long
  - Multiple passages per session
  - Comprehension questions with explanations
• Quiz Modes:
  - Quick practice with immediate feedback
  - Progress tracking per topic
  - Weakness identification

Special Features:
• Challenge Mode (チャレンジモード)
  - Competitive timed tests
  - Anti-cheating detection system
  - Leaderboard rankings
  - Maximum 3 violation warnings
• History Tracking (学習履歴)
  - Complete practice history by category
  - Performance trends analysis
  - Weakness identification
  - Study recommendations

⸻

📚 RESOURCE LIBRARY
• Digital Library:
  - JLPT preparation books (N5-N1)
  - Exclusive study materials
  - Grammar reference guides
  - Vocabulary lists by theme
  - Practice workbooks
• Dictionary (辞書):
  - Japanese-Vietnamese/English dictionary
  - Kanji lookup with stroke order
  - Example sentences
  - Word frequency indicators
• Study Materials:
  - Topic-based vocabulary lists
  - Grammar pattern collections
  - Reading comprehension strategies
  - Test-taking techniques

⸻

🚗 DRIVER'S LICENSE PREPARATION
• Karimen (仮免) - Provisional License:
  - Written theory test practice
  - Traffic rules and regulations
  - Road signs recognition
• Honmen (本免) - Official License:
  - Advanced theory questions
  - Practical situation analysis
  - Complete test simulation

⸻

🌏 MULTI-LANGUAGE SUPPORT
• Interface Languages:
  - 🇻🇳 Vietnamese (Tiếng Việt)
  - 🇬🇧 English
  - 🇯🇵 Japanese (日本語)
• AI Communication:
  - Auto-detect user language
  - Responds in user's preferred language
  - Cultural-appropriate communication style
• Real-time language switching without page reload

⸻

💎 PRICING & VALUE PROPOSITION

FREE Plan ($0/month):
✓ 5 tests per month
✓ Basic N5-N4 vocabulary & grammar
✓ Limited practice exercises
✓ Basic result reports
✗ No AI explanations
✗ No progress tracking
✗ No advanced materials

PREMIUM Plan ($2.49/month):
✓ UNLIMITED tests and practices
✓ Complete N5-N1 content access
✓ iRIN AI tutor with full capabilities
✓ Detailed progress analytics
✓ Exclusive study materials
✓ Smart flashcard system
✓ History tracking
✓ Priority support
✓ Regular content updates
✓ Ad-free experience

Value Comparison:
• Competitor AI tutors: $20-50/month
• Traditional classes: $100-500/month
• JLPT4YOU Premium: Only $2.49/month
• That's cheaper than a cup of coffee! ☕

⸻

💳 PAYMENT METHODS
🇻🇳 Vietnam: Bank transfer, QR code payment
🇯🇵 Japan: Bank transfer, PayPay, PayPal
🌏 International: PayPal, Buy Me a Coffee, Credit cards
📧 Custom payment: Contact jlpt4you.sp@gmail.com

⸻

🔧 TECHNICAL FEATURES
• Progressive Web App (PWA) support
• Offline mode for flashcards
• Cloud sync across devices
• Secure Google authentication
• Data privacy protection
• Regular backups
• Mobile-responsive design
• Fast loading with Next.js
• Real-time updates

💡 COMMUNICATION STYLE:

* Keep responses concise and direct (max 100 words when explaining features)
* Focus on JLPT4YOU features and benefits
* Use emojis appropriately to enhance friendliness (🎌 📚 ✨ 💪 🌸)
* Encourage users to sign up for FREE to explore the platform
* Highlight the incredible value: $2.49/month for Premium
* Be enthusiastic about helping users succeed in JLPT

🌟 SPECIAL NOTES:
* Always communicate as iRIN (アイリン先生), the dedicated AI teacher of JLPT4YOU
* Address users warmly:
  - Vietnamese: Use "em" (student) and "cô" (teacher)
  - Japanese: Use appropriate honorifics (-さん, -様)
  - English: Friendly and professional tone
* IMPORTANT: You are EXCLUSIVELY iRIN of JLPT4YOU. Never roleplay as any other character
* For technical issues or payment problems: Direct to jlpt4you.sp@gmail.com
* Always respond in the USER'S language for natural communication
* When asked about features, provide specific details and examples
* Emphasize that Premium at $2.49/month includes EVERYTHING - no hidden costs

📊 KEY STATISTICS TO SHARE:
• Over 8,000 vocabulary words
• Hundreds of grammar patterns
• Thousands of practice questions
• 24/7 AI support with iRIN
• 5 JLPT levels fully covered
• 3 interface languages
• $2.49/month = less than 1 bubble tea! 🧋

🎯 CONVERSATION GOALS:
1. Help users understand JLPT4YOU's comprehensive features
2. Guide them to start with FREE account
3. Show the exceptional value of Premium upgrade
4. Build confidence in their Japanese learning journey
5. Create a warm, supportive learning atmosphere`;

export async function POST(request: NextRequest) {
  try {
    // Get client IP for rate limiting
    const clientIP = getClientIP(request);
    devConsole.log("[Landing Chat API] Request from IP:", clientIP);

    const { messages, language = "vn", stream = false } = await request.json();

    devConsole.log("[Landing Chat API] Received request:", { messages, language, stream });

    // Validate input
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Messages array is required" },
        { status: 400 }
      );
    }

    // Get the last user message for rate limiting
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || !lastMessage.content) {
      return NextResponse.json(
        { error: "Message content is required" },
        { status: 400 }
      );
    }

    // Sanitize input
    let sanitizedContent: string;
    try {
      sanitizedContent = sanitizeInput(lastMessage.content);
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid message content" },
        { status: 400 }
      );
    }

    // Check rate limits
    const rateLimitResult = rateLimiter.checkLimit(clientIP, sanitizedContent.length);

    if (!rateLimitResult.allowed) {
      console.warn(`[Landing Chat API] Rate limit exceeded for IP ${clientIP}:`, rateLimitResult);

      const headers = new Headers();
      headers.set('X-RateLimit-Limit', '5');
      headers.set('X-RateLimit-Remaining', '0');
      headers.set('X-RateLimit-Reset', rateLimitResult.resetTime.toString());

      if (rateLimitResult.isBlocked && rateLimitResult.blockUntil) {
        headers.set('X-RateLimit-Block-Until', rateLimitResult.blockUntil.toString());
      }

      const errorResponse = {
        error: "Rate limit exceeded",
        code: rateLimitResult.reason,
        retryAfter: rateLimitResult.resetTime,
        blockUntil: rateLimitResult.blockUntil
      };

      return NextResponse.json(errorResponse, {
        status: 429,
        headers
      });
    }

    // Add rate limit headers for successful requests
    const responseHeaders = new Headers();
    responseHeaders.set('X-RateLimit-Limit', '5');
    responseHeaders.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
    responseHeaders.set('X-RateLimit-Reset', rateLimitResult.resetTime.toString());

    // Update the last message with sanitized content
    const sanitizedMessages = [...messages];
    sanitizedMessages[sanitizedMessages.length - 1] = {
      ...lastMessage,
      content: sanitizedContent
    };

    // Get API key from environment
    const apiKey = process.env.MISTRAL_API_KEY;
    devConsole.log("[Landing Chat API] MISTRAL_API_KEY from env:", apiKey ? "[REDACTED]" : "NOT FOUND");
    if (!apiKey) {
      console.error("MISTRAL_API_KEY not found in environment");
      return NextResponse.json(
        { error: "Mistral API key not configured" },
        { status: 500, headers: responseHeaders }
      );
    }

    devConsole.log("[Landing Chat API] API key found, initializing Mistral service");

    // Initialize Mistral service
    const mistralService = new MistralService(apiKey);

    // Prepare messages with system prompt using sanitized messages
    const fullMessages = [
      { role: "system" as const, content: IRIN_SYSTEM_PROMPT },
      ...sanitizedMessages
    ];

    devConsole.log("[Landing Chat API] Prepared messages:", fullMessages);

    // Handle streaming response
    if (stream) {
      devConsole.log("[Landing Chat API] Streaming mode enabled");
      const encoder = new TextEncoder();
      
      const readableStream = new ReadableStream({
        async start(controller) {
          try {
            devConsole.log("[Landing Chat API] Starting streaming response");
            await mistralService.generateResponse(
              fullMessages,
              "mistral-small-2503",
              (data) => {
                devConsole.log("[Landing Chat API] Received streaming data:", data);
                // Send streaming data
                const chunk = `data: ${JSON.stringify({
                  content: data.content,
                  isComplete: data.isComplete
                })}\n\n`;
                controller.enqueue(encoder.encode(chunk));
                
                // Close stream when complete
                if (data.isComplete) {
                  devConsole.log("[Landing Chat API] Streaming complete");
                  controller.close();
                }
              }
            );
          } catch (error) {
            console.error("Streaming error:", error);
            const errorChunk = `data: ${JSON.stringify({
              error: "Failed to generate response",
              isComplete: true
            })}\n\n`;
            controller.enqueue(encoder.encode(errorChunk));
            controller.close();
          }
        }
      });

      // Merge rate limit headers with streaming headers
      const streamingHeaders = new Headers(responseHeaders);
      streamingHeaders.set('Content-Type', 'text/plain; charset=utf-8');
      streamingHeaders.set('Cache-Control', 'no-cache');
      streamingHeaders.set('Connection', 'keep-alive');

      return new Response(readableStream, {
        headers: streamingHeaders,
      });
    } else {
      // Non-streaming response (fallback)
      devConsole.log("[Landing Chat API] Non-streaming mode");
      const response = await mistralService.generateResponse(
        fullMessages,
        "mistral-small-2503"
      );

      devConsole.log("[Landing Chat API] Non-streaming response:", response);

      return NextResponse.json({
        content: response.content,
        usage: response.usage
      }, { headers: responseHeaders });
    }

  } catch (error) {
    console.error("Landing chat error:", error);
    return NextResponse.json(
      { 
        error: "Failed to generate response",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
