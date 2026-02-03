export const config = {
  runtime: 'edge',
};

// Endpoints
const PROVIDERS = {
  OPENAI: 'https://api.openai.com/v1/chat/completions',
  GROQ: 'https://api.groq.com/openai/v1/chat/completions',
  OPENROUTER: 'https://openrouter.ai/api/v1/chat/completions',
  DEEPSEEK: 'https://api.deepseek.com/chat/completions',
  MISTRAL: 'https://api.mistral.ai/v1/chat/completions',
  TOGETHER: 'https://api.together.xyz/v1/chat/completions',
  FIREWORKS: 'https://api.fireworks.ai/inference/v1/chat/completions',
  PERPLEXITY: 'https://api.perplexity.ai/chat/completions',
  ANTHROPIC: 'https://api.anthropic.com/v1/messages',
  LOCAL: 'http://localhost:11434/v1/chat/completions',
  // HuggingFace is dynamic
  // COHERE is 'https://api.cohere.com/v1/chat' (requires different payload)
};

export default async function handler(req: Request) {
  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: "Method not allowed" }), { 
        status: 405,
        headers: { "Content-Type": "application/json" }
      });
    }

    let body;
    try {
        body = await req.json();
    } catch (e) {
        return new Response(JSON.stringify({ error: "Invalid JSON body" }), { status: 400 });
    }

    const { messages, model, provider, apiKey, temperature, max_tokens, stream } = body;

    // Default to Groq if not specified
    const targetProvider = (provider || 'GROQ').toUpperCase();
    
    // API KEY RESOLUTION
    let finalApiKey = apiKey;

    if (!finalApiKey) {
        // Fallback to Server ENV
        if (targetProvider === 'GROQ') {
            const keysRaw = process.env.GROQ_API_KEYS;
            if (keysRaw) {
                const keys = keysRaw.split(",").map(k => k.trim()).filter(Boolean);
                if (keys.length > 0) finalApiKey = keys[Math.floor(Math.random() * keys.length)];
            }
        } else {
             // Generic Env lookup: OPENAI_API_KEY, ANTHROPIC_API_KEY, etc.
             finalApiKey = process.env[`${targetProvider}_API_KEY`];
        }
    }

    // Local can work without key
    if (!finalApiKey && targetProvider !== 'LOCAL' && targetProvider !== 'LOCAL (OLLAMA)') {
        return new Response(JSON.stringify({ error: `Server Configuration Error: No valid keys found for ${targetProvider}.` }), { 
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }

    // PROVIDER SPECIFIC LOGIC
    let endpoint = PROVIDERS.GROQ;
    let payload: any = {
      model: model || "llama3-8b-8192",
      messages,
      temperature: temperature || 0.7,
      max_tokens: max_tokens || 4096,
      stream: !!stream
    };
    
    // FETCH HEADERS
    const headers: any = {
        "Content-Type": "application/json"
    };

    if (targetProvider === 'OPENAI') endpoint = PROVIDERS.OPENAI;
    else if (targetProvider === 'DEEPSEEK') endpoint = PROVIDERS.DEEPSEEK;
    else if (targetProvider === 'MISTRAL') endpoint = PROVIDERS.MISTRAL;
    else if (targetProvider === 'TOGETHER') endpoint = PROVIDERS.TOGETHER;
    else if (targetProvider === 'FIREWORKS') endpoint = PROVIDERS.FIREWORKS;
    else if (targetProvider === 'PERPLEXITY') endpoint = PROVIDERS.PERPLEXITY;
    else if (targetProvider === 'LOCAL') endpoint = PROVIDERS.LOCAL;
    else if (targetProvider === 'HUGGINGFACE') {
        endpoint = `https://api-inference.huggingface.co/models/${model}/v1/chat/completions`;
    }
    else if (targetProvider === 'OPENROUTER') {
        endpoint = PROVIDERS.OPENROUTER;
        headers["HTTP-Referer"] = "https://your-site.com"; 
        headers["X-Title"] = "App";
    }
    else if (targetProvider === 'ANTHROPIC') {
        endpoint = PROVIDERS.ANTHROPIC;
        headers["x-api-key"] = finalApiKey;
        headers["anthropic-version"] = "2023-06-01";
        delete headers["Authorization"]; // Anthropic uses x-api-key

        // Transform payload for Anthropic
        let systemPrompt = undefined;
        const cleanMessages = messages.filter((m: any) => {
            if (m.role === 'system') {
                systemPrompt = m.content;
                return false;
            }
            return true;
        });

        payload = {
            model: model || "claude-3-opus-20240229",
            messages: cleanMessages,
            max_tokens: max_tokens || 1024,
            temperature: temperature || 0.7,
            stream: !!stream,
        };
        if (systemPrompt) payload.system = systemPrompt;
    }
    else if (targetProvider === 'GEMINI') {
         endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model || 'gemini-1.5-flash'}:generateContent?key=${finalApiKey}`;
         delete headers["Authorization"];
         
         const contents = messages.map((m: any) => ({
            role: m.role === 'user' ? 'user' : 'model',
            parts: [{ text: m.content }]
        })).filter((c: any) => c.role !== 'system');
        
        // Extract system prompt if any
        const systemMsg = messages.find((m: any) => m.role === 'system');
        
        payload = {
            contents,
            generationConfig: {
                temperature: temperature || 0.7,
                maxOutputTokens: max_tokens || 4096
            }
        };
        if (systemMsg) payload.systemInstruction = { parts: [{ text: systemMsg.content }] };
    }

    // Set Authorization header for standard providers
    if (targetProvider !== 'GEMINI' && targetProvider !== 'ANTHROPIC' && finalApiKey) {
        headers["Authorization"] = `Bearer ${finalApiKey}`;
    }

    // EXECUTE FETCH
    const response = await fetch(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const errorText = await response.text();
        return new Response(JSON.stringify({ error: `${targetProvider} API Error`, detail: errorText }), { 
            status: response.status,
            headers: { "Content-Type": "application/json" }
        });
    }

    if (stream) {
        // Simple stream pass-through (might need adaptation for Anthropic/Gemini but starting simple)
        return new Response(response.body, {
            status: 200,
            headers: {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache",
                "Connection": "keep-alive"
            }
        });
    }

    const data = await response.json();

    // NORMALIZE RESPONSES
    if (targetProvider === 'GEMINI') {
        const content = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
        return new Response(JSON.stringify({
            choices: [{ message: { role: "assistant", content } }]
        }), { status: 200, headers: { "Content-Type": "application/json" } });
    }
    
    if (targetProvider === 'ANTHROPIC') {
        const content = data.content?.[0]?.text || "";
         return new Response(JSON.stringify({
            choices: [{ message: { role: "assistant", content } }]
        }), { status: 200, headers: { "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: "AI Gateway Internal Error", detail: err.message }), { 
        status: 500,
        headers: { "Content-Type": "application/json" }
    });
  }
}
