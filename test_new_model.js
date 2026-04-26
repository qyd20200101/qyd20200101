#!/usr/bin/env node

const http = require("http");

const testConfig = {
  apiKey: "sk-Y4kbFOcVipkM86lSHIG1UMmqy0Ms6gfd86d6vXbhxDXxwbCK",
  model: "claude-opus-4-6",
};

console.log("🧪 测试新模型配置...\n");
console.log(`模型: ${testConfig.model}\n`);

const testPayload = JSON.stringify({
  model: testConfig.model,
  messages: [
    {
      role: "user",
      content: "Say hello in one word",
    },
  ],
  max_tokens: 20,
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
  timeout: 15000,
};

const req = http.request(options, (res) => {
  let data = "";

  res.on("data", (chunk) => {
    data += chunk;
  });

  res.on("end", () => {
    console.log(`✓ 响应状态码: ${res.statusCode}`);

    if (res.statusCode === 200) {
      console.log("✅ 模型测试成功！\n");
      try {
        const response = JSON.parse(data);
        console.log("响应内容:");
        console.log(JSON.stringify(response, null, 2));
      } catch (e) {
        console.log(data);
      }
    } else if (res.statusCode === 429) {
      console.log("⚠️  状态码 429 - 速率限制\n");
      console.log(data);
    } else {
      console.log(`⚠️  其他状态 ${res.statusCode}\n`);
      console.log(data);
    }
  });
});

req.on("error", (error) => {
  console.log(`❌ 错误: ${error.message}`);
});

req.on("timeout", () => {
  console.log("❌ 请求超时");
  req.destroy();
});

req.write(testPayload);
req.end();
