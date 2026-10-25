/* Runs before the 3D module so even an early graphics/script error is visible. */
(function () {
  var script = document.currentScript;
  var build = script.getAttribute('data-build') || 'development';
  var backend = script.getAttribute('data-backend') !== 'none';
  var id = Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
  var finished = false, failed = false, timer, stage = 'Starting the viewer';
  var title = document.getElementById('loading-title');
  var detail = document.getElementById('loading-detail');
  var retry = document.getElementById('retry-loading');
  var lastReport = '';
  function report(phase, error) {
    if (!backend) return;
    var key = phase + ':' + stage + ':' + (error || '');
    if (key === lastReport) return;
    lastReport = key;
    var payload = JSON.stringify({id:id, build:build, phase:phase, stage:stage, error:String(error || '').slice(0, 1800), browser:navigator.userAgent.slice(0, 350)});
    fetch('/api/client-status', {method:'POST', headers:{'Content-Type':'application/json'}, body:payload}).catch(function () {});
  }
  function fail(error) {
    if (failed) return;
    failed = true; clearTimeout(timer);
    document.getElementById('loading').hidden = false;
    title.textContent = 'The room could not finish loading';
    detail.textContent = String(error && error.message || error || 'Please reload the room.');
    document.getElementById('save-status').textContent = 'Room loading stopped';
    retry.hidden = false;
    report('failed', detail.textContent);
  }
  function progress(text) {
    if (finished || failed) return;
    stage = text; detail.textContent = text;
    clearTimeout(timer);
    timer = setTimeout(function () { fail('Loading stopped at: ' + stage + '. Your saved layout is safe. Try Reload room.'); }, 25000);
    report('loading');
  }
  retry.onclick = function () {
    var url = new URL(location.href); url.searchParams.set('reload', Date.now());
    location.replace(url.href);
  };
  window.addEventListener('error', function (event) {
    if (!finished) fail(event.error || event.message || 'A viewer file could not load. Please reload the room.');
  }, true);
  window.addEventListener('unhandledrejection', function (event) {
    if (!finished) fail(event.reason || 'The viewer could not start.');
  });
  window.roomBoot = {
    build:build,
    built:script.getAttribute('data-built') || '',
    backend:backend,
    asset:function (path) { return path + '?v=' + encodeURIComponent(build); },
    progress:progress,
    fail:fail,
    done:function () {
      if (failed) return;
      finished = true; clearTimeout(timer); stage = 'Room visible';
      document.getElementById('loading').hidden = true; report('ready');
    }
  };
  progress('Starting the 3D viewer…');
}());
