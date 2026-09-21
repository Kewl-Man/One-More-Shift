import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

let aiClient: GoogleGenAI | null = null;
function getAi(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API: Health check
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", game: "One More Shift" });
  });

  // API: Supernatural Red Phone / Corporate Supervisor Hotline
  // High thinking mode with gemini-3.1-pro-preview and ThinkingLevel.HIGH
  app.post("/api/manager-consult", async (req, res) => {
    const { query, shift, hour, currentRule, recentIncident } = req.body;
    
    try {
      const ai = getAi();
      if (ai) {
        const prompt = `You are "The Supervisor" at K&M Mart Convenience Store corporate hotline. 
The player is an overnight lone clerk on Shift ${shift || 1} at ${hour || "02:14 AM"}.
Current Store Rule: "${currentRule || "Follow standard procedure."}"
Recent Anomalous Event: "${recentIncident || "None reported yet."}"
Employee's Urgent Question: "${query || "What do I do?"}"

Your personality:
- Cold, bureaucratic, unsettling, darkly funny, subtly dread-inducing.
- You treat life-threatening paranormal anomalies like minor workplace protocol violations.
- Give a cryptic yet practical survival directive (1 to 3 sentences maximum).
- Never break character. Always remind them that unapproved overtime will be deducted from their pay.`;

        const response = await ai.models.generateContent({
          model: "gemini-3.1-pro-preview",
          contents: prompt,
          config: {
            thinkingConfig: {
              thinkingLevel: ThinkingLevel.HIGH,
            },
          },
        });

        const supervisorReply = response.text?.trim();
        if (supervisorReply) {
          return res.json({ reply: supervisorReply, source: "ai" });
        }
      }
    } catch (err) {
      console.warn("Gemini API call failed or unavailable, using corporate contingency protocol:", err);
    }

    // Atmospheric thematic fallbacks if API key is not present or rate limited
    const defaultReplies = [
      "Corporate reminds you: Do not maintain eye contact with any customer who pays in exact prehistoric pennies. If their teeth look too numerous, ring them up as 'Produce #4011'.",
      "Regarding your inquiry: If you see someone standing at the end of Aisle 6 facing the wall, you are not authorized to disturb their meditation. Continue inventorying the beef jerky.",
      "The cameras are working within acceptable reality tolerances. If a feed shows an empty checkout counter while you are standing there, simply adjust your posture.",
      "All employees must remember: Store policy strictly forbids discussing 'The Customer' before 3:45 AM. If asked for a refund on unstocked merchandise, hand them a receipt paper roll and smile.",
      "This is Night Shift Dispatch. Your break was scheduled for 03:00 to 03:01 AM. You have missed it. Please ensure the front entrance is deadbolted immediately if the outside sky turns purple.",
      "If an entity claims to be the Regional Manager, ask for their badge number. If their fingers are longer than eight inches, direct them to the complimentary hot dog roller."
    ];

    const fallback = defaultReplies[Math.floor(Math.random() * defaultReplies.length)];
    res.json({ reply: fallback, source: "fallback" });
  });

  // Vite middleware in dev or static files in production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[ONE MORE SHIFT] Server booted on http://0.0.0.0:${PORT}`);
  });
}

startServer();
