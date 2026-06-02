import Anthropic from "@anthropic-ai/sdk";
import { getCallsForContact, CallDetail } from "@/lib/justcall";
import { transcribeRecording } from "@/lib/transcribe";

export const dynamic     = "force-dynamic";
export const maxDuration = 60;

// Cache analysis per call so we never re-transcribe the same recording.
const _cache = new Map<string, { at: number; payload: unknown }>();
const TTL = 6 * 60 * 60 * 1000; // 6h

function fmtDur(s: number): string {
  const m = Math.floor(s / 60);
  const r = s % 60;
  return m ? `${m}m ${r}s` : `${r}s`;
}

export async function POST(req: Request) {
  let body: { email?: string; phone?: string; name?: string };
  try { body = await req.json(); }
  catch { return Response.json({ error: "Invalid request body" }, { status: 400 }); }

  const { email = "", phone = "", name = "" } = body;
  if (!email && !phone) {
    return Response.json({ error: "Missing email or phone" }, { status: 400 });
  }

  // 1) Fetch this contact's calls from JustCall.
  let calls: CallDetail[];
  try {
    calls = await getCallsForContact(email, phone);
  } catch (e: unknown) {
    return Response.json({ error: `JustCall error: ${(e as Error).message}` }, { status: 502 });
  }

  if (!calls.length) {
    return Response.json({ calls: [], transcript: "", analysis: "", note: "No calls found for this lead in JustCall." });
  }

  // 2) Pick the best recording to transcribe: longest effective call with audio.
  const withRec = calls.filter(c => c.hasRecording);
  const target  = [...withRec].sort((a, b) => b.durationSec - a.durationSec)[0];

  if (!target) {
    return Response.json({ calls, transcript: "", analysis: "", note: "Calls found but none have a recording to analyze." });
  }

  const cacheKey = target.callSid || String(target.id);
  const cached = _cache.get(cacheKey);
  if (cached && Date.now() - cached.at < TTL) {
    return Response.json({ ...(cached.payload as object), calls });
  }

  // 3) Transcribe.
  const t = await transcribeRecording(target.recordingUrl);
  if (!t.ok) {
    return Response.json({ calls, transcript: "", analysis: "", error: `Transcription failed: ${t.error}` }, { status: 502 });
  }

  // 4) Analyze the transcript with Claude.
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return Response.json({ calls, transcript: t.text, analysis: "", error: "ANTHROPIC_API_KEY not configured." }, { status: 500 });
  }

  const client = new Anthropic({ apiKey });
  const prompt = `You are a senior sales coach for Smith & Adams Group, reviewing a sales call recording. Below is the transcript of a call to a lead, plus metadata.

== CALL METADATA ==
Lead: ${name || "(unknown)"}
Agent: ${target.agentName || "(unknown)"}
Direction: ${target.direction}
Duration: ${fmtDur(target.durationSec)}
Disposition: ${target.disposition || "(none logged)"}

== TRANSCRIPT ==
${t.text}

Analyze this call and respond in this exact structure (keep it tight and specific):

## Summary
2-3 sentences on what happened in the call.

## Lead Interest & Sentiment
The prospect's level of interest and tone. Were they engaged, hesitant, or cold?

## Objections & Concerns
Any objections, hesitations, or blockers the lead raised.

## Agent Performance
What the agent did well and what they missed. Be honest and specific.

## Next Steps
Concrete recommended follow-up actions for this specific lead.

## Call Quality Score
A score out of 10 with a one-line justification.

Base everything strictly on the transcript. If the transcript is too short or unclear to judge, say so.`;

  let analysis = "";
  try {
    const msg = await client.messages.create({
      model:      "claude-sonnet-4-6",
      max_tokens: 1200,
      messages:   [{ role: "user", content: prompt }],
    });
    analysis = msg.content[0].type === "text" ? msg.content[0].text : "";
  } catch (e: unknown) {
    return Response.json({ calls, transcript: t.text, analysis: "", error: `Analysis failed: ${(e as Error).message}` }, { status: 500 });
  }

  const payload = {
    transcript: t.text,
    analysis,
    analyzedCall: { id: target.id, durationSec: target.durationSec, agentName: target.agentName, iso: target.iso },
  };
  _cache.set(cacheKey, { at: Date.now(), payload });

  return Response.json({ ...payload, calls });
}
