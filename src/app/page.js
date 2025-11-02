// Home.js (FINAL VERSION - ALL FIXES INCLUDED)
"use client";
import { useState, useEffect, useRef } from "react"; 
import Visualizer from './components/Visualizer'; 

export default function Home() {
  const [input, setInput] = useState("");
  const [response, setResponse] = useState(""); 
  const [displayedResponse, setDisplayedResponse] = useState(""); 
  const [userMessage, setUserMessage] = useState(""); 
  const [loading, setLoading] = useState(false);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [rawBackendHistory, setRawBackendHistory] = useState([]);
  const [commandToExecute, setCommandToExecute] = useState(null); 
  const [availableVoices, setAvailableVoices] = useState([]); 
  const [isTtsActive, setIsTtsActive] = useState(false);
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null); 
  
  const AI_NAME = "J.A.R.V.I.S";

  const isSpeaking = loading || (response && displayedResponse.length < response.length) || isTtsActive;


  // 💡 useEffect to load and store all available voices once (FIX for voice stability)
  useEffect(() => {
    const synth = window.speechSynthesis;
    
    const loadVoices = () => {
        const voices = synth.getVoices();
        // केवल hi-IN और en-US/en-IN voices को फ़िल्टर करें
        setAvailableVoices(voices.filter(v => v.lang.startsWith('hi') || v.lang.startsWith('en')));
    };
    
    synth.addEventListener('voiceschanged', loadVoices);
    
    const timer = setTimeout(() => {
        if (synth.getVoices().length > 0) {
            loadVoices();
        }
    }, 1500); 

    return () => {
      clearTimeout(timer);
      synth.removeEventListener('voiceschanged', loadVoices);
      
      // 🚨 TTS FIX 1: पेज अनमाउंट होने पर बोलना तुरंत बंद करें
      if (synth) {
          synth.cancel();
      }
    };
  }, []);

  // 💡 NEW FUNCTION: Handles Voice Output (Text-to-Speech)
  const speakResponse = (text) => {
    const synth = window.speechSynthesis;
    if (!synth || !text) return;

    if (synth.speaking) {
        synth.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(text);

    utterance.onstart = () => setIsTtsActive(true);
    utterance.onend = () => setIsTtsActive(false); 
    utterance.onerror = () => setIsTtsActive(false); 
    
    utterance.rate = 0.85; 
    utterance.pitch = 1.1; 
    utterance.lang = 'hi-IN'; // Default Fallback

    let selectedVoice = null;
    
    // 1. सबसे पहले Google US English Male/Standard खोजें
    selectedVoice = availableVoices.find(
      (voice) => voice.lang === 'en-US' && (voice.name.includes('Male') || voice.name.includes('Standard') || voice.name.includes('Google') || voice.name.includes('Alex'))
    );

    // 2. अगर US Male नहीं मिलता, तो *कोई भी* English India voice खोजें (en-IN)
    if (!selectedVoice) {
        selectedVoice = availableVoices.find(
            (voice) => voice.lang === 'en-IN'
        );
    }
    
    // 3. अगर English भी नहीं मिलती, तब ही Hindi पर वापस आएं
    if (!selectedVoice) {
        selectedVoice = availableVoices.find(
          (voice) => voice.lang === 'hi-IN'
        );
    }

    // 4. अगर कुछ भी नहीं मिलता, तो ब्राउज़र का डिफ़ॉल्ट English Voice चुनें
    if (!selectedVoice) {
        selectedVoice = availableVoices.find(
          (voice) => voice.default && voice.lang.startsWith('en')
        );
    }
    
    if (selectedVoice) {
        utterance.lang = selectedVoice.lang;
        utterance.voice = selectedVoice;
    } 

    try {
        synth.speak(utterance);
    } catch(e) {
        console.error("Error speaking:", e);
    }
  };
  
// 🌀 Typing animation effect
useEffect(() => {
  if (!response) return;

  let i = 0;
  setDisplayedResponse("");
  
  if (window.speechSynthesis && window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
  }

  const cleanedResponse = response.replace(/\*\*|__|\*/g, '').trim();
  
  const interval = setInterval(() => {
    if (i >= cleanedResponse.length) {
      clearInterval(interval);
      setDisplayedResponse(cleanedResponse); 
      
      speakResponse(cleanedResponse); 
      
      setResponse(""); 
      return;
    }
    setDisplayedResponse((prev) => prev + cleanedResponse.charAt(i));
    i++;
  }, 25); 

  return () => {
    clearInterval(interval);
  };
}, [response]);


// 💡 Auto-scroll effect
useEffect(() => {
    if (messagesEndRef.current) {
        messagesEndRef.current.scrollTop = messagesEndRef.current.scrollHeight;
    }
}, [conversationHistory, displayedResponse, loading, commandToExecute]); 


// 💡 Function to handle editing the last message
function handleEditLastMessage() {
  if (conversationHistory.length >= 2) {
    const lastUserMessage = conversationHistory[conversationHistory.length - 2];
    
    if (lastUserMessage.role === "user") {
      setInput(lastUserMessage.content);
      setConversationHistory(prev => prev.slice(0, prev.length - 2)); 
      setRawBackendHistory(prev => prev.slice(0, prev.length - 2)); 
      setCommandToExecute(null); 
      
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  }
}


// Helper: extractCommandIfWakeWord
function extractCommandIfWakeWord(raw) {
    if (!raw || !raw.trim()) return null;
    const s = raw.trim(); 
    const s_lower = s.toLowerCase(); 
    const negations = ["not", "don't", "dont", "never", "no"];
    
    const patterns = [
      "\\bhey jarvis\\b", 
      "\\bhello jarvis\\b", 
      "\\bwake up jarvis\\b",
      "\\bwake jarvis\\b", 
      "\\butho jarvis\\b", 
      "\\butho\\b.*\\bjarvis\\b",
      "\\bjarvis\\b", 
      "\\bsuno\\s*jarvis\\b" 
    ];
    
    const regex = new RegExp(patterns.join("|"), "i");
    const match = s_lower.match(regex);
    if (!match) return null;
    for (const neg of negations) {
      if (s_lower.includes(`${neg} jarvis`) || s_lower.includes(`${neg} hey jarvis`)) {
        return null;
      }
    }
    let cleaned = s.slice(0, match.index) + s.slice(match.index + match[0].length);
    const cleanupRegex = /^(,|:|\s)+|(,|:|\s)+$/g;
    cleaned = cleaned.replace(cleanupRegex, "").trim();
    return cleaned;
}
// End of helper function


// 💡 NEW FUNCTION: Handles Voice Input (Speech-to-Text)
const startListening = () => {

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
        // Safari/iOS के लिए स्पष्ट चेतावनी
        alert("Sir, Voice Input only works reliably on Chrome, Edge, and Android browsers. Safari/iOS does not fully support this feature.");
        return;
    }

      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
      }

    const recognition = new SpeechRecognition();
    recognition.continuous = false; 
    recognition.interimResults = false; 
    recognition.lang = 'en-IN'; 
    recognition.maxAlternatives = 1;

    setLoading(true); 

    recognition.onstart = () => {
        setDisplayedResponse("Listening...");
    };

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        console.log('Voice Input:', transcript);

        // वॉइस इनपुट अब ऑटो-सबमिट नहीं होगा, केवल फील्ड भरेगा
        setInput(transcript); 
    }; 

    recognition.onerror = (event) => {
      setLoading(false);
      setResponse("");
      if (event.error === 'not-allowed') {
          alert("Sir, please allow microphone access in your browser settings.");
      } else if (event.error === 'no-speech') {
           setDisplayedResponse("Didn't catch that, Sir. Please try again.");
           speakResponse("I didn't catch that, Sir. Please try again.");
      }
    }; 

    recognition.onend = () => {
        setLoading(false); 
        setResponse(""); 
        setDisplayedResponse(""); 
        
        if (inputRef.current) {
            inputRef.current.focus();
        }
    };

    try {
        recognition.start();
    } catch (e) {
        console.error("Error starting recognition:", e);
        setLoading(false);
        alert("Error starting voice input. Is the microphone in use by another app?");
    }
};


