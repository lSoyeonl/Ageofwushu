import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" },
  });
}

function cleanText(value: unknown, max: number) {
  return String(value ?? "").replace(/[\r\n\t]+/g, " ").trim().slice(0, max);
}

function cleanMultiline(value: unknown, max: number) {
  return String(value ?? "")
    .replace(/\r\n?/g, "\n")
    .replace(/\u0000/g, "")
    .trim()
    .slice(0, max);
}

function markdownLabel(value: string) {
  return value.replace(/([\\\[\]()_*~`>])/g, "\\$1");
}

function validHttpsUrl(value: unknown, max = 500) {
  const raw = String(value ?? "").trim().slice(0, max);
  if (!raw) return "";
  try {
    const url = new URL(raw);
    return url.protocol === "https:" ? url.href : "";
  } catch {
    return "";
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ ok: false, error: "Method not allowed" }, 405);

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const webhookRaw = Deno.env.get("DISCORD_WEBHOOK_URL") ?? "";
    if (!supabaseUrl || !serviceRole) return json({ ok: false, error: "Supabase server secrets are unavailable" }, 500);
    if (!webhookRaw) return json({ ok: false, error: "DISCORD_WEBHOOK_URL is not configured" }, 500);

    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
    if (!token) return json({ ok: false, error: "Authentication required" }, 401);

    const admin = createClient(supabaseUrl, serviceRole, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: userData, error: userError } = await admin.auth.getUser(token);
    const user = userData?.user;
    if (userError || !user) return json({ ok: false, error: "Invalid session" }, 401);

    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    if (profileError) return json({ ok: false, error: profileError.message }, 500);
    if (profile?.role !== "admin") return json({ ok: false, error: "Admin only" }, 403);

    const body = await req.json().catch(() => ({}));
    const title = cleanText(body?.title, 180) || "Новая публикация";
    const section = cleanText(body?.section, 100) || "Сайт";
    const urlRaw = String(body?.url ?? "").trim();

    let publicUrl: URL;
    try {
      publicUrl = new URL(urlRaw);
      if (publicUrl.protocol !== "https:") throw new Error("https only");
    } catch {
      return json({ ok: false, error: "Invalid public URL" }, 400);
    }

    let webhook: URL;
    try {
      webhook = new URL(webhookRaw.trim());
      const allowedHost =
        webhook.hostname === "discord.com" ||
        webhook.hostname.endsWith(".discord.com") ||
        webhook.hostname === "discordapp.com";
      if (!allowedHost || !webhook.pathname.includes("/api/webhooks/")) throw new Error("invalid webhook");
    } catch {
      return json({ ok: false, error: "DISCORD_WEBHOOK_URL is invalid" }, 500);
    }
    webhook.searchParams.set("wait", "true");

    const fallback = `📢 **${section}**\n[${markdownLabel(title)}](${publicUrl.href})`;
    const content = cleanMultiline(body?.content, 1900) || fallback;
    const username = cleanText(body?.username, 80);
    const avatarUrl = validHttpsUrl(body?.avatarUrl);

    const discordBody: Record<string, unknown> = {
      content,
      allowed_mentions: { parse: [] },
    };
    if (username) discordBody.username = username;
    if (avatarUrl) discordBody.avatar_url = avatarUrl;

    const discordResponse = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(discordBody),
    });

    if (!discordResponse.ok) {
      const details = (await discordResponse.text()).slice(0, 500);
      return json({ ok: false, error: `Discord ${discordResponse.status}: ${details}` }, 502);
    }

    return json({ ok: true });
  } catch (error) {
    return json({ ok: false, error: error instanceof Error ? error.message : String(error) }, 500);
  }
});
