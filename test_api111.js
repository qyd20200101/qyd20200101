#!/usr/bin/env node

/**
 * 测试 api111 模型连接
 */

const http = require("http");

const testConfig = {
  baseUrl: "http://dayali.top/v1",
  apiKey: "sk-Y4kbFOcVipkM86lSHIG1UMmqy0Ms6gfd86d6vXbhxDXxwbCK",
  model: "gpt-5-codex",
};

console.log("🔍 测试 api111 模型配置...\n");
console.log("配置信息:");
console.log(`  - Base URL: ${testConfig.baseUrl}`);
console.log(`  - Model: ${testConfig.model}`);
console.log(
  `  - API Key: ${testConfig.apiKey.substring(0, 10)}...${testConfig.apiKey.substring(-5)}\n`,
);

// 测试 1: 验证 API Key 格式
console.log("✓ 测试 1: 验证 API Key 格式");
if (testConfig.apiKey.startsWith("sk-")) {
  console.log("  ✅ API Key 格式正确（以 sk- 开头）\n");
} else {
  console.log("  ❌ API Key 格式错误\n");
}

// 测试 2: 测试 HTTP 连接
console.log("✓ 测试 2: 测试与 api111 服务的连接...");

const testPayload = JSON.stringify({
  model: testConfig.model,
  messages: [
    {
      role: "user",
      content: "Hello, test connection",
    },
  ],
  max_tokens: 100,
});

const options = {
  hostname: "dayali.top",
  port: 80,
  path: "/v1/chat/completions",
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${testConfig.apiKey}`,
    "Content-Length": Buffer.byteLength(testPayload),
  },
  timeout: 10000,
};

const req = http.request(options, (res) => {
  let data = "";

  res.on("data", (chunk) => {
    data += chunk;
  });

  res.on("end", () => {
    console.log(`\n  响应状态码: ${res.statusCode}`);
    console.log(`  响应头: ${JSON.stringify(res.headers, null, 2)}`);

    if (res.statusCode === 200) {
      console.log("  ✅ 连接成功！");
      console.log(`  响应内容: ${data.substring(0, 200)}...\n`);
    } else if (res.statusCode === 429) {
      console.log("  ⚠️  返回 429 - 触发速率限制");
      console.log("  完整错误响应:");
      try {
        console.log(JSON.stringify(JSON.parse(data), null, 2));
      } catch (e) {
        console.log(data);
      }
      console.log("  建议: 检查请求频率或联系 API 提供商\n");
    } else if (res.statusCode === 401) {
      console.log("  ❌ 返回 401 - 认证失败");
      console.log("  建议: 检查 API Key 是否有效\n");
    } else {
      console.log(`  ⚠️  返回状态码 ${res.statusCode}`);
      console.log(`  响应: ${data}\n`);
    }
  });
});

req.on("error", (error) => {
  console.log(`  ❌ 连接失败: ${error.message}\n`);
  console.log("  故障排查:");
  console.log("    - 检查网络连接");
  console.log("    - 检查 Base URL 是否正确");
  console.log("    - 检查防火墙设置\n");
});

req.on("timeout", () => {
  console.log("  ❌ 连接超时（10秒）");
  console.log("  建议: 检查 API 服务是否在线\n");
  req.destroy();
});

req.write(testPayload);
req.end();
