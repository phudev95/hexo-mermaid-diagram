const cheerio = require("cheerio");
const fs = require("fs");
const path = require("path");

// Copy iframe template to public directory after generation
hexo.extend.filter.register("after_generate", function () {
  const publicDir = this.public_dir;
  const templatePath = path.join(__dirname, "assets", "mermaid-iframe-template.html");
  const targetPath = path.join(publicDir, "mermaid-iframe.html");

  // Ensure public directory exists
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  // Copy template file
  fs.copyFileSync(templatePath, targetPath);
});

// Register markdown renderer to handle ```mermaid syntax
// Set high priority (9) to ensure execution before other plugins
hexo.extend.filter.register(
  "before_post_render",
  function (data) {
    const config = this.config.mermaid_diagram || {};

    if (data.content) {
      // Convert ```mermaid code blocks to <pre class="mermaid">
      data.content = data.content.replace(
        /```mermaid\s*\n([\s\S]*?)\n```/g,
        function (match, code) {
          const trimmedCode = code.trim();
          return `<pre class="mermaid">${escapeHtml(trimmedCode)}</pre>`;
        }
      );
    }

    return data;
  },
  9
);

// Register plugin
hexo.extend.filter.register(
  "after_render:html",
  function (htmlContent) {
    const config = this.config.mermaid_diagram || {};
    const version = config.version || "11.12.2";
    const theme = config.theme || "default";

    // Parse HTML
    const $ = cheerio.load(htmlContent);

    // Find all mermaid code blocks (including ```mermaid syntax)
    const mermaidBlocks = $(
      "pre code.language-mermaid, pre code.mermaid, pre.mermaid"
    );

    if (mermaidBlocks.length === 0) {
      return htmlContent;
    }

    let hasInjectedStyles = false;

    mermaidBlocks.each((mermaidIndex, element) => {
      const $element = $(element);
      let $preElement, mermaidCode;

      // Check if already processed
      if ($element.closest(`.mermaid-diagram-container`).length > 0) {
        return; // Skip if inside container
      }

      // Handle different mermaid code block formats
      if ($element.hasClass("mermaid")) {
        // Handle <pre class="mermaid"> format
        $preElement = $element;
        mermaidCode = $element.text().trim();
      } else {
        // Handle <pre><code class="language-mermaid"> format
        $preElement = $element.parent("pre");
        mermaidCode = $element.text().trim();
      }

      if (!mermaidCode) return;

      // Create container element
      const containerHtml = `
      <div class="mermaid-diagram-container" data-index="${mermaidIndex}">
        <div class="mermaid-diagram-wrapper">
          <!-- Original code for non-JavaScript environments -->
          <details class="mermaid-diagram-fallback">
            <summary>View Mermaid diagram code</summary>
            <pre><code class="language-mermaid">${escapeHtml(
              mermaidCode
            )}</code></pre>
          </details>

          <!-- iframe container, displayed in JavaScript environments -->
          <div class="mermaid-diagram-iframe-container" style="display: none;">
            <!-- Grid control panel -->
            <div class="mermaid-viewer-grid-panel">
              <div class="grid-row">
                <div class="empty-cell"></div>
                <button class="btn up" aria-label="Pan up">
                  <svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-chevron-up" aria-hidden="true">
                    <path d="M3.22 10.53a.749.749 0 0 1 0-1.06l4.25-4.25a.749.749 0 0 1 1.06 0l4.25 4.25a.749.749 0 1 1-1.06 1.06L8 6.811 4.28 10.53a.749.749 0 0 1-1.06 0Z"></path>
                  </svg>
                </button>
                <button class="btn zoom-in" aria-label="Zoom in">
                  <svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-zoom-in" aria-hidden="true">
                    <path d="M3.75 7.5a.75.75 0 0 1 .75-.75h2.25V4.5a.75.75 0 0 1 1.5 0v2.25h2.25a.75.75 0 0 1 0 1.5H8.25v2.25a.75.75 0 0 1-1.5 0V8.25H4.5a.75.75 0 0 1-.75-.75Z"></path>
                    <path d="M7.5 0a7.5 7.5 0 0 1 5.807 12.247l2.473 2.473a.749.749 0 1 1-1.06 1.06l-2.473-2.473A7.5 7.5 0 1 1 7.5 0Zm-6 7.5a6 6 0 1 0 12 0 6 6 0 0 0-12 0Z"></path>
                  </svg>
                </button>
              </div>
              <div class="grid-row">
                <button class="btn left" aria-label="Pan left">
                  <svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-chevron-left" aria-hidden="true">
                    <path d="M9.78 12.78a.75.75 0 0 1-1.06 0L4.47 8.53a.75.75 0 0 1 0-1.06l4.25-4.25a.751.751 0 0 1 1.042.018.751.751 0 0 1 .018 1.042L6.06 8l3.72 3.72a.75.75 0 0 1 0 1.06Z"></path>
                  </svg>
                </button>
                <button class="btn reset" aria-label="Reset view">
                  <svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-sync" aria-hidden="true">
                    <path d="M1.705 8.005a.75.75 0 0 1 .834.656 5.5 5.5 0 0 0 9.592 2.97l-1.204-1.204a.25.25 0 0 1 .177-.427h3.646a.25.25 0 0 1 .25.25v3.646a.25.25 0 0 1-.427.177l-1.38-1.38A7.002 7.002 0 0 1 1.05 8.84a.75.75 0 0 1 .656-.834ZM8 2.5a5.487 5.487 0 0 0-4.131 1.869l1.204 1.204A.25.25 0 0 1 4.896 6H1.25A.25.25 0 0 1 1 5.75V2.104a.25.25 0 0 1 .427-.177l1.38 1.38A7.002 7.002 0 0 1 14.95 7.16a.75.75 0 0 1-1.49.178A5.5 5.5 0 0 0 8 2.5Z"></path>
                  </svg>
                </button>
                <button class="btn right" aria-label="Pan right">
                  <svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-chevron-right" aria-hidden="true">
                    <path d="M6.22 3.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042L9.94 8 6.22 4.28a.75.75 0 0 1 0-1.06Z"></path>
                  </svg>
                </button>
              </div>
              <div class="grid-row">
                <div class="empty-cell"></div>
                <button class="btn down" aria-label="Pan down">
                  <svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-chevron-down" aria-hidden="true">
                    <path d="M12.78 5.22a.749.749 0 0 1 0 1.06l-4.25 4.25a.749.749 0 0 1-1.06 0L3.22 6.28a.749.749 0 1 1 1.06-1.06L8 8.939l3.72-3.719a.749.749 0 0 1 1.06 0Z"></path>
                  </svg>
                </button>
                <button class="btn zoom-out" aria-label="Zoom out">
                  <svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-zoom-out" aria-hidden="true">
                    <path d="M4.5 6.75h6a.75.75 0 0 1 0 1.5h-6a.75.75 0 0 1 0-1.5Z"></path>
                    <path d="M0 7.5a7.5 7.5 0 1 1 13.307 4.747l2.473 2.473a.749.749 0 1 1-1.06 1.06l-2.473-2.473A7.5 7.5 0 0 1 0 7.5Zm7.5-6a6 6 0 1 0 0 12 6 6 0 0 0 0-12Z"></path>
                  </svg>
                </button>
              </div>
            </div>

            <iframe
              class="mermaid-diagram-iframe"
              src="${config.root || '/'}mermaid-iframe.html"
              data-mermaid-code="${escapeHtml(mermaidCode)}"
              data-mermaid-theme="${theme}"
              data-mermaid-index="${mermaidIndex}"
              frameborder="0"
              scrolling="no"
              loading="lazy">
            </iframe>
          </div>
        </div>
      </div>
    `;

      // Replace original pre element
      $preElement.replaceWith(containerHtml);

      // Inject styles (only once)
      if (!hasInjectedStyles) {
        injectStyles($, config);
        hasInjectedStyles = true;
      }
    });

    // Inject JavaScript logic
    if (mermaidBlocks.length > 0) {
      injectScript($, config);
    }

    return $.html();
  },
  8
);

