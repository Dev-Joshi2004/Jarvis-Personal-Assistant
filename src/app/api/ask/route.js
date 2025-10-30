// import { GoogleGenerativeAI } from "@google/generative-ai";

// export async function POST(req) {
//   try {
//     const { prompt } = await req.json();
//     const command = (prompt || "").trim().toLowerCase();

//     // 🎩 Case 1: Empty command
//     if (!command) {
//       return new Response(
//         JSON.stringify({ reply: "Yes Sir — how can I assist you?" }),
//         { status: 200, headers: { "Content-Type": "application/json" } }
//       );
//     }

//     // 🎬 Case 2: Built-in browser commands
//     if (command.includes("open youtube"))
//       return new Response(JSON.stringify({ reply: "__OPEN_YOUTUBE__" }), {
//         status: 200,
//         headers: { "Content-Type": "application/json" },
//       });
//     if (command.includes("open google"))
//       return new Response(JSON.stringify({ reply: "__OPEN_GOOGLE__" }), {
//         status: 200,
//         headers: { "Content-Type": "application/json" },
//       });
//     if (command.includes("open gmail"))
//       return new Response(JSON.stringify({ reply: "__OPEN_GMAIL__" }), {
//         status: 200,
//         headers: { "Content-Type": "application/json" },
//       });

//     // 🎯 Case 3: Only trigger AI if wake word present
//     if (!command && !prompt.toLowerCase().includes("jarvis"))
//       {
//       return new Response(JSON.stringify({ reply: "" }), {
//         status: 200,
//         headers: { "Content-Type": "application/json" },
//       });
//     }

//     const apiKey = process.env.GEMINI_API_KEY;
//     if (!apiKey) {
//       throw new Error("Gemini API key missing");
//     }

//     // 🧠 Gemini AI Client
//     const genAI = new GoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY });
//     const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

//     // ✍️ Better formatted prompt
//     const formattedPrompt = `
// You are J.A.R.V.I.S — a smart, polite, and loyal AI assistant created by your master, "Sir".
// Always respond in clean, grammatically correct English with zero spelling mistakes.
// Always address the user as "Sir".
// Be confident but respectful.
// The user said: "${prompt}"
// `;

//     const result = await model.generateContent(formattedPrompt);
//     const text =
//       result.response.text() || "Sorry Sir, I couldn’t generate a reply.";

//     return new Response(JSON.stringify({ reply: text }), {
//       status: 200,
//       headers: { "Content-Type": "application/json" },
//     });
//   } catch (error) {
//     console.error("Error calling Gemini:", error);
//     return new Response(JSON.stringify({ error: "AI request failed" }), {
//       status: 500,
//       headers: { "Content-Type": "application/json" },
//     });
//   }
// }

// import { GoogleGenerativeAI } from "@google/generative-ai";

// export async function POST(req) {
//   try {
//     const { prompt } = await req.json();

//     if (!prompt) {
//       return new Response(JSON.stringify({ error: "No prompt provided" }), {
//         status: 400,
//       });
//     }

//     // 🧠 Initialize Gemini client
//     const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
//     const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

//     // 🗣️ Format input as Jarvis-style instruction
//     const formattedPrompt = `
// You are J.A.R.V.I.S — an intelligent, polite, and loyal AI assistant created by your master, "Sir".
// Always reply in clean, grammatically correct English with zero spelling mistakes.
// Always address the user as "Sir" and respond in a confident but respectful tone.
// If the message doesn’t include your activation keyword ("Utho Jarvis"), do not respond at all.
// Now, the user says: "${prompt}"
// `;

//     // 🚀 Generate response from Gemini
//     const result = await model.generateContent(formattedPrompt);
//     const text =
//       result.response.text() || "Sorry Sir, I couldn’t generate a reply.";

//     return new Response(JSON.stringify({ reply: text }), {
//       status: 200,
//       headers: { "Content-Type": "application/json" },
//     });

//   } catch (error) {
//     console.error("Error calling Gemini:", error);
//     return new Response(JSON.stringify({ error: "AI request failed" }), {
//       status: 500,
//       headers: { "Content-Type": "application/json" },
//     });
//   }
// }

// api/ask/route.js

// api/ask/route.js

import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({});

const toGeminiContent = (history) => {
  return history.map( message => ({
    role: message.role === 'model' ? 'model' : 'user',
    parts: [{ text: message.content}]
  }))
}

