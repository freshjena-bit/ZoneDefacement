import { db } from "@/lib/db";

/**
 * Idempotently seed the database with a few synthetic demo archives
 * so the home page isn't empty on first run. No network calls — the
 * snapshots contain hand-written HTML excerpts so the UI looks populated
 * immediately and the user can still archive real sites afterwards.
 *
 * Safe to call repeatedly — only seeds when zero sites exist.
 */
export async function seedIfEmpty(): Promise<void> {
  const count = await db.site.count();
  if (count > 0) return;

  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;

  const samples = [
    {
      url: "https://example.com",
      domain: "example.com",
      title: "Example Domain",
      description:
        "This domain is for use in illustrative examples in documents. You may use this domain in literature without prior coordination or asking for permission.",
      favicon: "https://www.google.com/s2/favicons?domain=example.com&sz=64",
      capturedAt: new Date(now - 6 * day),
      createdAt: new Date(now - 7 * day),
      snapshotTitle: "Example Domain",
      excerpt:
        "This domain is for use in illustrative examples in documents. You may use this domain in literature without prior coordination or asking for permission.",
      publishedTime: null,
      captureMs: 842,
      contentLength: 1256,
      html: `<article>
  <h1>Example Domain</h1>
  <p>This domain is for use in illustrative examples in documents. You may use this domain in literature without prior coordination or asking for permission.</p>
  <p><a href="https://www.iana.org/domains/example">More information...</a></p>
</article>`,
      text: "Example Domain. This domain is for use in illustrative examples in documents. You may use this domain in literature without prior coordination or asking for permission.",
    },
    {
      url: "https://en.wikipedia.org/wiki/Web_archiving",
      domain: "en.wikipedia.org",
      title: "Web archiving — Wikipedia",
      description:
        "Web archiving is the process of collecting portions of the World Wide Web to ensure the information is preserved in an archive for future researchers, historians, and the public.",
      favicon:
        "https://www.google.com/s2/favicons?domain=en.wikipedia.org&sz=64",
      capturedAt: new Date(now - 2 * day - 3 * 60 * 60 * 1000),
      createdAt: new Date(now - 5 * day),
      snapshotTitle: "Web archiving — Wikipedia",
      excerpt:
        "Web archiving is the process of collecting portions of the World Wide Web to ensure the information is preserved in an archive for future researchers, historians, and the public.",
      publishedTime: "2024-09-12T14:22:00Z",
      captureMs: 1438,
      contentLength: 4823,
      html: `<article>
  <h1>Web archiving</h1>
  <p><em>Web archiving</em> is the process of collecting portions of the <a href="https://en.wikipedia.org/wiki/World_Wide_Web">World Wide Web</a> to ensure the information is preserved in an archive for future researchers, historians, and the public.</p>
  <h2>Methods</h2>
  <p>The most common web archiving technique uses <strong>web crawlers</strong> to automate the collection of web pages. Large-scale archiving projects include the Internet Archive's Wayback Machine, Archive-It, and various national libraries.</p>
  <blockquote>Web archives are built using crawlers, which traverse the web by following links from page to page, downloading content as they go.</blockquote>
  <h2>Challenges</h2>
  <ul>
    <li>The dynamic nature of the web — pages change or disappear constantly.</li>
    <li>JavaScript-heavy single-page applications are difficult to capture.</li>
    <li>Storage and bandwidth costs at scale.</li>
  </ul>
</article>`,
      text: "Web archiving. Web archiving is the process of collecting portions of the World Wide Web to ensure the information is preserved in an archive for future researchers, historians, and the public. The most common web archiving technique uses web crawlers to automate the collection of web pages.",
    },
    {
      url: "https://news.ycombinator.com",
      domain: "news.ycombinator.com",
      title: "Hacker News",
      description:
        "Hacker News — a social news website focusing on computer science, technology, and entrepreneurship, run by Y Combinator.",
      favicon:
        "https://www.google.com/s2/favicons?domain=news.ycombinator.com&sz=64",
      capturedAt: new Date(now - 5 * 60 * 60 * 1000),
      createdAt: new Date(now - 3 * day),
      snapshotTitle: "Hacker News — front page capture",
      excerpt:
        "A social news website focusing on computer science, technology, and entrepreneurship. Top stories include discussions on distributed systems, new programming languages, and startup launches.",
      publishedTime: null,
      captureMs: 967,
      contentLength: 2891,
      html: `<article>
  <h1>Hacker News</h1>
  <p>A social news website focusing on computer science, technology, and entrepreneurship, run by Y Combinator.</p>
  <h2>Top stories</h2>
  <ul>
    <li>Show HN: A new approach to distributed tracing</li>
    <li>The history of garbage collection in 10 minutes</li>
    <li>Why SQLite is the most widely deployed database in the world</li>
    <li>Lessons from running a tiny SaaS for three years</li>
  </ul>
  <p>Users submit links, which are voted on by the community. The most popular stories rise to the front page.</p>
</article>`,
      text: "Hacker News. A social news website focusing on computer science, technology, and entrepreneurship, run by Y Combinator. Top stories include discussions on distributed systems, new programming languages, and startup launches.",
    },
  ];

  for (const s of samples) {
    const site = await db.site.create({
      data: {
        url: s.url,
        domain: s.domain,
        title: s.title,
        description: s.description,
        favicon: s.favicon,
        createdAt: s.createdAt,
        lastArchivedAt: s.capturedAt,
      },
    });

    await db.snapshot.create({
      data: {
        siteId: site.id,
        capturedAt: s.capturedAt,
        title: s.snapshotTitle,
        excerpt: s.excerpt,
        html: s.html,
        text: s.text,
        status: "success",
        contentLength: s.contentLength,
        publishedTime: s.publishedTime,
        captureMs: s.captureMs,
      },
    });

    // Add a second (older) snapshot to one of the sites so the timeline view
    // shows multiple captures.
    if (s.domain === "en.wikipedia.org") {
      await db.snapshot.create({
        data: {
          siteId: site.id,
          capturedAt: new Date(now - 5 * day),
          title: "Web archiving — Wikipedia (earlier capture)",
          excerpt:
            "An earlier capture showing the same article before recent edits.",
          html: `<article>
  <h1>Web archiving</h1>
  <p>Web archiving is the process of collecting portions of the World Wide Web to ensure the information is preserved for future researchers.</p>
</article>`,
          text: "Web archiving is the process of collecting portions of the World Wide Web.",
          status: "success",
          contentLength: 412,
          publishedTime: null,
          captureMs: 728,
        },
      });
    }
  }
}
