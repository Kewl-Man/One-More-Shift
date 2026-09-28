import express from "express";
import path from "path";
import fs from "fs";
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

  app.use(express.json({ limit: "64mb" }));

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

  // API: Custom Flashlight 3D model & textures scanner
  app.get("/api/flashlight-assets", (_req, res) => {
    try {
      const candidates = [
        path.join(process.cwd(), "public", "models", "flashlight"),
        path.join(process.cwd(), "public", "flashlight"),
        path.join(process.cwd(), "public", "assets", "flashlight"),
      ];

      let targetDir = candidates[0];
      let files: string[] = [];

      for (const dir of candidates) {
        if (fs.existsSync(dir)) {
          const list = fs.readdirSync(dir);
          const hasModel = list.some((f) => /\.(glb|gltf|obj|fbx)$/i.test(f));
          if (hasModel || list.length > 0) {
            targetDir = dir;
            files = list;
            break;
          }
        }
      }

      if (!files.length && fs.existsSync(targetDir)) {
        files = fs.readdirSync(targetDir);
      }

      // Base public URL path
      const relDir = path.relative(path.join(process.cwd(), "public"), targetDir).replace(/\\/g, "/");
      const baseUrl = `/${relDir}`.replace(/\/+/g, "/");

      // Find model file
      const modelExts = [".glb", ".gltf", ".obj", ".fbx"];
      let foundModel: string | null = null;
      let modelFormat: string | null = null;

      // Prefer GLB / GLTF first, then OBJ, then FBX
      for (const ext of modelExts) {
        const match = files.find((f) => f.toLowerCase().endsWith(ext) && !f.startsWith("."));
        if (match) {
          foundModel = `${baseUrl}/${match}`;
          modelFormat = ext.replace(".", "").toLowerCase();
          break;
        }
      }

      // Find textures (roughness, normal, baseColor/albedo, metallic, ao)
      const textures: Record<string, string> = {};
      const imgExts = /\.(png|jpe?g|webp|bmp|tga)$/i;

      for (const f of files) {
        if (!imgExts.test(f)) continue;
        const filePath = path.join(targetDir, f);
        try {
          const stat = fs.statSync(filePath);
          if (stat.size < 10) continue; // Skip empty/stub texture files
        } catch {
          continue;
        }

        const lower = f.toLowerCase();
        const url = `${baseUrl}/${f}`;

        if (/rough(ness)?/i.test(lower) && !textures.roughness) {
          textures.roughness = url;
        } else if (/norm(al)?/i.test(lower) && !textures.normal) {
          textures.normal = url;
        } else if (/(base_?color|albedo|diffuse|color)/i.test(lower) && !textures.baseColor) {
          textures.baseColor = url;
        } else if (/(metal(lic|ness)?)/i.test(lower) && !textures.metallic) {
          textures.metallic = url;
        } else if (/(ao|ambient_?occlusion|occlusion)/i.test(lower) && !textures.ao) {
          textures.ao = url;
        } else if (/emiss(ive)?/i.test(lower) && !textures.emissive) {
          textures.emissive = url;
        }
      }

      // Check if manifest.json exists
      let manifest: any = null;
      const manifestPath = path.join(targetDir, "manifest.json");
      if (fs.existsSync(manifestPath)) {
        try {
          manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
        } catch {}
      }

      res.json({
        hasCustomModel: Boolean(foundModel),
        targetDir: relDir,
        modelUrl: foundModel,
        modelFormat,
        textures,
        allFiles: files,
        manifest,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // API: Upload custom flashlight model and textures directly from browser
  app.post("/api/flashlight-assets/upload", (req, res) => {
    try {
      const { files } = req.body;
      if (!Array.isArray(files) || files.length === 0) {
        return res.status(400).json({ error: "No files provided" });
      }

      const uploadDir = path.join(process.cwd(), "public", "models", "flashlight");
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const saved: string[] = [];
      for (const item of files) {
        if (!item.name || !item.base64) continue;
        const safeName = path.basename(item.name);
        const buffer = Buffer.from(item.base64, "base64");
        fs.writeFileSync(path.join(uploadDir, safeName), buffer);
        saved.push(safeName);
      }

      res.json({ success: true, saved, folder: "/models/flashlight/" });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
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
