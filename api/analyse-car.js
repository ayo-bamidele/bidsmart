export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { prompt, useWebSearch } = req.body;
    if (!prompt) return res.status(400).json({ error: "Missing prompt" });

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "ANTHROPIC_API_KEY not configured in Vercel environment variables" });

    // Use Sonnet for web search (Haiku doesn't support it), Haiku for everything else
    const model = useWebSearch
      ? "claude-sonnet-4-5-20250929"
      : "claude-haiku-4-5-20251001";

    const body = {
      model,
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
    };

    if (useWebSearch) {
      body.tools = [{ type: "web_search_20250305", name: "web_search" }];
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data?.error?.message || "Claude API error" });
    }

    const result = data.content
      ?.filter(b => b.type === "text")
      .map(b => b.text)
      .join("\n") || "";

    return res.status(200).json({ result });

  } catch (error) {
    return res.status(500).json({ error: error.message || "Server error" });
  }
}
