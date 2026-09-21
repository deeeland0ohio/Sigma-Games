import { Router, Request, Response } from "express";

const aiRouter = Router();

function resolveCredential(): string {
  return (process.env.EMIS_API_KEY || "").trim();
}

const DEFAULT_EMIS_KEY = resolveCredential();
const EMIS_BASE_URL = "https://emis.zxs-is-very.cool/v1";
const GROQ_BASE_URL = "https://api.groq.com/openai/v1";

function resolveGroqKey(req: Request): string {
  if (process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.trim()) {
    return process.env.GROQ_API_KEY.trim();
  }
  const headerKey = (req.headers["x-groq-api-key"] as string);
  if (headerKey && headerKey.trim()) {
    return headerKey.trim();
  }
  return "";
}

interface ModelInfo {
  id: string;
  label?: string;
  owned_by?: string;
  description?: string;
  premium?: boolean;
  tools?: boolean;
  vision?: boolean;
  image?: boolean;
  audio?: boolean;
  video?: boolean;
}

// In-memory cache for models
let cachedEmisModels: ModelInfo[] | null = null;
let lastEmisCacheTime = 0;
let emisExhausted = false;
let emisExhaustedReason = "";

let cachedGroqModels: ModelInfo[] | null = null;
let lastGroqCacheTime = 0;

const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

// Groq Verified Chat Models Catalog
export const GROQ_FALLBACK_MODELS: ModelInfo[] = [
  { id: "groq/compound", label: "Groq Compound (Recommended)", owned_by: "groq", description: "Groq high-intelligence compound reasoning system. Ultra-fast and highly capable." },
  { id: "openai/gpt-oss-120b", label: "GPT OSS 120B", owned_by: "openai", description: "Flagship 120B open weights model with chain-of-thought reasoning accelerated on Groq LPUs." },
  { id: "openai/gpt-oss-20b", label: "GPT OSS 20B", owned_by: "openai", description: "Fast, efficient 20B reasoning model with high throughput on Groq." },
  { id: "groq/compound-mini", label: "Groq Compound Mini", owned_by: "groq", description: "Lightweight compound AI model for snappy, instant responses." },
  { id: "qwen/qwen3.8-27b", label: "Qwen 3.8 27B", owned_by: "qwen", description: "Multimodal and multilingual open model with strong analytical reasoning." },
  { id: "allam-2-7b", label: "ALLaM 2 7B", owned_by: "sdaia", description: "Bilingual Arabic and English language model." }
];

// Fallback list of popular Emis models
const DEFAULT_EMIS_MODELS: ModelInfo[] = [
  { id: "claude-fable-5-1", label: "Claude Fable 5.1 (Recommended)", owned_by: "anthropic", description: "Fast, creative writing and high-intelligence assistance." },
  { id: "claude-sonnet-5", label: "Claude Sonnet 5", owned_by: "anthropic", description: "Smart, nuanced, and excellent at coding." },
  { id: "claude-opus-5", label: "Claude Opus 5", owned_by: "anthropic", description: "High-capability reasoning and depth." },
  { id: "glm-5.3", label: "GLM-5.3", owned_by: "zhipu", description: "Flagship balanced powerhouse model." },
  { id: "gpt-5.6-sol", label: "GPT-5.6 Sol", owned_by: "openai", description: "Next-gen GPT model with sharp logic." },
  { id: "gpt-6-astra", label: "GPT-6 Astra", owned_by: "openai", description: "Ultra-fast intelligent responses." },
  { id: "gpt-5.6-terra", label: "GPT-5.6 Terra", owned_by: "openai", description: "Robust general-purpose assistant." },
  { id: "gemini-2.5-flash", label: "Gemini 2.5 Flash", owned_by: "google", description: "Lightning-fast responses." },
  { id: "gemini-2.5-pro", label: "Gemini 2.5 Pro", owned_by: "google", description: "Complex problem solving and coding." },
  { id: "gemini-3.8-flash", label: "Gemini 3.8 Flash", owned_by: "google", description: "State-of-the-art fast multimodal logic." },
  { id: "deepseek-v4-flash", label: "DeepSeek V4 Flash", owned_by: "deepseek", description: "Efficient and smart reasoning." },
  { id: "deepseek-v4-pro-0813", label: "DeepSeek V4 Pro", owned_by: "deepseek", description: "Deep thinking and detailed code." },
  { id: "grok-4.3", label: "Grok 4.3", owned_by: "xai", description: "Witty, straightforward, and capable." },
  { id: "qwen3.8-max", label: "Qwen 3.8 Max", owned_by: "qwen", description: "Heavyweight multilingual reasoning." },
  { id: "qwen3-coder-plus", label: "Qwen 3 Coder Plus", owned_by: "qwen", description: "Specialized in software engineering." },
  { id: "minimax-m3", label: "MiniMax M3", owned_by: "minimax", description: "Rich context conversational model." }
];

