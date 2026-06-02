// Speech-to-text via OpenAI Whisper.
// The JustCall recording URL is a presigned-URL getter that 302-redirects to
// the actual audio file. We fetch (following redirects) server-side, then send
// the audio to Whisper.

const OPENAI_KEY = process.env.OPENAI_API_KEY || "";
const WHISPER_URL = "https://api.openai.com/v1/audio/transcriptions";
const MAX_BYTES = 25 * 1024 * 1024; // Whisper hard limit: 25 MB

export interface TranscriptResult {
  text: string;
  ok: boolean;
  error?: string;
}

export async function transcribeRecording(recordingUrl: string): Promise<TranscriptResult> {
  if (!OPENAI_KEY) return { text: "", ok: false, error: "OPENAI_API_KEY not set" };
  if (!recordingUrl) return { text: "", ok: false, error: "No recording URL" };

  // 1) Download the audio (JustCall getter redirects to the real file).
  let audioRes: Response;
  try {
    audioRes = await fetch(recordingUrl, { redirect: "follow", cache: "no-store" });
  } catch (e: unknown) {
    return { text: "", ok: false, error: `Recording fetch failed: ${(e as Error).message}` };
  }
  if (!audioRes.ok) {
    return { text: "", ok: false, error: `Recording HTTP ${audioRes.status}` };
  }

  const buf = await audioRes.arrayBuffer();
  if (buf.byteLength === 0) return { text: "", ok: false, error: "Empty recording" };
  if (buf.byteLength > MAX_BYTES) {
    return { text: "", ok: false, error: "Recording exceeds 25MB Whisper limit" };
  }

  const ct = audioRes.headers.get("content-type") || "audio/mpeg";
  const ext = ct.includes("wav") ? "wav" : ct.includes("ogg") ? "ogg" : ct.includes("mp4") || ct.includes("m4a") ? "m4a" : "mp3";

  // 2) Send to Whisper.
  const form = new FormData();
  form.append("file", new Blob([buf], { type: ct }), `call.${ext}`);
  form.append("model", "whisper-1");
  form.append("response_format", "text");

  let res: Response;
  try {
    res = await fetch(WHISPER_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${OPENAI_KEY}` },
      body: form,
    });
  } catch (e: unknown) {
    return { text: "", ok: false, error: `Whisper request failed: ${(e as Error).message}` };
  }

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    return { text: "", ok: false, error: `Whisper HTTP ${res.status}: ${detail.slice(0, 200)}` };
  }

  const text = (await res.text()).trim();
  return { text, ok: true };
}