// 💡 Executes the command when the user clicks the action button
const executeCommand = () => {
    if (!commandToExecute) return;

    let url = commandToExecute;
    
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
    }

    window.open(url, "_blank");
    
    setCommandToExecute(null); 
    if (inputRef.current) inputRef.current.focus();
};


async function handleSubmit(e) {
  e.preventDefault();
  
  const isFakeEvent = !e.target; 
  
  if (!input.trim()) {
      if (!isFakeEvent) {
          setLoading(false); 
          return;
      }
  }

  // 🚨 TTS FIX 3: handleSubmit (यूज़र इंटरैक्शन) पर तुरंत TTS बंद करें 
  //   यह मोबाइल Chrome रीफ़्रेश बग को दूर करने का सबसे अच्छा तरीका है।
  if (window.speechSynthesis && window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
  }
  
  setCommandToExecute(null); 

  const currentInput = input.trim();
  let command = currentInput 

  if(conversationHistory.length === 0){
    command = extractCommandIfWakeWord(currentInput);
    if (command === null) {
      setUserMessage(currentInput); 
      setInput("");
      const wakeUpMsg = `⚠️ Sir, please shuruat '${AI_NAME}' se kijiye taki mujhe pata chale ki aap mujhse baat kar rahe hain.`;
      setResponse(wakeUpMsg);
      
      setTimeout(() => setUserMessage(""), 1500); 
      return;
    }
  }
  
  // 1. Prepare UI states
  setUserMessage(currentInput); 
  setInput("");
  setLoading(true);
  setResponse("");
  setDisplayedResponse(""); 

  let finalUserFriendlyResponse = "Error talking to AI 😢";
  let rawModelReply = "Error talking to AI 😢"; 
  let uiModelContent = null; 


  try {
    const historyToSend = [...rawBackendHistory, { role: "user", content : command }]; 

    const res = await fetch("/api/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ history: historyToSend }),
    });

    const data = await res.json();
    const modelReply = data.reply || "No response from AI 🤖";
    
    rawModelReply = modelReply; 
    finalUserFriendlyResponse = modelReply;
    uiModelContent = modelReply; 
    
    // --- COMMAND HANDLING ---
    
    if (modelReply.startsWith("__OPEN_YOUTUBE__")) {
        finalUserFriendlyResponse = "Ji Sir, main YouTube khol raha hoon. Niche diye gaye button par click kijiye, Sir.";
        setCommandToExecute("https://www.youtube.com");
        uiModelContent = finalUserFriendlyResponse;
        
    } else if (modelReply.startsWith("__OPEN_GOOGLE__")) {
        finalUserFriendlyResponse = "Google Search open ho raha hai, Sir. Niche diye gaye button par click kijiye, Sir.";
        setCommandToExecute("https://www.google.com");
        uiModelContent = finalUserFriendlyResponse;

    } else if (modelReply.startsWith("__OPEN_GMAIL__")) {
        finalUserFriendlyResponse = "Gmail khol raha hoon, Sir. Niche diye gaye button par click kijiye, Sir.";
        setCommandToExecute("https://mail.google.com");
        uiModelContent = finalUserFriendlyResponse;

    }else if (modelReply.startsWith("__SEARCH_YOUTUBE__")) {
        const query = modelReply.replace("__SEARCH_YOUTUBE__:", "").trim();
        finalUserFriendlyResponse = `Aapki request par, main YouTube par "${query}" search kar raha hoon, Sir. Niche diye gaye button par click kijiye.`;
        setCommandToExecute(`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`);
        uiModelContent = finalUserFriendlyResponse;

    }else if (modelReply.startsWith("__OPEN_URL__:")) {
        let url = modelReply.replace("__OPEN_URL__:", "").trim();
        
        let displayUrl = url;
        try {
          displayUrl = new URL(url.startsWith('http') ? url : 'https://' + url).hostname.replace('www.', ''); 
        } catch (e) { }

        finalUserFriendlyResponse = `Ji Sir, main aapke liye ${displayUrl} khol raha hoon. Kripya niche diye gaye button par click kijiye.`;
        setCommandToExecute(url);
        uiModelContent = finalUserFriendlyResponse;
    }
     else {
      finalUserFriendlyResponse = modelReply;
      setCommandToExecute(null); 
    }

  } catch (err) {
    console.error(err);
    finalUserFriendlyResponse = "Error talking to AI 😢";
    rawModelReply = "Error talking to AI 😢";
    uiModelContent = "Error talking to AI 😢"; 
    setCommandToExecute(null); 
  } 
  
  // 2. Update Backend History (Use RAW reply)
  const rawUserMessage = { role: "user", content : command }; 
  const rawModelMessage = { role: "model", content: rawModelReply}; 
  setRawBackendHistory(prev => [...prev, rawUserMessage, rawModelMessage]);

  // 3. Update UI History (Use FRIENDLY reply)
  const uiUserMessage = { role: "user", content : currentInput };
  const uiModelMessage = { role: "model", content: uiModelContent}; 
  setConversationHistory(prev => [...prev, uiUserMessage, uiModelMessage]);
  
  // 4. Start the typing animation 
  setResponse(finalUserFriendlyResponse);
  
  // 5. Cleanup
  setLoading(false);
  setUserMessage("");
}

