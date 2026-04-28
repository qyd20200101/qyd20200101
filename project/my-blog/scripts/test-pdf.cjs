const fs = require('fs');
const pdf = require('pdf-parse/lib/pdf-parse.js');

async function test() {
  const filePath = 'knowledge/raw/books/JavaScript高级程序设计（第4版）.pdf';
  if (!fs.existsSync(filePath)) {
    console.log('文件不存在');
    return;
  }
  const dataBuffer = fs.readFileSync(filePath);
  try {
    const data = await pdf(dataBuffer);
    console.log('--- PDF 探测结果 ---');
    console.log('页数:', data.numpages);
    console.log('文本长度:', data.text.length);
    console.log('前 1000 个字符:', data.text.substring(0, 1000).replace(/\n/g, ' '));
  } catch (err) {
    console.error('解析出错:', err.message);
  }
}

test();
