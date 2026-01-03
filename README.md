# Hexo Mermaid Diagram Plugin

仿照 GitHub 的实现方式，使用 iframe 渲染 Mermaid 图表

支持以下特性：

- 放大/缩小图表
- 上下左右移动
- 设置主题 (WIP: Dark/light mode support)

## Preview

![image](https://github.com/user-attachments/assets/d8144401-5de3-47c5-a75c-59348532b598)

## 安装

```bash
npm install hexo-mermaid-diagram --save
```

## 使用方法

安装插件后，你可以在 Markdown 文件中直接使用 mermaid 代码块：

````markdown
​`mermaid
graph TD
    A[Hard] -->|Text| B(Round)
    B --> C{Decision}
    C -->|One| D[Result 1]
    C -->|Two| E[Result 2]
​`
````

## 配置

在 Hexo 的 `_config.yml` 中添加配置：

```yaml
mermaid_diagram:
  # Mermaid.js 版本
  version: "11.12.2"
  # 主题配置
  theme: "default"
  # 自定义 CSS 类名
  class_name: "mermaid-diagram"
```

## 工作原理

本插件参考 GitHub 的实现方案：

1. **HTML 管道过滤器**: 扫描渲染后的 HTML，查找带有 `mermaid` 语言标识的代码块
2. **渐进式模板**: 替换为支持渐进增强的模板，在非 JavaScript 环境中显示原始代码
3. **iframe 注入**: 在支持 JavaScript 的环境中，注入指向渲染服务的 iframe
4. **安全隔离**: 用户内容在 iframe 中渲染，与主页面隔离

## 开发

```bash
# 克隆仓库
git clone https://github.com/your-username/hexo-mermaid-diagram.git
cd hexo-mermaid-diagram

# 安装依赖
npm install

# 链接到本地 Hexo 项目进行测试
npm link
cd /path/to/your/hexo/blog
npm link hexo-mermaid-diagram
```

## 许可证

MIT
