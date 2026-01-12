(function() {
  // Check for JavaScript support
  const containers = document.querySelectorAll('.mermaid-diagram-container');

  containers.forEach((container, mermaidContainerIndex) => {
    const fallback = container.querySelector('.mermaid-diagram-fallback');
    const iframeContainer = container.querySelector('.mermaid-diagram-iframe-container');
    const iframe = container.querySelector('.mermaid-diagram-iframe');

    if (fallback && iframeContainer && iframe) {
      // Hide fallback, show iframe
      fallback.style.display = 'none';
      iframeContainer.style.display = 'block';

      // Listen for iframe messages
      const messageHandler = function(event) {
        if (event.data && event.data.type === 'mermaid-resize' && mermaidContainerIndex === event.data.mermaidIndex) {
          iframe.style.height = event.data.height + 'px';
        } else if (event.data && event.data.type === 'mermaid-iframe-ready' && event.source === iframe.contentWindow) {
          // Send diagram data to iframe once it's ready (only if message is from THIS iframe)
          const code = iframe.getAttribute('data-mermaid-code');
          const theme = iframe.getAttribute('data-mermaid-theme');
          const index = iframe.getAttribute('data-mermaid-index');

          if (code && iframe.contentWindow) {
            iframe.contentWindow.postMessage({
              type: 'mermaid-init',
              code: code,
              theme: theme || 'default',
              index: parseInt(index) || 0
            }, '*');
          }
        }
      };

      window.addEventListener('message', messageHandler);

      // Add loading state
      const loadingDiv = document.createElement('div');
      loadingDiv.className = 'mermaid-diagram-loading';
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
