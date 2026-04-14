export default async function handler(req, res) {
  const base = "https://meow-web-hrgz.onrender.com";
  const targetUrl = base + req.url;

  try {
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        "User-Agent": req.headers["user-agent"] || "",
        "Content-Type": req.headers["content-type"] || ""
      }
    });

    let body = await response.text();

    // Fix link asset để không lộ Render
    body = body.replaceAll(
      "https://meow-web-hrgz.onrender.com",
      "https://your-domain.vercel.app"
    );

    res.status(response.status);
    res.send(body);

  } catch (err) {
    res.status(500).send("Proxy error: " + err.toString());
  }
}
