const { McpServer } = require("@modelcontextprotocol/sdk/server/mcp.js");
const { SSEServerTransport } = require("@modelcontextprotocol/sdk/server/sse.js");
const express = require("express");
const { z } = require("zod");
const WooCommerceRestApi = require("@woocommerce/woocommerce-rest-api").default;
const app = express();
const woo = new WooCommerceRestApi({ url: "https://edtutoriais.com.br", consumerKey: "ck_726e4b4e10a2e59e0230e89886ee5389bc82f0a4", consumerSecret: "cs_ab8c17e5b42654afd55b4a8688a75f20d6364bb8", version: "wc/v3" });
function createServer() {
  const s = new McpServer({ name: "woocommerce", version: "1.0.0" });
  s.tool("list_orders", {}, async () => { const { data } = await woo.get("orders", { per_page: 20 }); return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] }; });
  s.tool("list_products", {}, async () => { const { data } = await woo.get("products", { per_page: 20 }); return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] }; });
  s.tool("get_order", { id: z.number().describe("ID do pedido") }, async ({ id }) => { const { data } = await woo.get("orders/" + id); return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] }; });
  return s;
}
app.get("/", (req, res) => { res.json({ name: "WooCommerce MCP", version: "1.0.0" }); });
app.get("/authorize", (req, res) => { const r = req.query.redirect_uri || "/"; res.redirect(r + (r.includes("?") ? "&" : "?") + "code=noauth"); });
app.post("/token", express.json(), (req, res) => { res.json({ access_token: "noauth", token_type: "bearer", expires_in: 86400 }); });
app.get("/sse", async (req, res) => { res.setHeader("Content-Type", "text/event-stream"); res.setHeader("Cache-Control", "no-cache"); res.setHeader("Connection", "keep-alive"); const server = createServer(); const transport = new SSEServerTransport("/messages", res); res.on("close", () => transport.close()); await server.connect(transport); });
app.post("/messages", express.json(), async (req, res) => { res.status(200).end(); });
app.listen(9001, () => console.log("MCP WooCommerce porta 9001"));
