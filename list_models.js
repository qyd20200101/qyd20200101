#!/usr/bin/env node

const http = require("http");

const testConfig = {
  apiKey: "sk-Y4kbFOcVipkM86lSHIG1UMmqy0Ms6gfd86d6vXbhxDXxwbCK",
};

console.log("🔍 查询 api111 可用的模型列表...\n");

const options = {
  hostname: "dayali.top",
  port: 80,
  path: "/v1/models",
  method: "GET",
  headers: {
    Authorization: `Bearer ${testConfig.apiKey}`,
  },
  timeout: 10000,
};

const req = http.request(options, (res) => {
  let data = "";

  res.on("data", (chunk) => {
    data += chunk;
  });

  res.on("end", () => {
    console.log(`响应状态码: ${res.statusCode}\n`);

    if (res.statusCode === 200) {
      try {
        const models = JSON.parse(data);
        console.log("✅ 可用的模型列表:\n");

        if (models.data && Array.isArray(models.data)) {
          models.data.forEach((model, index) => {
            console.log(`  ${index + 1}. ${model.id}`);
            if (model.owned_by) console.log(`     提供商: ${model.owned_by}`);
          });
        } else {
          console.log(JSON.stringify(models, null, 2));
        }
      } catch (e) {
        console.log("原始响应:");
        console.log(data);
      }
    } else {
      console.log("❌ 获取模型列表失败");
      console.log(`响应: ${data}`);
    }
  });
});

req.on("error", (error) => {
  console.log(`❌ 连接失败: ${error.message}`);
});

req.on("timeout", () => {
  console.log("❌ 连接超时");
  req.destroy();
});

req.end();
