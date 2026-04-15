const BASE = "https://meow-web-hrgz.onrender.com";

export default async function handler(req, res) {
  try {
    const url = new URL(req.url, BASE);
    const target = BASE + url.pathname + url.search;

    // Build headers (lọc bớt header gây lỗi)
    const headers = {};
    for (const [k, v] of Object.entries(req.headers)) {
      const key = k.toLowerCase();
      if (["host", "connection", "content-length"].includes(key)) continue;
      headers[key] = v;
    }
    headers["host"] = new URL(BASE).host;
    headers["x-forwarded-host"] = req.headers.host || "";
    headers["x-forwarded-proto"] = "https";

    // Lấy body nếu có (POST/PUT/PATCH)
    let body = undefined;
    if (!["GET", "HEAD"].includes(req.method)) {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      body = Buffer.concat(chunks);
    }

    const resp = await fetch(target, {
      method: req.method,
      headers,
      body,
      redirect: "manual"
    });

    // ===== Forward status =====
    res.status(resp.status);

    // ===== Forward headers (đặc biệt là cookie + location) =====
    resp.headers.forEach((value, key) => {
      const k = key.toLowerCase();

      if (k === "set-cookie") {
        // Sửa cookie domain -> domain Vercel để lưu được
        const fixed = value
          .replace(/Domain=[^;]+/i, `Domain=${req.headers.host}`)
          .replace(/SameSite=Lax/gi, "SameSite=None; Secure");
        res.setHeader("set-cookie", fixed);
        return;
      }

      if (k === "location") {
        // Rewrite redirect về domain Vercel
        const loc = value.replace(BASE, `https://${req.headers.host}`);
        res.setHeader("location", loc);
        return;
      }

      // bỏ vài header dễ gây lỗi
      if (["content-encoding", "transfer-encoding", "content-length"].includes(k)) return;

      res.setHeader(key, value);
    });

    const contentType = resp.headers.get("content-type") || "";

    // ===== JSON/API =====
    if (contentType.includes("application/json")) {
      const data = await resp.json();
      return res.json(data);
    }

    // ===== HTML (fix asset + domain) =====
    if (contentType.includes("text/html")) {
      let text = await resp.text();

      text = text
        .replaceAll(BASE, `https://${req.headers.host}`)
        .replaceAll('href="/', `href="${BASE}/`)
        .replaceAll('src="/', `src="${BASE}/`)
        .replaceAll("url(/", `url(${BASE}/`);

      return res.send(text);
    }

    // ===== File khác (ảnh, font, ...) =====
    const buffer = Buffer.from(await resp.arrayBuffer());
    return res.send(buffer);

  } catch (err) {
    return res.status(500).send("Proxy error: " + err.toString());
  }
}
