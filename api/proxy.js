export default async function handler(req, res) {
  const base = "https://meow-web-hrgz.onrender.com";
  const targetUrl = base + req.url;

  try {
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        ...req.headers,
        host: "meow-web-hrgz.onrender.com"
      }
    });

    let body = await response.text();

    // FIX TOÀN BỘ LINK RELATIVE → ABSOLUTE
    body = body
      .replaceAll('href="/', `href="${base}/`)
      .replaceAll('src="/', `src="${base}/`)
      .replaceAll("url(/", `url(${base}/`);

    res.status(response.status).send(body);

  } catch (err) {
    res.status(500).send("Proxy error");
  }
}