// Helper to filter out non-chat models (e.g. classification, guardrails, speech, transcription)
function isGroqChatModel(m: any): boolean {
  if (m.active === false) return false;
  const id = (m.id || "").toLowerCase();
  // Filter out classification, moderation and guard models (prevents "text classification models do not support streaming")
  if (id.includes("prompt-guard") || id.includes("safeguard") || id.includes("guard")) return false;
  // Filter out audio and speech models
  if (id.includes("whisper") || id.includes("orpheus") || id.includes("canopylabs")) return false;
  if (m.output_modalities && !m.output_modalities.includes("text")) return false;
  if (m.output_modalities && (m.output_modalities.includes("speech") || m.output_modalities.includes("transcription"))) return false;
  return true;
}

// Helper to fetch Groq models
async function getGroqModels(groqKey: string): Promise<ModelInfo[]> {
  const now = Date.now();
  if (cachedGroqModels && (now - lastGroqCacheTime < CACHE_TTL_MS)) {
    return cachedGroqModels;
  }

  if (groqKey) {
    try {
      const groqRes = await fetch(`${GROQ_BASE_URL}/models`, {
        headers: {
          Authorization: `Bearer ${groqKey}`
        }
      });
      if (groqRes.ok) {
        const data: any = await groqRes.json();
        if (Array.isArray(data.data) && data.data.length > 0) {
          const chatModels = data.data.filter(isGroqChatModel);
          if (chatModels.length > 0) {
            cachedGroqModels = chatModels.map((m: any) => {
              const matchingFallback = GROQ_FALLBACK_MODELS.find(f => f.id === m.id);
              return {
                id: m.id,
                label: matchingFallback?.label || m.name || m.id.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
                owned_by: m.owned_by || "groq",
                description: matchingFallback?.description || `Groq LPU accelerated ${m.name || m.id}`
              };
            });

            // Prioritize recommended model
            cachedGroqModels.sort((a, b) => {
              if (a.id === "groq/compound") return -1;
              if (b.id === "groq/compound") return 1;
              if (a.id === "openai/gpt-oss-120b") return -1;
              if (b.id === "openai/gpt-oss-120b") return 1;
              return a.label.localeCompare(b.label);
            });

            lastGroqCacheTime = now;
            return cachedGroqModels;
          }
        }
      }
    } catch (err: any) {
      console.error("Failed to fetch models from Groq API:", err?.message || err);
    }
  }

  return GROQ_FALLBACK_MODELS;
}

