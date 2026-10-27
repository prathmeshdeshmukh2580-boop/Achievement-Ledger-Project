import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import fs from "fs";
import path from "path";

const PROMPT = `Extract details from this achievement certificate. Return ONLY JSON with keys: achievement_title, event_name, issuer, category (one of: Hackathon, Competition, Course, Certification, Sports, Academic, Cultural, Other), achievement_type (one of: winner, runner_up, finalist, position, participation, completion, other), position (e.g. '1st place', 'Top 10', or null), date (dd-mm-yyyy), recipient_name, credential_id, platform, verification_url. Use null for anything not clearly visible. Do not guess.`;

export const maxDuration = 60; // Next.js serverless timeout allowance

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is not configured on the server." },
        { status: 500 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No certificate file provided." }, { status: 400 });
    }

    // Size limit: 10 MB
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File exceeds maximum allowed size of 10 MB." },
        { status: 413 }
      );
    }

    // Type validation
    const validTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp", "application/pdf"];
    if (!validTypes.includes(file.type.toLowerCase())) {
      return NextResponse.json(
        { error: "Unsupported file type. Please upload a PNG, JPG, or PDF certificate." },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Data = buffer.toString("base64");

    // Safe file handling: only write to disk if supported (e.g. local dev).
    // On serverless environments (like Vercel / AWS Lambda), the filesystem is read-only.
    let fileUrl: string | null = null;
    try {
      const uploadsDir = path.join(process.cwd(), "public", "uploads");
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      const safeName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      const filePath = path.join(uploadsDir, safeName);
      fs.writeFileSync(filePath, buffer);
      fileUrl = `/uploads/${safeName}`;
    } catch {
      // In serverless / read-only environments, skip writing to disk.
      // Extraction continues uninterrupted.
      fileUrl = null;
    }

    // Initialize Gemini SDK
    const ai = new GoogleGenAI({ apiKey });

    // Proven fast models: gemini-3.5-flash (~2-3s OCR), gemini-3.5-flash-lite, gemini-flash-latest, gemini-3.8-flash
    const models = ["gemini-3.5-flash", "gemini-3.5-flash-lite", "gemini-flash-latest", "gemini-3.8-flash"];
    let rawResponseText = "";
    let lastError: any = null;

    for (const modelName of models) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: [
            PROMPT,
            {
              inlineData: {
                mimeType: file.type,
                data: base64Data,
              },
            },
          ],
          config: {
            responseMimeType: "application/json",
          },
        });

        rawResponseText = response.text || "";
        if (rawResponseText) {
          break;
        }
      } catch (err: any) {
        lastError = err;
        // If a model is unavailable or rate limited, immediately cascade to next model without blocking
        continue;
      }
    }

    if (!rawResponseText) {
      return NextResponse.json(
        {
          error:
            "Could not extract details from the certificate. Please verify that the image is clear and try again.",
          details: lastError?.message || "Model returned empty response.",
        },
        { status: 502 }
      );
    }

    // Strip markdown code fences safely
    let cleaned = rawResponseText.trim();
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

    let extracted: any;
    try {
      extracted = JSON.parse(cleaned);
    } catch (parseErr) {
      return NextResponse.json(
        {
          error: "Failed to parse structured information from the certificate. Please try a clearer scan or enter details manually.",
        },
        { status: 422 }
      );
    }

    // Helper to generate one-line summary
    const generateSummary = (data: any) => {
      const type = (data.achievement_type || "").toLowerCase();
      const event = data.event_name || data.achievement_title || "Event";
      const issuer = data.issuer ? ` (${data.issuer})` : "";
      const pos = data.position;

      if (type === "winner" || type === "runner_up" || type === "finalist" || type === "position") {
        if (pos) {
          return `${pos} at ${event}${issuer}`;
        }
        return `Winner at ${event}${issuer}`;
      } else if (type === "participation") {
        return `Participated in ${event}${issuer}`;
      } else if (type === "completion") {
        return `Completed ${data.achievement_title || event} by ${data.issuer || "Organizer"}`;
      }
      return `${data.achievement_title || event}${issuer}`;
    };

    const summary = generateSummary(extracted);

    return NextResponse.json({
      success: true,
      extracted: {
        achievement_title: extracted.achievement_title || null,
        event_name: extracted.event_name || null,
        issuer: extracted.issuer || null,
        category: extracted.category || "Certification",
        achievement_type: extracted.achievement_type || "completion",
        position: extracted.position || null,
        date: extracted.date || null,
        recipient_name: extracted.recipient_name || null,
        credential_id: extracted.credential_id || null,
        platform: extracted.platform || null,
        verification_url: extracted.verification_url || null,
        summary,
        file_url: fileUrl,
        file_name: file.name,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Server error processing certificate extraction: " + (error.message || error) },
      { status: 500 }
    );
  }
}
