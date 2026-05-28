import Anthropic from "@anthropic-ai/sdk";

export const dynamic    = "force-dynamic";
export const maxDuration = 30;

function fmtMin(m: number | null): string {
  if (m == null) return "N/A";
  if (m < 60)    return `${m}min`;
  if (m < 1440)  return `${(m / 60).toFixed(1)}h`;
  return `${(m / 1440).toFixed(1)} days`;
}

export async function POST(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "ANTHROPIC_API_KEY not configured - add it to your Vercel environment variables." },
      { status: 500 }
    );
  }

  let data: any;
  try { data = await req.json(); }
  catch { return Response.json({ error: "Invalid request body" }, { status: 400 }); }

  const client = new Anthropic({ apiKey });

  const prompt = `You are a senior sales analytics expert reviewing lead data for Smith & Adams Group, which generates leads through Meta/Facebook paid ads.

Analyze the data below and provide sharp, actionable insights. Be data-driven and specific - avoid generic advice.

== PERFORMANCE SUMMARY ==
Total leads: ${data.totalLeads}
Called rate: ${data.pctCalled}%
Call answer rate: ${data.callAnswerRate}%
Avg time to first call: ${fmtMin(data.avgMinutesToFirstCall)}

== LEAD STATUS ==
${(data.byStatus || []).map((s: any) => `- ${s.status}: ${s.count}`).join("\n")}

== BY COUNTRY ==
${(data.byCountry || []).map((c: any) => `- ${c.region}: ${c.count} leads`).join("\n")}

== AGENT PERFORMANCE ==
${(data.byAgent || []).map((a: any) =>
  `- ${a.agent}: ${a.leads} leads | called ${a.called} | answered ${a.answered} | converted ${a.converted}`
).join("\n")}

== PEAK SUBMISSION TIMES ==
Top hours: ${(data.topHours || []).join(", ")}
Top days: ${(data.topDays || []).join(", ")}

== RESPONSE TIME DISTRIBUTION ==
${Object.entries(data.responseTimeBuckets || {}).map(([k, v]) => `- ${k}: ${v} leads`).join("\n")}

== AVG RESPONSE TIME BY COUNTRY ==
${(data.responseTimeByCountry || []).map((c: any) => `- ${c.country}: ${fmtMin(c.avgMinutes)} (${c.count} calls)`).join("\n")}

== TOP CAMPAIGNS ==
${(data.byCampaign || []).map((c: any) => `- ${c.campaign}: ${c.leads} leads`).join("\n")}

Provide your analysis in this exact structure (use the headers as shown):

## Key Observations
3-5 specific findings backed by the numbers above.

## Patterns Detected
Timing, geographic, and behavioral patterns worth acting on.

## Warning Signs
Metrics that are underperforming or trending in the wrong direction.

## Recommendations
4-5 concrete actions the team can take this week, with the expected impact.

Be direct and concise. Each point should be 1-2 sentences max.`;

  try {
    const msg = await client.messages.create({
      model:      "claude-sonnet-4-6",
      max_tokens: 1400,
      messages:   [{ role: "user", content: prompt }],
    });

    const text = msg.content[0].type === "text" ? msg.content[0].text : "";
    return Response.json({ analysis: text });
  } catch (e: any) {
    return Response.json({ error: e.message || "Analysis failed" }, { status: 500 });
  }
}