// Helper to fetch Emis models
async function getEmisModels(userKey: string): Promise<ModelInfo[]> {
  const now = Date.now();
  if (cachedEmisModels && (now - lastEmisCacheTime < CACHE_TTL_MS) && userKey === DEFAULT_EMIS_KEY) {
    return cachedEmisModels;
  }

  try {
    const upstreamRes = await fetch(`${EMIS_BASE_URL}/models`, {
      headers: {
        Authorization: `Bearer ${userKey}`,
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
      }
    });

    if (upstreamRes.ok) {
      const data: any = await upstreamRes.json();
      if (Array.isArray(data.data) && data.data.length > 0) {
        emisExhausted = false;
        emisExhaustedReason = "";

        cachedEmisModels = data.data.map((m: any) => ({
          id: m.id,
          label: m.label || m.id,
          owned_by: m.owned_by || "ai",
          description: m.description,
          premium: m.premium,
          tools: m.tools,
          vision: m.vision,
          image: m.image,
          audio: m.audio,
          video: m.video
        }));

        cachedEmisModels.sort((a, b) => {
          if (a.id === "claude-fable-5-1") return -1;
          if (b.id === "claude-fable-5-1") return 1;
          if (a.id === "claude-sonnet-5") return -1;
          if (b.id === "claude-sonnet-5") return 1;
          return (a.label || a.id).localeCompare(b.label || b.id);
        });

        lastEmisCacheTime = now;
        return cachedEmisModels;
      }
    } else {
      const errorText = await upstreamRes.text();
      emisExhausted = true;
      emisExhaustedReason = `Emis API reached usage limit or requires verification (HTTP ${upstreamRes.status})`;
      console.warn("Emis API returned error:", upstreamRes.status, errorText.slice(0, 120));
    }
  } catch (err: any) {
    emisExhausted = true;
    emisExhaustedReason = err?.message || "Failed to reach Emis API";
    console.error("Failed to fetch models from Emis API:", err?.message || err);
  }

  return cachedEmisModels || DEFAULT_EMIS_MODELS;
}

// GET /api/ai/models - fetch available models by provider
aiRouter.get("/ai/models", async (req: Request, res: Response) => {
  const provider = ((req.query.provider as string) || "all").toLowerCase();
  const userEmisKey = (req.headers["x-api-key"] as string) || DEFAULT_EMIS_KEY;
  const groqKey = resolveGroqKey(req);

  if (provider === "groq") {
    const models = await getGroqModels(groqKey);
    return res.json({
      provider: "groq",
      hasKey: Boolean(groqKey),
      models
    });
  }

  if (provider === "emis") {
    const models = await getEmisModels(userEmisKey);
    return res.json({
      provider: "emis",
      hasKey: true,
      emisExhausted,
      emisExhaustedReason,
      models
    });
  }

  // Return full overview
  const [groqModels, emisModels] = await Promise.all([
    getGroqModels(groqKey),
    getEmisModels(userEmisKey)
  ]);

  return res.json({
    hasGroqKey: Boolean(groqKey),
    hasEmisKey: true,
    emisExhausted,
    emisExhaustedReason,
    groq: groqModels,
    emis: emisModels,
    models: groqModels
  });
});

