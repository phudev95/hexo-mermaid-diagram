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
            <!-- Toggle button for controls -->
            <button class="mermaid-controls-toggle" aria-label="Toggle diagram controls">
              <svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-gear" aria-hidden="true">
                <path d="M8 0a8.2 8.2 0 0 1 .701.031C9.444.095 9.99.645 10.16 1.29l.288 1.107c.018.066.079.158.212.224.231.114.454.243.668.386.123.082.233.09.299.071l1.103-.303c.644-.176 1.392.021 1.82.63.27.385.506.792.704 1.218.315.675.111 1.422-.364 1.891l-.814.806c-.049.048-.098.147-.088.294.016.257.016.515 0 .772-.01.147.038.246.088.294l.814.806c.475.469.679 1.216.364 1.891a7.977 7.977 0 0 1-.704 1.217c-.428.61-1.176.807-1.82.63l-1.103-.303c-.066-.019-.176-.011-.299.071a4.49 4.49 0 0 1-.668.386c-.133.066-.194.158-.212.224l-.288 1.107c-.169.645-.715 1.195-1.459 1.26a8.006 8.006 0 0 1-1.402 0c-.744-.065-1.29-.615-1.459-1.26l-.288-1.107c-.018-.066-.079-.158-.212-.224a4.468 4.468 0 0 1-.668-.386c-.123-.082-.233-.09-.299-.071l-1.103.303c-.644.176-1.392-.021-1.82-.63a8.12 8.12 0 0 1-.704-1.218c-.315-.675-.111-1.422.363-1.891l.815-.806c.05-.048.098-.147.088-.294a6.214 6.214 0 0 1 0-.772c.01-.147-.038-.246-.088-.294l-.815-.806C.635 6.045.431 5.298.746 4.623a7.92 7.92 0 0 1 .704-1.217c.428-.61 1.176-.807 1.82-.63l1.102.302c.067.019.177.011.3-.071.214-.143.437-.272.668-.386.133-.066.194-.158.211-.224l.289-1.107C5.009.645 5.555.095 6.299.03 6.856.012 7.142 0 8 0Zm-.571 1.525c-.036.003-.108.036-.137.146l-.289 1.105c-.147.561-.549.967-.998 1.189-.173.086-.34.183-.5.29-.417.278-.97.423-1.529.27l-1.103-.303c-.109-.03-.175.016-.195.045-.22.312-.412.644-.573.99-.014.031-.021.11.059.19l.815.806c.411.406.562.957.53 1.456a4.709 4.709 0 0 0 0 .582c.032.499-.119 1.05-.53 1.456l-.815.806c-.081.08-.073.159-.059.19.162.346.353.677.573.989.02.03.085.076.195.046l1.102-.303c.56-.153 1.113-.008 1.53.27.161.107.328.204.501.29.447.222.85.629.997 1.189l.289 1.105c.029.109.101.143.137.146a6.6 6.6 0 0 0 1.142 0c.036-.003.108-.036.137-.146l.289-1.105c.147-.561.549-.967.998-1.189.173-.086.34-.183.5-.29.417-.278.97-.423 1.529-.27l1.103.303c.109.029.175-.016.195-.045.22-.313.411-.644.573-.99.014-.031.021-.11-.059-.19l-.815-.806c-.411-.406-.562-.957-.53-1.456a4.709 4.709 0 0 0 0-.582c-.032-.499.119-1.05.53-1.456l.815-.806c.081-.08.073-.159.059-.19a6.464 6.464 0 0 0-.573-.989c-.02-.03-.085-.076-.195-.046l-1.102.303c-.56.153-1.113.008-1.53-.27a4.44 4.44 0 0 0-.501-.29c-.447-.222-.85-.629-.997-1.189l-.289-1.105c-.029-.11-.101-.143-.137-.146a6.6 6.6 0 0 0-1.142 0ZM11 8a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM9.5 8a1.5 1.5 0 1 0-3.001.001A1.5 1.5 0 0 0 9.5 8Z"></path>
              </svg>
            </button>

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
