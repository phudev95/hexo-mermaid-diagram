const fs = require("fs");
const path = require("path");

// 模拟 Hexo 环境的简单测试
function testMermaidPlugin() {
  // 模拟 hexo 对象
  const hexo = {
    config: {
      mermaid_diagram: {
        version: "11.12.2",
        theme: "default",
        class_name: "mermaid-diagram",
      },
    },
    extend: {
      filter: {
        _filters: {
          before_post_render: [],
          "after_render:html": [],
        },
        register: function (event, callback) {
          console.log(`注册过滤器: ${event}`);

          // 存储过滤器回调
          if (!this._filters[event]) {
            this._filters[event] = [];
          }
          this._filters[event].push(callback);

          // 如果是第一次加载插件，执行测试
          if (
            event === "after_render:html" &&
            this._filters["after_render:html"].length === 1
          ) {
            this.runTest();
          }
        },
        runTest: function () {
          // 模拟 Markdown 输入，测试 before_post_render 过滤器
          const testMarkdown = `
# 测试页面

下面是一个 mermaid 流程图：

\`\`\`mermaid
graph TD
    A[Hard] -->|Text| B(Round)
    B --> C{Decision}
    C -->|One| D[Result 1]
    C -->|Two| E[Result 2]
\`\`\`

这是另一个序列图：

\`\`\`mermaid
sequenceDiagram
    participant Alice
    participant Bob
    Alice->>Bob: Hello Bob, how are you?
    Bob-->>Alice: Great!
\`\`\`

结束
          `;

          // 先通过 before_post_render 处理 markdown
          const postData = { content: testMarkdown };
          let processedData = postData;

          // 执行 before_post_render 过滤器
          const beforeFilters = this._filters["before_post_render"];
          if (beforeFilters.length > 0) {
            processedData = beforeFilters[0].call(hexo, postData);
          }

          // 然后模拟经过 markdown 渲染后的 HTML
          const testHtml = `
            <html>
            <head><title>Test</title></head>
            <body>
              <h1>测试页面</h1>
              <p>下面是一个 mermaid 流程图：</p>
              ${processedData.content}
              <p>结束</p>
            </body>
            </html>
          `;

          // 执行 after_render:html 过滤器
          const afterFilters = this._filters["after_render:html"];
          let result = testHtml;
          if (afterFilters.length > 0) {
            result = afterFilters[0].call(hexo, testHtml);
          }

          // 输出结果到文件
          fs.writeFileSync(
            path.join(__dirname, "after_render.html"),
            result,
            "utf-8"
          );

          console.log("测试完成，结果已保存到 after_render.html");
          console.log(
            "原始 mermaid 代码块数量:",
            (processedData.content.match(/```mermaid/g) || []).length
          );
          console.log(
            "转换后的容器数量:",
            (result.match(/mermaid-diagram-container/g) || []).length
          );
        },
      },
    },
  };

  // 加载插件
  global.hexo = hexo;
  require("../index.js");
}

// 如果直接运行此文件，执行测试
if (require.main === module) {
  testMermaidPlugin();
}
