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
  const options = {
    timeZone: 'Asia/Kolkata', // IST Time Zone
    hour: 'numeric',
    hour12: false // 24-hour format (0-23)
};

// 'en-US' locale का उपयोग करें ताकि date-time string हमेशा 24 घंटे के फॉर्मेट में आए
const istTime = new Date().toLocaleTimeString('en-US', options);

// String को integer hours में बदलें
const hours = parseInt(istTime.split(':')[0], 10); // Example: "14"

let greeting;
if (hours >= 5 && hours < 12) { // सुबह 5:00 से 11:59 तक
  greeting = "morning";
} else if (hours >= 12 && hours < 17) { // दोपहर 12:00 से 4:59 तक
  greeting = "afternoon";
} else if (hours >= 17 && hours < 22) { // शाम 5:00 से रात 9:59 तक
  greeting = "evening";
} else { // रात 10:00 से सुबह 4:59 तक (यानी देर रात)
  greeting = "night";
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