// POST /api/ai/chat - proxy chat completions for Groq or Emis
aiRouter.post("/ai/chat", async (req: Request, res: Response) => {
  const requestedProvider = ((req.body.provider as string) || "").toLowerCase();
  const { model, messages, stream = true, temperature, max_tokens, systemPrompt } = req.body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "Missing or invalid 'messages' array." });
  }

  // Identify whether request should go to Groq or Emis
  const isGroqModel = GROQ_FALLBACK_MODELS.some(m => m.id === model) || 
    (model && (
      model.startsWith("groq/") || 
      model.startsWith("openai/gpt-oss") || 
      model.startsWith("qwen/") || 
      model.startsWith("allam-") || 
      model.startsWith("llama-") || 
      model.startsWith("deepseek-r1-distill") || 
      model.startsWith("gemma2-") || 
      model.startsWith("mixtral-")
    ));

  const provider = requestedProvider === "groq" || (requestedProvider !== "emis" && isGroqModel) ? "groq" : "emis";

  const formattedMessages = [...messages];
  if (systemPrompt && (!formattedMessages[0] || formattedMessages[0].role !== "system")) {
    formattedMessages.unshift({
      role: "system",
      content: systemPrompt
    });
  }

  if (provider === "groq") {
    const groqKey = resolveGroqKey(req);
    if (!groqKey) {
      return res.status(400).json({
        error: "Groq API key is missing. Please configure GROQ_API_KEY in the application settings (get a free key at https://console.groq.com/keys), or switch to Emis AI in the model options."
      });
    }

    const availableGroqModels = await getGroqModels(groqKey);
    const validModelIds = new Set(availableGroqModels.map(m => m.id));

    // If requested model is invalid, non-existent for this key, or a classification model, sanitize to top valid model
    let requestedModel = model;
    if (!requestedModel || !validModelIds.has(requestedModel)) {
      requestedModel = availableGroqModels[0]?.id || "groq/compound";
    }

    // Prioritized fallback models in case the chosen model is out of credits / rate limits (RPD/TPD/TPM)
    const priorityFallbackOrder = [
      "groq/compound",
      "openai/gpt-oss-120b",
      "groq/compound-mini",
      "openai/gpt-oss-20b",
      "qwen-3.8-27b",
      "allam-2-7b"
    ];

    // Build the ordered candidates: start with requested model, then remaining priority models, then any other valid models
    const candidateModels: string[] = [
      requestedModel,
      ...priorityFallbackOrder.filter(id => id !== requestedModel && validModelIds.has(id)),
      ...availableGroqModels.map(m => m.id).filter(id => id !== requestedModel && !priorityFallbackOrder.includes(id))
    ];

    try {
      let upstreamRes: any = null;
      let successfulModel = requestedModel;
      let wasFallbackSwitched = false;
      let fallbackReason = "";
      let lastErrorMessage = "";

      // Try candidates sequentially until one with available quota/credits succeeds
      for (const candidate of candidateModels) {
        try {
          const fetchRes = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${groqKey}`
            },
            body: JSON.stringify({
              model: candidate,
              messages: formattedMessages,
              stream: !!stream,
              ...(temperature !== undefined ? { temperature: Number(temperature) } : {}),
              ...(max_tokens !== undefined ? { max_tokens: Number(max_tokens) } : {})
            })
          });

          if (fetchRes.ok) {
            upstreamRes = fetchRes;
            successfulModel = candidate;
            if (candidate !== requestedModel) {
              wasFallbackSwitched = true;
            }
            break;
          }

          const errorText = await fetchRes.text();
          let errorJson: any = null;
          try {
            errorJson = JSON.parse(errorText);
          } catch (e) {}

          const errMsg = errorJson?.error?.message || errorJson?.message || `HTTP ${fetchRes.status}: ${fetchRes.statusText}`;
          lastErrorMessage = errMsg;

          const isQuotaOrLimitError =
            fetchRes.status === 429 ||
            fetchRes.status === 402 ||
            fetchRes.status === 404 ||
            fetchRes.status === 503 ||
            errMsg.toLowerCase().includes("rate limit") ||
            errMsg.toLowerCase().includes("quota") ||
            errMsg.toLowerCase().includes("tpd") ||
            errMsg.toLowerCase().includes("rpd") ||
            errMsg.toLowerCase().includes("tpm") ||
            errMsg.toLowerCase().includes("rpm") ||
            errMsg.toLowerCase().includes("tokens per") ||
            errMsg.toLowerCase().includes("requests per") ||
            errMsg.toLowerCase().includes("capacity") ||
            errMsg.toLowerCase().includes("overloaded") ||
            errMsg.toLowerCase().includes("too many requests") ||
            errMsg.toLowerCase().includes("does not exist") ||
            errMsg.toLowerCase().includes("do not have access") ||
            errMsg.toLowerCase().includes("classification");

          if (isQuotaOrLimitError) {
            console.warn(`Groq model ${candidate} exhausted or unavailable (${errMsg}). Trying next model with available credit/quota...`);
            fallbackReason = errMsg;
            continue;
          } else {
            // Client error (e.g. malformed body), don't loop endlessly
            return res.status(fetchRes.status).json({
              error: errMsg
            });
          }
        } catch (callErr: any) {
          lastErrorMessage = callErr?.message || "Network error reaching Groq API";
          continue;
        }
      }

      if (!upstreamRes) {
        return res.status(429).json({
          error: `All available AI models have temporarily reached their rate or quota limits (${lastErrorMessage}). Please try again later.`,
          allExhausted: true
        });
      }

      // Expose headers so browser can detect if model was switched to preserve credits/conversation
      res.setHeader("Access-Control-Expose-Headers", "x-switched-model, x-original-model, x-fallback-reason");
      if (wasFallbackSwitched) {
        res.setHeader("x-switched-model", successfulModel);
        res.setHeader("x-original-model", requestedModel);
        res.setHeader("x-fallback-reason", fallbackReason);
      }

      if (stream && upstreamRes.body) {
        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache, no-transform");
        res.setHeader("Connection", "keep-alive");
        res.setHeader("X-Accel-Buffering", "no");

        const reader = upstreamRes.body.getReader();
        const decoder = new TextDecoder();

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            res.write(chunk);
          }
        } catch (streamErr) {
          console.error("Groq stream reading error:", streamErr);
        } finally {
          res.end();
        }
      } else {
        const data = await upstreamRes.json();
        if (wasFallbackSwitched) {
          data.switchedModel = successfulModel;
          data.originalModel = requestedModel;
          data.fallbackReason = fallbackReason;
        }
        return res.json(data);
      }
    } catch (err: any) {
      console.error("Groq chat completion error:", err);
      return res.status(500).json({ error: err?.message || "Internal error communicating with Groq API." });
    }
  } else {
    // Emis Provider
    const userEmisKey = (req.headers["x-api-key"] as string) || DEFAULT_EMIS_KEY;
    const selectedModel = (!model || model === "glm-5.3") ? "claude-fable-5-1" : model;

    try {
      const upstreamRes = await fetch(`${EMIS_BASE_URL}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userEmisKey}`,
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: formattedMessages,
          stream: !!stream,
          ...(temperature !== undefined ? { temperature: Number(temperature) } : {}),
          ...(max_tokens !== undefined ? { max_tokens: Number(max_tokens) } : {})
        })
      });

      if (!upstreamRes.ok) {
        const errorText = await upstreamRes.text();
        let errorJson: any = null;
        try {
          errorJson = JSON.parse(errorText);
        } catch (e) {}

        const errMsg = errorJson?.error?.message || errorJson?.message || `Emis API returned HTTP ${upstreamRes.status} (${upstreamRes.statusText})`;
        
        emisExhausted = true;
        emisExhaustedReason = errMsg;

        return res.status(upstreamRes.status).json({
          error: errMsg,
          emisExhausted: true
        });
      }

      if (stream && upstreamRes.body) {
        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache, no-transform");
        res.setHeader("Connection", "keep-alive");
        res.setHeader("X-Accel-Buffering", "no");

        const reader = upstreamRes.body.getReader();
        const decoder = new TextDecoder();

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            res.write(chunk);
          }
        } catch (streamErr) {
          console.error("Emis stream reading error:", streamErr);
        } finally {
          res.end();
        }
      } else {
        const data = await upstreamRes.json();
        return res.json(data);
      }
    } catch (err: any) {
      console.error("Emis chat completion error:", err);
      emisExhausted = true;
      emisExhaustedReason = err?.message || "Internal server error connecting to AI API.";
      return res.status(500).json({ 
        error: err?.message || "Internal server error connecting to AI API.",
        emisExhausted: true
      });
    }
  }
});

export default aiRouter;

