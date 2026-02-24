import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

function extractTitle(html: string): string | undefined {
  const m = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (m && m[1]) return m[1].trim().replace(/\s+/g," ");
  const og = html.match(/property=["']og:title["'][^>]*content=["']([^"']+)["']/i);
  if (og && og[1]) return og[1].trim().replace(/\s+/g," ");
  return undefined;
}

function extractCanonical(html: string): string | undefined {
  const m = html.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["'][^>]*>/i);
  return m?.[1]?.trim();
}

export async function GET(req: NextRequest) {
  const u = req.nextUrl.searchParams.get("u");
  if (!u) return NextResponse.json({ error: "Missing u" }, { status: 400 });
  try {
    const res = await fetch(u, {
      headers: {
        "user-agent": "GCC-Pulse-MVP/0.1 (+https://vercel.app)",
        "accept": "text/html,application/xhtml+xml",
      },
      redirect: "follow",
    });
    const html = await res.text();
    const title = extractTitle(html);
    const canonicalUrl = extractCanonical(html);
    return NextResponse.json({ title, canonicalUrl });
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}
