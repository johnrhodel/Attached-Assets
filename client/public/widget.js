(function() {
  // Memories Widget Script
  // Usage: <script src="https://.../widget.js" data-project-id="1" data-location-id="1"></script>
  
  const script = document.currentScript;
  const projectId = script.getAttribute('data-project-id');
  const locationId = script.getAttribute('data-location-id');
  
  if (!locationId) {
    console.error('Memories Widget: location-id is required');
    return;
  }

  const BASE_URL = new URL(script.src).origin;
  const iframeUrl = `${BASE_URL}/embed?locationId=${locationId}`;

  // Create Modal Container
  const container = document.createElement('div');
  container.id = 'memories-widget-container';
  container.style.position = 'fixed';
  container.style.top = '0';
  container.style.left = '0';
  container.style.width = '100%';
  container.style.height = '100%';
  container.style.zIndex = '9999';
  container.style.backgroundColor = 'rgba(0,0,0,0.5)';
  container.style.display = 'none'; // Hidden by default
  container.style.alignItems = 'center';
  container.style.justifyContent = 'center';

  // Create Iframe
  const iframe = document.createElement('iframe');
  iframe.src = iframeUrl;
  iframe.style.width = '90%';
  iframe.style.maxWidth = '400px';
  iframe.style.height = '80%';
  iframe.style.maxHeight = '700px';
  iframe.style.border = 'none';
  iframe.style.borderRadius = '12px';
  iframe.style.backgroundColor = 'white';

  // Close Button
  const closeBtn = document.createElement('button');
  closeBtn.innerText = '×';
  closeBtn.style.position = 'absolute';
  closeBtn.style.top = '10px';
  closeBtn.style.right = '10px';
  closeBtn.style.background = 'white';
  closeBtn.style.border = 'none';
  closeBtn.style.borderRadius = '50%';
  closeBtn.style.width = '30px';
  closeBtn.style.height = '30px';
  closeBtn.style.cursor = 'pointer';
  closeBtn.onclick = () => {
    container.style.display = 'none';
  };

  container.appendChild(iframe);
  iframe.onload = () => {
    // iframe.contentWindow.postMessage({ type: 'INIT', projectId, locationId }, '*');
  };
  
  // Only append close button if we want it outside the iframe. 
  // Often better to handle closing from within, but for a generic script, overlay close is safer.
  // container.appendChild(closeBtn); 

  // Click outside to close
  container.onclick = (e) => {
    if (e.target === container) {
      container.style.display = 'none';
    }
  };

  document.body.appendChild(container);

  // Expose global method to open
  window.Memories = {
    open: () => {
      container.style.display = 'flex';
    }
  };

  // Optional: Auto-inject a trigger button if requested?
  // For now, we assume the host site calls window.Memories.open() or we provide a button.
  
})();
