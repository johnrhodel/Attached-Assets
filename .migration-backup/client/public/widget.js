(function() {
  // Mintoria Widget Script
  // Usage: <script src="https://.../widget.js" data-project-id="1" data-location-id="1"></script>
  
  var script = document.currentScript;
  var locationId = script.getAttribute('data-location-id');
  
  if (!locationId) {
    console.error('Mintoria Widget: data-location-id is required');
    return;
  }

  var BASE_URL = new URL(script.src).origin;
  var iframeUrl = BASE_URL + '/embed/' + locationId;

  var container = document.createElement('div');
  container.id = 'mintoria-widget-container';
  container.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:99999;background:rgba(0,0,0,0.6);display:none;align-items:center;justify-content:center;backdrop-filter:blur(4px);';

  var wrapper = document.createElement('div');
  wrapper.style.cssText = 'position:relative;width:90%;max-width:400px;height:auto;max-height:80vh;';

  var iframe = document.createElement('iframe');
  iframe.src = iframeUrl;
  iframe.style.cssText = 'width:100%;height:600px;max-height:80vh;border:none;border-radius:12px;background:white;box-shadow:0 25px 50px -12px rgba(0,0,0,0.25);';

  var closeBtn = document.createElement('button');
  closeBtn.innerHTML = '&times;';
  closeBtn.style.cssText = 'position:absolute;top:-12px;right:-12px;background:#fff;border:1px solid #e5e7eb;border-radius:50%;width:32px;height:32px;cursor:pointer;font-size:18px;line-height:1;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.15);z-index:1;';
  closeBtn.onclick = function() {
    container.style.display = 'none';
  };

  wrapper.appendChild(closeBtn);
  wrapper.appendChild(iframe);
  container.appendChild(wrapper);

  container.onclick = function(e) {
    if (e.target === container) {
      container.style.display = 'none';
    }
  };

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      container.style.display = 'none';
    }
  });

  document.body.appendChild(container);

  window.Mintoria = {
    open: function() {
      container.style.display = 'flex';
    },
    close: function() {
      container.style.display = 'none';
    }
  };
})();
