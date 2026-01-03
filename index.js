const cheerio = require("cheerio");

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
    const className = config.class_name || "mermaid-diagram";

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
      if ($element.closest(`.${className}-container`).length > 0) {
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
      <div class="${className}-container" data-index="${mermaidIndex}">
        <div class="${className}-wrapper">
          <!-- Original code for non-JavaScript environments -->
          <details class="${className}-fallback">
            <summary>View Mermaid diagram code</summary>
            <pre><code class="language-mermaid">${escapeHtml(
              mermaidCode
            )}</code></pre>
          </details>

          <!-- iframe container, displayed in JavaScript environments -->
          <div class="${className}-iframe-container" style="display: none;">
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
              class="${className}-iframe"
              src="data:text/html;charset=utf-8,${encodeURIComponent(
                generateMermaidHTML(mermaidCode, theme, version, mermaidIndex)
              )}"
              frameborder="0"
              scrolling="no"
              sandbox="allow-scripts"
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
        injectStyles($, className);
        hasInjectedStyles = true;
      }
    });

    // Inject JavaScript logic
    if (mermaidBlocks.length > 0) {
      injectScript($, className);
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
 * Generate HTML content for Mermaid iframe
 */
function generateMermaidHTML(mermaidCode, theme, version, mermaidIndex) {
  return `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Mermaid Diagram</title>
    <script src="https://cdn.jsdelivr.net/npm/mermaid@${version}/dist/mermaid.min.js"></script>
    <style>
        body {
            margin: 0;
            padding: 16px;
            font-family: Arial, sans-serif;
            background: transparent;
            overflow: hidden;
        }

        .mermaid {
            text-align: center;
            cursor: pointer;
            transform-origin: center;
            transition: transform 0.2s ease;
        }


        /* Responsive design */
        @media (max-width: 768px) {
            body {
                padding: 8px;
            }
        }
    </style>
</head>
<body>
    <div class="mermaid">${escapeHtml(mermaidCode)}</div>

    <script>
        // Configure Mermaid
        mermaid.initialize({
            startOnLoad: false,
            theme: '${theme}',
            securityLevel: 'strict',
            fontSize: 16,
            themeVariables: {
              fontFamily: 'Arial, sans-serif'
            },
            flowchart: {
                useMaxWidth: true,
                htmlLabels: true
            }
        });

        // Global variables
        let currentScale = 1;
        let currentTranslateX = 0;
        let currentTranslateY = 0;
        let diagramElement = null;

        // Apply transform
        function applyTransform() {
            if (diagramElement) {
                diagramElement.style.transform = \`scale(\${currentScale}) translate(\${currentTranslateX}px, \${currentTranslateY}px)\`;
            }
        }

        // Listen for messages from parent page
        window.addEventListener('message', function(event) {
            const { type, action } = event.data || {};

            if (type === 'mermaid-control') {
                switch (action) {
                    case 'zoom-in':
                        currentScale = Math.min(currentScale * 1.2, 3);
                        applyTransform();
                        break;
                    case 'zoom-out':
                        currentScale = Math.max(currentScale / 1.2, 0.5);
                        applyTransform();
                        break;
                    case 'reset':
                        currentScale = 1;
                        currentTranslateX = 0;
                        currentTranslateY = 0;
                        applyTransform();
                        break;
                    case 'pan-up':
                        currentTranslateY += 20;
                        applyTransform();
                        break;
                    case 'pan-down':
                        currentTranslateY -= 20;
                        applyTransform();
                        break;
                    case 'pan-left':
                        currentTranslateX += 20;
                        applyTransform();
                        break;
                    case 'pan-right':
                        currentTranslateX -= 20;
                        applyTransform();
                        break;
                }
            }
        });

        // Render diagram
        async function renderDiagram() {
            try {
                const elements = document.querySelectorAll('.mermaid');
                for (let i = 0; i < elements.length; i++) {
                    const element = elements[i];
                    const id = 'mermaid-' + i;
                    element.id = id;

                    const { svg } = await mermaid.render(id + '-svg', element.textContent);
                    element.innerHTML = svg;

                    // Set global reference
                    if (i === 0) {
                        diagramElement = element;
                    }
                }

                // Adjust iframe height
                setTimeout(() => {
                    const height = document.body.scrollHeight;
                    window.parent.postMessage({
                        type: 'mermaid-resize',
                        height: height,
                        mermaidIndex: ${mermaidIndex}
                    }, '*');
                }, 100);
            } catch (error) {
                console.error('Mermaid rendering error:', error);
                document.body.innerHTML = '<p style="color: red;">Failed to render diagram: ' + error.message + '</p>';
            }
        }

        // Start rendering
        renderDiagram();
    </script>
</body>
</html>`;
}

/**
 * Inject styles
 */
function injectStyles($, className) {
  const styleContent = `
    .${className}-container {
      margin: 1em 0;
      position: relative;
    }

    .${className}-wrapper {
      border: 1px solid #e1e4e8;
      border-radius: 6px;
      overflow: hidden;
      position: relative;
    }

    .${className}-fallback {
      padding: 16px;
      background-color: #f6f8fa;
    }

    .${className}-fallback summary {
      cursor: pointer;
      font-weight: 600;
      margin-bottom: 8px;
    }

    .${className}-fallback pre {
      margin: 0;
      background: #fff;
      border: 1px solid #e1e4e8;
      border-radius: 3px;
      padding: 12px;
      overflow: auto;
    }

    .${className}-iframe-container {
      position: relative;
      width: 100%;
      min-height: 200px;
    }

    .${className}-iframe {
      width: 100%;
      min-height: 200px;
      border: none;
      background: transparent;
    }

    /* Control panel styles */
    .mermaid-viewer-grid-panel {
      position: absolute;
      bottom: 8px;
      right: 8px;
      z-index: 10;
      opacity: 0;
      transition: opacity 0.2s ease;
      display: grid;
      grid-template-rows: repeat(3, 1fr);
      gap: 4px;
    }

    .${className}-wrapper:hover .mermaid-viewer-grid-panel {
      opacity: 1;
    }

    .mermaid-viewer-grid-panel .grid-row {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 4px;
    }

    .mermaid-viewer-grid-panel .empty-cell {
      width: 32px;
      height: 32px;
    }

    .mermaid-viewer-grid-panel .btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      background: rgba(255, 255, 255, 0.9);
      border: 1px solid #d0d7de;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s ease;
      backdrop-filter: blur(4px);
    }

    .mermaid-viewer-grid-panel .btn:hover {
      background: rgba(246, 248, 250, 0.95);
      border-color: #8c959f;
      transform: scale(1.05);
    }

    .mermaid-viewer-grid-panel .btn:active {
      transform: scale(0.95);
    }

    .mermaid-viewer-grid-panel .btn svg {
      fill: #656d76;
    }

    .mermaid-viewer-grid-panel .btn:hover svg {
      fill: #24292f;
    }

    /* Loading state */
    .${className}-loading {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 200px;
      color: #586069;
      font-style: italic;
    }

    /* Responsive design */
    @media (max-width: 768px) {
      .${className}-wrapper {
        border-radius: 3px;
      }

      .${className}-fallback {
        padding: 12px;
      }

      .mermaid-viewer-grid-panel {
        opacity: 1; /* Always show control buttons on mobile devices */
      }

      .mermaid-viewer-grid-panel .btn {
        width: 28px;
        height: 28px;
      }
    }
  `;

  $("head").append(`<style>${styleContent}</style>`);
}

/**
 * Inject JavaScript logic
 */
function injectScript($, className) {
  const scriptContent = `
    (function() {
      // Check for JavaScript support
      const containers = document.querySelectorAll('.${className}-container');

      containers.forEach((container, mermaidContainerIndex) => {
        const fallback = container.querySelector('.${className}-fallback');
        const iframeContainer = container.querySelector('.${className}-iframe-container');
        const iframe = container.querySelector('.${className}-iframe');

        if (fallback && iframeContainer && iframe) {
          // Hide fallback, show iframe
          fallback.style.display = 'none';
          iframeContainer.style.display = 'block';

          // Listen for iframe height adjustment messages
          const messageHandler = function(event) {
            if (event.data && event.data.type === 'mermaid-resize' && mermaidContainerIndex === event.data.mermaidIndex) {
              iframe.style.height = event.data.height + 'px';
            }
          };

          window.addEventListener('message', messageHandler);

          // Add loading state
          const loadingDiv = document.createElement('div');
          loadingDiv.className = '${className}-loading';
          loadingDiv.textContent = 'Loading diagram...';
          iframeContainer.appendChild(loadingDiv);

          // Remove loading state after iframe loads
          iframe.addEventListener('load', function() {
            if (loadingDiv.parentNode) {
              loadingDiv.parentNode.removeChild(loadingDiv);
            }
          });

          // Add event listeners for control buttons
          const gridPanel = container.querySelector('.mermaid-viewer-grid-panel');

          if (gridPanel) {
            gridPanel.addEventListener('click', function(e) {
              const button = e.target.closest('button');
              if (!button) return;

              let action = '';
              if (button.classList.contains('zoom-in')) {
                action = 'zoom-in';
              } else if (button.classList.contains('zoom-out')) {
                action = 'zoom-out';
              } else if (button.classList.contains('reset')) {
                action = 'reset';
              } else if (button.classList.contains('up')) {
                action = 'pan-up';
              } else if (button.classList.contains('down')) {
                action = 'pan-down';
              } else if (button.classList.contains('left')) {
                action = 'pan-left';
              } else if (button.classList.contains('right')) {
                action = 'pan-right';
              }

              if (action) {
                iframe.contentWindow.postMessage({
                  type: 'mermaid-control',
                  action: action
                }, '*');
              }
            });
          }
        }
      });
    })();
  `;

  $("body").append(`<script>${scriptContent}</script>`);
}