const systemInstruction = `You are J.A.R.V.I.S — an intelligent, polite, and loyal AI assistant created by your master, "Sir".
    
    GUIDELINES:
    1. Tone: Always address the user as "Sir" and maintain a confident, respectful, and slightly formal tone. Vary your language to be more natural.
    2. Language Preference: Your preferred language for all greetings and general replies is **Hinglish**. Only switch to full English if the user explicitly asks to speak in English.
    3. Spelling: Absolutely ensure zero spelling mistakes.
    4. Commands: If the user asks for any action that requires a command (like opening a website or searching YouTube), you MUST output ONLY the command string and nothing else. NO PRECEDING OR FOLLOWING TEXT.
        - To open YouTube: respond with "__OPEN_YOUTUBE__"
        - To open Google: respond with "__OPEN_GOOGLE__"
        - To open Gmail: respond with "__OPEN_GMAIL__"
        
        - To open ANY SPECIFIC WEBSITE: You MUST use the **googleSearch** tool first to find the exact website URL. Once the URL is found via the tool, respond with ONLY the format: "__OPEN_URL__:https://www.example.com"
        
        - To search/play a specific YouTube video or song: Use googleSearch, find the query, and respond with ONLY: "__SEARCH_YOUTUBE__:QUERY"
    5. General Chat: For all other questions, respond with helpful, well-structured, and concise text.`;

export async function POST(req) {

  const {history} = await req.json();

  // Time-based Greeting Logic
  const now = new Date();
  const hours = now.getHours();
  let greeting;
  if (hours < 12) {
    greeting = "morning";
  } else if (hours < 17) {
    greeting = "afternoon";
  } else {
    greeting = "evening";
  }
  
  // Dynamic System Prompt
  const dynamicSystemInstruction = `${systemInstruction}
CURRENT TIME GREETING: The current time suggests it is ${greeting}, Sir.`;


  const geminiContents = toGeminiContent(history);

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: geminiContents,
    config: {
      systemInstruction: dynamicSystemInstruction,
      thinkingConfig : {
        thinkingBudget: 0,
      },
      temperature: 0.1,
    },
    tools: [{ googleSearch: {} }], 
  });
  
  let finalResponseText = response.text;

  // 🚨 STEP 1: Handle Tool Call (Function Calls)
  if (response.functionCalls && response.functionCalls[0].name === 'googleSearch') {
    const query = response.functionCalls[0].args.query;
    
    // Check 1: YouTube Search
    if (query.toLowerCase().includes("youtube") || query.toLowerCase().includes("video") || query.toLowerCase().includes("song")) {
        finalResponseText = `__SEARCH_YOUTUBE__:${query}`;
    }
    // Check 2: Dynamic Website Open (General Website or Social Media)
    else if (response.candidates && response.candidates[0].groundingMetadata) {
      const webResults = response.candidates[0].groundingMetadata.web;

      let foundUrl = null;
      
      if(webResults && webResults.length > 0){
        const topUrl = webResults[0].uri;
        
        // Check for a valid URL
        if (topUrl && (topUrl.startsWith('http://') || topUrl.startsWith('https://'))){
          foundUrl = topUrl
        }
      } 
      
      // 🚨 FIX: Separate IF/ELSE block to handle success or failure
      if (foundUrl) {
          // ✅ Success: Found a valid URL, generate command
          finalResponseText = `__OPEN_URL__:${foundUrl}`;
      } else {
          // ❌ Failure: No valid URL found, generate 'Not Found' message
          finalResponseText = `Ji Sir, mujhe aapke diye gaye naam ("${query}") se koi specific website nahi mil paayi. Kya aap kisi aur website ki baat kar rahe hain?`;
      }
    }
     else {
        // Fallback if tool was used but groundingMetadata is missing
         finalResponseText = response.text;
    }
  }

  // 🚨 STEP 2: Extract Command from the final response (ensures clean output if model added text)
  const allCommands = [
    "__OPEN_YOUTUBE__", 
    "__OPEN_GOOGLE__", 
    "__OPEN_GMAIL__", 
    "__SEARCH_YOUTUBE__:",
    "__OPEN_URL__:"
  ];

  for (const cmd of allCommands) {
    if (finalResponseText.includes(cmd)) {
        const startIndex = finalResponseText.indexOf(cmd);
        
        // Remove any preceding text to ensure only the command is sent
        finalResponseText = finalResponseText.substring(startIndex).trim();
        break;
    }
  }

  // 🚨 STEP 3: If no command was found, keep the model's standard Hinglish/General response.
  if (!finalResponseText.startsWith('__OPEN_URL__:') && !finalResponseText.startsWith('__SEARCH_YOUTUBE__:') && !finalResponseText.startsWith('__OPEN_YOUTUBE__') && !finalResponseText.startsWith('__OPEN_GOOGLE__') && !finalResponseText.startsWith('__OPEN_GMAIL__')) {
    // This is the model's text response.
  }

  console.log(finalResponseText);
  return new Response(JSON.stringify({reply : finalResponseText}));
}