function handleEnter(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    handleSubmit(e);
  }
}

return (
  <main className="min-h-screen bg-black text-white flex flex-col items-center p-6 pt-16">
    <h1 className="text-4xl font-extrabold mb-8 text-cyan-400 drop-shadow-lg tracking-wider">{AI_NAME}</h1>
    <p className="text-gray-500 mb-6 text-sm">Artificial Intelligence Protocol</p>

    {/* 🖼️ AI Visualizer (Smooth Transition) */}
    <div
        className={`
          transition-all duration-500 ease-in-out overflow-hidden w-full max-w-lg mx-auto 
          ${isSpeaking ? 'h-35 opacity-100 mb-6' : 'h-0 opacity-0 mb-0'}
        `}
    >
      <Visualizer isSpeaking={isSpeaking} />
    </div>

    {/* 🧍 User + AI conversation box */}
    {(conversationHistory.length > 0 || userMessage) && ( 
      <div 
        ref={messagesEndRef} 
        className="w-full max-w-lg bg-gray-900/80 backdrop-blur-sm p-5 rounded-xl shadow-2xl border border-blue-900/50 h-80 overflow-y-auto flex flex-col space-y-4"
      >
          
          {/* 1. RENDER FULL CONVERSATION HISTORY */}
          {conversationHistory.map((message, index) => (
              <div 
                  key={index} 
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                  <div className={`max-w-xs p-3 rounded-xl ${message.role === "user" ? "bg-blue-600/90 text-white rounded-br-none" : "bg-gray-700/80 text-gray-200 rounded-tl-none"} flex flex-col`}>
                      <p className="whitespace-pre-wrap">
                          {message.role !== "user" && <span className="font-bold text-cyan-400">{AI_NAME}:</span>}
                          {message.content}
                      </p>
                      
                      {/* 💡 EDIT BUTTON: Only visible on the last user message */}
                      {message.role === "user" && index === conversationHistory.length - 2 && !loading && !isSpeaking && (
                          <button
                              onClick={handleEditLastMessage}
                              className="mt-1 self-end text-xs text-gray-200 hover:text-cyan-300 transition-colors opacity-80"
                              title="Edit previous message"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline-block mr-1"><path d="M12 20h9"/><path d="M16.5 3.5l4 4"/><path d="M18 6L14 10"/><path d="M3 15v3a2 2 0 0 0 2 2h3.5L18 8.5 15.5 6 3 18.5Z"/></svg>
                            Edit
                          </button>
                      )}
                  </div>
              </div>
          ))}

          {/* 2. RENDER THE CURRENT TYPING/LOADING RESPONSE (AFTER history) */}
          {(loading || isSpeaking) && (
              <div className="flex justify-start">
                  <div className="max-w-xs p-3 rounded-xl bg-gray-700/80 text-gray-200 rounded-tl-none">
                      <p className="whitespace-pre-wrap">
                        <span className="font-bold text-cyan-400">{AI_NAME}:</span> 
                        {loading && !response ? " Thinking..." : ` ${displayedResponse}`}
                      </p>
                  </div>
              </div>
          )}
      </div>
    )}

    {/* 🚨 Action Button for Pop-up Blocker Avoidance */}
{commandToExecute && (
    <div className="w-full max-w-lg mt-4 p-4 bg-yellow-900/40 border border-yellow-500/50 rounded-xl shadow-lg text-center">
        <p className="text-sm text-yellow-200 mb-3">
            ⚠️ Security: Browser ki rok-tok se bachne ke liye, kripya website kholne ke liye niche click karein.
        </p>
        <button
            onClick={executeCommand}
            className="w-full p-3 bg-yellow-500 rounded-xl hover:bg-yellow-600 transition-colors duration-200 font-semibold tracking-wide text-gray-900"
        >
            👉 Open Website Now 🌐
        </button>
    </div>
)}

    {/* 🖊️ Input form (VIO Ready) */}
<form onSubmit={handleSubmit} className="w-full max-w-lg space-y-4 mt-8">
  <div className="flex space-x-2 items-center"> 
      {/* 1. TEXTAREA CONTAINER: */}
      <div className="flex-grow relative"> 
          <textarea
              ref={inputRef} 
              className="w-full p-3 pr-[100px] rounded-xl bg-gray-800 text-white outline-none border border-blue-700 focus:border-cyan-500 max-h-[100px] overflow-auto min-h-[50px] resize-none text-base"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={conversationHistory.length === 0 ? `Start with '${AI_NAME}...' or ask something.` : "Continue the conversation..."}
              onKeyDown={handleEnter}
              style={{ paddingRight: '90px' }} // बटन के लिए जगह
          />
          
          {/* 💡 SEND BUTTON (INPUT BOX के अंदर RIGHT SIDE में - Center Fix) */}
          <button
              type="submit"
              disabled={loading || !input.trim()}
              className="absolute right-2 inset-y-0 my-auto w-8 h-8 flex items-center justify-center bg-blue-600 rounded-md hover:bg-blue-700 transition-colors duration-200 disabled:opacity-30 shadow-md text-white"
              title="Send"
          >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transform rotate-45 -translate-y-[1px] translate-x-[1px]"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          </button>
      </div>

      {/* 🎙️ Microphone Button */}
      <button
          type="button" 
          onClick={startListening}
          disabled={loading}
          className="w-12 h-12 flex items-center justify-center bg-cyan-600 rounded-full hover:bg-cyan-700 transition-all duration-200 shadow-lg text-white disabled:opacity-50 flex-shrink-0"
          title="Voice Input"
      >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>
      </button>
  </div>
</form>
  </main>
);
}
