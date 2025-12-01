
import { GoogleGenAI, Type, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { StoryData, StorySegment } from "../types";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing. Please ensure process.env.API_KEY is available.");
  }
  return new GoogleGenAI({ apiKey });
};

// Helper for retry logic with exponential backoff
async function retryWithBackoff<T>(fn: () => Promise<T>, retries = 5, initialDelay = 3000): Promise<T> {
  let attempt = 0;
  while (attempt <= retries) {
    try {
      return await fn();
    } catch (error: any) {
      attempt++;
      
      const msg = error.message || JSON.stringify(error);
      const isRetryable = 
        msg.includes('429') || 
        msg.includes('quota') ||
        msg.includes('RESOURCE_EXHAUSTED') ||
        msg.includes('500') ||
        msg.includes('503') ||
        msg.includes('Rpc failed') ||
        msg.includes('Failed to generate story text') ||
        msg.includes('candidate') || 
        msg.includes('finishReason') ||
        msg.includes('Unexpected token') || // JSON parse errors
        error.status === 429 || 
        error.status === 503 ||
        error.code === 429 ||
        error.code === 500;

      if (isRetryable && attempt <= retries) {
        // Increase delay significantly for 429s
        const jitter = Math.random() * 1000;
        const delay = (initialDelay * Math.pow(2, attempt - 1)) + jitter;
        console.warn(`Retryable error hit (${attempt}/${retries}): ${msg}. Retrying in ${Math.round(delay)}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
  throw new Error("Max retries exceeded");
}

export const generateStorySegments = async (
  rawStory: string,
  writingStyle: string,
  artStyle: string
): Promise<StoryData> => {
  const ai = getClient();
  
  const basePrompt = `
    You are an expert storyteller and visual director.
    
    TASK:
    1. Rewrite the following raw story to be "${writingStyle}". Make it engaging, coherent, and suitable for a short video format.
    2. FIRST, Identify the main character(s) and define a consistent, detailed visual description for them including clothing, hair color, facial features, and accessories (e.g., "A young cyber-hacker with neon green hair...").
    3. Split the rewritten story into 5 to 8 distinct visual scenes.
    4. For each scene, provide the "narration" text (the story part) and a "visualPrompt" for an image generator.
    
    CRITICAL CONSISTENCY RULE:
    You MUST include the FULL visual description of the main character defined in step 2 in EVERY single "visualPrompt". Do not assume the image generator knows who "the character" is.

    ART STYLE:
    The "visualPrompt" should describe the scene in the style of "${artStyle}".

    TIMING:
    Keep "narration" concise enough to be read in about 5-8 seconds per scene.

    RAW STORY:
    ${rawStory}
  `;

  return retryWithBackoff(async () => {
    // STRATEGY 1: Try with Strict Schema first
    try {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: { parts: [{ text: basePrompt }] },
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING, description: "A catchy title for the story" },
                scenes: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      narration: { type: Type.STRING, description: "The text to be displayed for this scene" },
                      visualPrompt: { type: Type.STRING, description: "Detailed image generation prompt for this scene" }
                    },
                    required: ["narration", "visualPrompt"]
                  }
                }
              },
              required: ["title", "scenes"]
            },
            safetySettings: [
              { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
              { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
              { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
              { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
            ],
          }
        });

        if (response.text) {
           const data = JSON.parse(response.text);
           return {
             ...data,
             scenes: data.scenes.map((s: any, i: number) => ({ ...s, id: `scene-${i}` }))
           };
        }
    } catch (e) {
        console.warn("Strategy 1 (Schema) failed, attempting Strategy 2 (Raw JSON)...", e);
    }

    // STRATEGY 2: Fallback to Raw JSON (No Schema enforcement)
    // This bypasses strict schema validation issues which often cause "empty response" in creative tasks
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { 
          parts: [{ text: basePrompt + "\n\nIMPORTANT: Return the result as valid JSON matching the structure: { title: string, scenes: [{ narration: string, visualPrompt: string }] }" }] 
      },
      config: {
        responseMimeType: 'application/json',
        safetySettings: [
          { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        ],
      }
    });

    if (!response.text) {
      const finishReason = response.candidates?.[0]?.finishReason;
      throw new Error(`Failed to generate story text. The model returned an empty response. Finish Reason: ${finishReason}`);
    }

    const data = JSON.parse(response.text);
    return {
      ...data,
      scenes: data.scenes.map((s: any, i: number) => ({ ...s, id: `scene-${i}` }))
    };
  });
};

export const splitSceneWithAI = async (
  currentNarration: string,
  currentVisualPrompt: string,
  artStyle: string = "Cinematic"
): Promise<{ narration: string; visualPrompt: string }[]> => {
  const ai = getClient();
  
  const prompt = `
    You are a professional film editor.
    
    TASK:
    Split the following SINGLE scene into 2 or 3 smaller, granular scenes to improve pacing.
    
    RULES:
    1. Do NOT add new plot points or characters. Just distribute the existing text into multiple parts.
    2. Adjust the wording slightly if needed for flow, but keep the original meaning 100% intact.
    3. Generate a NEW specific visual prompt for each new part based on the original visual prompt, but focusing on the specific action or emotion of that split part.
    4. Keep the art style consistent: "${artStyle}".
    5. Maintain character consistency details found in the original prompt.

    ORIGINAL NARRATION:
    "${currentNarration}"

    ORIGINAL VISUAL PROMPT:
    "${currentVisualPrompt}"
  `;

  return retryWithBackoff(async () => {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [{ text: prompt }] },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              narration: { type: Type.STRING },
              visualPrompt: { type: Type.STRING }
            },
            required: ["narration", "visualPrompt"]
          }
        },
        safetySettings: [
           { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
           { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
        ],
      }
    });

    if (!response.text) throw new Error("Failed to split scene");
    return JSON.parse(response.text);
  });
};

export const generateImageForScene = async (prompt: string, aspectRatio: string = "16:9"): Promise<string> => {
  const ai = getClient();

  return retryWithBackoff(async () => {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { text: prompt }
        ]
      },
      config: {
        imageConfig: {
          aspectRatio: aspectRatio, 
        },
        safetySettings: [
          { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        ],
      }
    });

    const candidates = response.candidates;
    if (!candidates || candidates.length === 0) {
      throw new Error("No image generated (No candidates).");
    }

    const parts = candidates[0].content.parts;
    let base64Image = "";

    for (const part of parts) {
      if (part.inlineData && part.inlineData.data) {
        base64Image = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        break;
      }
    }

    if (!base64Image) {
      throw new Error("No image data found in response.");
    }

    return base64Image;
  });
};

export const generateSpeech = async (text: string, voiceName: string): Promise<string> => {
  const ai = getClient();
  // Map friendly enum name to actual voice name if needed
  const voice = voiceName.split(' ')[0]; 

  return retryWithBackoff(async () => {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: {
        parts: [{ text }]
      },
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voice }
          }
        }
      }
    });

    const base64Pcm = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Pcm) {
      throw new Error("No audio generated");
    }

    return pcmToWav(base64Pcm);
  });
};

// Helper: Convert Raw PCM (24kHz, 16-bit mono) to WAV Base64 Data URI
function pcmToWav(base64Pcm: string): string {
  const binaryString = atob(base64Pcm);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  // WAV Header Construction (44 bytes)
  const wavHeader = new ArrayBuffer(44);
  const view = new DataView(wavHeader);

  // RIFF chunk descriptor
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + len, true); // File size - 8
  writeString(view, 8, 'WAVE');

  // fmt sub-chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
  view.setUint16(20, 1, true); // AudioFormat (1 for PCM)
  view.setUint16(22, 1, true); // NumChannels (1 for Mono)
  view.setUint32(24, 24000, true); // SampleRate (24kHz)
  view.setUint32(28, 24000 * 2, true); // ByteRate
  view.setUint16(32, 2, true); // BlockAlign
  view.setUint16(34, 16, true); // BitsPerSample

  // data sub-chunk
  writeString(view, 36, 'data');
  view.setUint32(40, len, true);

  // Combine Header and Data
  const wavBytes = new Uint8Array(44 + len);
  wavBytes.set(new Uint8Array(wavHeader), 0);
  wavBytes.set(bytes, 44);

  // Convert to Base64 String
  let binary = '';
  const l = wavBytes.byteLength;
  for (let i = 0; i < l; i++) {
    binary += String.fromCharCode(wavBytes[i]);
  }
  const base64 = btoa(binary);

  return `data:audio/wav;base64,${base64}`;
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}