/**
 * Escape HTML characters
 */
function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Inject styles
 */
function injectStyles($, config) {
  const cssCdn = config.css_cdn;

  if (cssCdn) {
    // Use CDN with preload
    $("head").append(
      `<link rel="preload" as="style" onload="this.onload=null;this.rel='stylesheet'" href="${cssCdn}">`
    );
    // Add noscript fallback for browsers without JavaScript
    $("head").append(`<noscript><link rel="stylesheet" href="${cssCdn}"></noscript>`);
  } else {
    // Inject inline styles from separate file
    const cssPath = path.join(__dirname, "assets", "mermaid-diagram.css");
    const styleContent = fs.readFileSync(cssPath, "utf8");

    $("head").append(`<style>${styleContent}</style>`);
  }
}

/**
 * Inject JavaScript logic
 */
function injectScript($, config) {
  const jsCdn = config.js_cdn;
  const version = config.version || "11.12.2";

  // Inject Mermaid library on parent page (loaded once, shared by all iframes)
  $("head").append(`<script src="https://cdn.jsdelivr.net/npm/mermaid@${version}/dist/mermaid.min.js" defer></script>`);

  if (jsCdn) {
    // Use CDN with defer
    $("head").append(`<script src="${jsCdn}" defer></script>`);
  } else {
    // Inject inline script from separate file
    const jsPath = path.join(__dirname, "assets", "mermaid-diagram.js");
    const scriptContent = fs.readFileSync(jsPath, "utf8");

    $("body").append(`<script>${scriptContent}</script>`);
  }
}
