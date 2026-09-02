/* Safety net over WOW.js.
   WOW hides every .wow element inline until it scrolls into view. If its
   callback is missed — fast scroll, restored scroll position, reduced-motion
   settings — the content stays invisible forever. An IntersectionObserver is
   the reliable path here, with a timed sweep as a last resort. Nothing on this
   page is allowed to stay hidden. */
(function () {
  "use strict";

  var items = [].slice.call(document.querySelectorAll('.wow'));
  if (!items.length) { return; }
  document.documentElement.classList.add('es-anim');

  function show(el) {
    if (el.classList.contains('es-in')) { return; }
    el.style.visibility = 'visible';
    el.classList.add('es-in');
  }
  function showAll() { items.forEach(show); }

  var still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (still || !('IntersectionObserver' in window)) { showAll(); return; }

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { show(e.target); io.unobserve(e.target); }
    });
  }, { threshold: 0.01, rootMargin: '0px 0px -4% 0px' });

  items.forEach(function (el) { io.observe(el); });

  // Backstop for anything the observer skipped.
  function sweep() {
    var limit = window.innerHeight * 0.95;
    items.forEach(function (el) {
      if (el.classList.contains('es-in')) { return; }
      if (el.getBoundingClientRect().top < limit) { show(el); io.unobserve(el); }
    });
  }
  var ticking = false;
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; window.requestAnimationFrame(function () { ticking = false; sweep(); }); }
  }, { passive: true });
  window.addEventListener('resize', sweep, { passive: true });
  window.addEventListener('load', sweep);
  sweep();

  // Counters: jquery.appear can miss its trigger the same way. Run them
  // directly the first time their section is seen.
  var counters = [].slice.call(document.querySelectorAll('.count'));
  if (counters.length && 'IntersectionObserver' in window) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) { return; }
        var el = e.target;
        cio.unobserve(el);
        if (el.dataset.counted) { return; }
        el.dataset.counted = '1';
        var target = parseInt(el.textContent.replace(/\D/g, ''), 10);
        if (!target) { return; }
        var start = null, dur = 1600;
        (function step(ts) {
          if (!start) { start = ts; }
          var k = Math.min((ts - start) / dur, 1);
          el.textContent = Math.ceil(target * (1 - Math.pow(1 - k, 3)));
          if (k < 1) { window.requestAnimationFrame(step); }
        }(performance.now()));
      });
    }, { threshold: 0.2 });
    counters.forEach(function (el) { cio.observe(el); });
  }
}());
