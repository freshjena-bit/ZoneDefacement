import { NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";
import { db } from "@/lib/db";
import { normalizeUrl, faviconFor } from "@/lib/url";
import { htmlToText, excerpt } from "@/lib/sanitize";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const rawUrl: string = typeof body?.url === "string" ? body.url : "";
    if (!rawUrl.trim()) {
      return NextResponse.json({ error: "url is required" }, { status: 400 });
    }

    let normalized: { url: string; domain: string };
    try {
      normalized = normalizeUrl(rawUrl);
    } catch (e: any) {
      return NextResponse.json(
        { error: e?.message ?? "Invalid URL" },
        { status: 400 },
      );
    }

    const { url, domain } = normalized;
    const startedAt = Date.now();

    // Try to fetch the live page via Z.ai page_reader.
    let title = "";
    let html = "";
    let text = "";
    let publishedTime: string | null = null;
    let fetchFailed = false;
    let fetchError: string | null = null;

    try {
      const zai = await ZAI.create();
      const result = await zai.functions.invoke("page_reader", { url });
      const data = (result as any)?.data ?? result;
      title = (data?.title ?? "").toString().trim();
      html = (data?.html ?? "").toString();
      publishedTime =
        typeof data?.publishedTime === "string" && data.publishedTime
          ? data.publishedTime
          : null;
      text = htmlToText(html);

      if (!title) {
        title = domain;
      }
    } catch (e: any) {
      fetchFailed = true;
      fetchError = e?.message ?? "Fetch failed";
    }

    const captureMs = Date.now() - startedAt;
    const siteTitle = title || domain;
    const description = excerpt(text, 160) || null;
    const excerptText = excerpt(text, 200) || null;
    const contentLength = html ? Buffer.byteLength(html, "utf8") : 0;

    // Upsert site record.
    const site = await db.site.upsert({
      where: { url },
      update: {
        domain,
        title: siteTitle,
        description: description ?? undefined,
        favicon: faviconFor(domain),
        lastArchivedAt: new Date(),
      },
      create: {
        url,
        domain,
        title: siteTitle,
        description: description ?? undefined,
        favicon: faviconFor(domain),
        lastArchivedAt: new Date(),
      },
    });

    // Always create a snapshot (success or failed).
    const snapshot = await db.snapshot.create({
      data: {
        siteId: site.id,
        title: siteTitle,
        excerpt: excerptText,
        html: fetchFailed ? "" : html,
        text: fetchFailed ? null : text,
        status: fetchFailed ? "failed" : "success",
        contentLength: fetchFailed ? 0 : contentLength,
        publishedTime: publishedTime ?? null,
        captureMs,
      },
    });

    if (fetchFailed) {
      return NextResponse.json(
        {
          site,
          snapshot,
          warning: `Archived, but live capture failed: ${fetchError ?? "unknown error"}`,
        },
        { status: 200 },
      );
    }

    return NextResponse.json({ site, snapshot }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Internal server error" },
      { status: 500 },
    );
  }
}
