
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, VibeLevel, HistoricalGame } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SOCRATIC_SYSTEM_INSTRUCTION = `
You are "Caissa's Shadow", a wise, slightly cryptic, but deeply supportive Grandmaster ghost. 
You hate rote memorization. You love 'flow' and 'intuition'.
When a user suggests a move, ask *why*. If they are wrong, guide them to the answer using board geometry, tension, and pawn structures, NOT engine evaluations (e.g., never say "+1.5").
Speak in metaphors of war, art, physics, and psychology.
Be concise but impactful.
`;

export const geminiService = {
  /**
   * Analyzes an image of a chess board to extract FEN, Vibe, and Metrics.
   */
  analyzeBoardImage: async (base64Image: string): Promise<AnalysisResult> => {
    // Schema for structured output
    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        fen: { type: Type.STRING, description: "The FEN string of the position." },
        turn: { type: Type.STRING, enum: ["w", "b"], description: "Whose turn is it? 'w' for White, 'b' for Black." },
        openingName: { type: Type.STRING, description: "The specific name of the chess opening or structure (e.g. 'Sicilian Najdorf')." },
        vibeScore: { type: Type.NUMBER, description: "0 to 100, representing the positional advantage and psychological state." },
        vibeLabel: { type: Type.STRING, enum: ["Panic", "Tension", "Flow", "Domination"] },
        efficiency: { type: Type.NUMBER, description: "0-100. How straightforward is the win?" },
        roi: { type: Type.NUMBER, description: "0-100. Return on Investment for calculating deep lines here." },
        pragmatism: { 
          type: Type.OBJECT,
          properties: {
            san: { type: Type.STRING, description: "The most efficient, low-risk move (SAN)." },
            translation: { type: Type.STRING, description: "Natural language translation (e.g., 'Queen takes Pawn on g5')." },
            rationale: { type: Type.STRING, description: "Explain WHY this is safe/efficient. (e.g., 'This secures material...')" }
          },
          required: ["san", "translation", "rationale"]
        },
        artistry: { 
          type: Type.OBJECT,
          properties: {
            san: { type: Type.STRING, description: "A creative, high-risk/high-reward or beautiful move (SAN)." },
            translation: { type: Type.STRING, description: "Natural language translation (e.g., 'Rook sacrifices on e5')." },
            rationale: { type: Type.STRING, description: "Explain WHY this is bold/artistic. (e.g., 'You sacrifice the Rook to strip the King...')" }
          },
          required: ["san", "translation", "rationale"]
        },
        performanceState: {
           type: Type.OBJECT,
           properties: {
             tunnelVision: { type: Type.NUMBER, description: "0-100 probability the player is missing the big picture." },
             fear: { type: Type.NUMBER, description: "0-100 level of defensive passivity detected." },
             aggression: { type: Type.NUMBER, description: "0-100 level of attacking intent." }
           },
           required: ["tunnelVision", "fear", "aggression"]
        },
        strategy: {
          type: Type.OBJECT,
          properties: {
            theme: { type: Type.STRING, description: "The tactical theme (e.g., 'The Central Sacrifice')." },
            concept: { type: Type.STRING, description: "The strategic concept explanation." },
            ruleOfThumb: { type: Type.STRING, description: "A punchy rule of thumb for this situation." }
          },
          required: ["theme", "concept", "ruleOfThumb"]
        },
        summary: { type: Type.STRING, description: "A one-sentence summary of the board state." }
      },
      required: ["fen", "turn", "vibeScore", "vibeLabel", "efficiency", "roi", "pragmatism", "artistry", "performanceState", "strategy", "summary"],
    };

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview', 
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: 'image/jpeg', 
                data: base64Image
              }
            },
            {
              text: "Analyze this chess position. Extract FEN. Identify the 'Opening Name' (e.g. Ruy Lopez, King's Indian). Identify the 'Pragmatic' move (safe) and the 'Artist' move (bold). Provide translations and philosophical rationales."
            }
          ]
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: responseSchema,
          // CRITICAL UPDATE: Explicit instruction for 3D/Metallic pieces
          systemInstruction: "You are a top-tier Grandmaster analyst. IMPORTANT: In the image, Black pieces may appear grey, metallic, or silver due to 3D lighting. You must classify these grey/silver pieces as BLACK, not white."
        }
      });

      if (!response.text) throw new Error("No response from Gemini");
      
      const data = JSON.parse(response.text);
      
      // Map string label to Enum
      let vibeLabel = VibeLevel.Tension;
      if (data.vibeLabel === 'Panic') vibeLabel = VibeLevel.Panic;
      if (data.vibeLabel === 'Flow') vibeLabel = VibeLevel.Flow;
      if (data.vibeLabel === 'Domination') vibeLabel = VibeLevel.Domination;

      return {
        fen: data.fen,
        turn: data.turn || 'w',
        openingName: data.openingName || "Unknown Structure",
        vibeScore: data.vibeScore,
        vibeLabel: vibeLabel,
        metrics: {
          efficiency: data.efficiency,
          roi: data.roi,
          pragmatism: data.pragmatism,
          artistry: data.artistry
        },
        performanceState: {
          tunnelVision: data.performanceState?.tunnelVision || 20,
          fear: data.performanceState?.fear || 20,
          aggression: data.performanceState?.aggression || 50,
        },
        strategy: {
          theme: data.strategy?.theme || "Tactical Opportunity",
          concept: data.strategy?.concept || "Look for hanging pieces.",
          ruleOfThumb: data.strategy?.ruleOfThumb || "Checks, captures, and threats."
        },
        summary: data.summary
      };
    } catch (error) {
      console.error("Analysis failed:", error);
      throw error;
    }
  },

  /**
   * Generates a visual metaphor description.
   */
  generateMetaphor: async (fen: string): Promise<string> => {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Analyze this chess position (FEN: ${fen}). 
        Create a vivid "Visual Metaphor" that encapsulates the strategy (e.g., "A Battering Ram breaking the Gate", "A Spider spinning a web", "A Sniper in a bell tower"). 
        Return ONLY the metaphor phrase, nothing else.`,
      });
      return response.text?.trim() || "A Storm hitting a Fortress";
    } catch (error) {
      return "A Clash of Titans";
    }
  },

  /**
   * Finds a real historical match using Google Search Grounding.
   */
  findHistoricalMatch: async (openingName: string): Promise<HistoricalGame | null> => {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Find a famous historical chess game that features the "${openingName}" or a very similar structure. 
        Identify the Players, the Year, and a brief 1-sentence description of why it is famous (e.g. a specific sacrifice or maneuver).
        Return the result as a JSON object with keys: players, year, opening, description.`,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json"
        }
      });

      const text = response.text;
      if (!text) return null;
      
      const data = JSON.parse(text);
      
      // Attempt to get grounding metadata if available (for source URL)
      let sourceUrl = undefined;
      let sourceTitle = undefined;
      if (response.candidates?.[0]?.groundingMetadata?.groundingChunks?.[0]?.web) {
          sourceUrl = response.candidates[0].groundingMetadata.groundingChunks[0].web.uri;
          sourceTitle = response.candidates[0].groundingMetadata.groundingChunks[0].web.title;
      }

      return {
        players: data.players || "Unknown Grandmasters",
        year: data.year || "20th Century",
        opening: data.opening || openingName,
        description: data.description || "A classic struggle in this line.",
        sourceUrl,
        sourceTitle
      };

    } catch (error) {
      console.error("Historical search failed:", error);
      return null;
    }
  },

  /**
   * Sends a message to the Socratic Coach.
   */
  sendChatMessage: async (history: {role: string, parts: {text: string}[]}[], fen: string, userMessage: string): Promise<string> => {
    try {
      const chat = ai.chats.create({
        model: 'gemini-3-pro-preview',
        history: history,
        config: {
          systemInstruction: SOCRATIC_SYSTEM_INSTRUCTION
        }
      });

      // Context injection if it's the start or if helpful
      const contextMessage = `[Current Board FEN: ${fen}] User says: ${userMessage}`;
      
      const result = await chat.sendMessage({ message: contextMessage });
      return result.text || "...";
    } catch (error) {
      console.error(error);
      return "I sensed a disturbance in the connection. Try again.";
    }
  },

  /**
   * Gets a final strategic verdict on the position.
   */
  getGameStateEvaluation: async (fen: string): Promise<string> => {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Analyze this final chess position (FEN: ${fen}). 
        Provide a 2-sentence professional Grandmaster verdict. 
        1. Who is winning (White, Black, or Draw)? 
        2. What is the critical reason (Material, Space, King Safety)?
        Speak directly to the player.`,
        config: {
            systemInstruction: "You are a concise, high-level chess coach. Be direct."
        }
      });
      return response.text || "The position is complex and requires further study.";
    } catch (error) {
      return "Unable to retrieve final evaluation.";
    }
  }
};
