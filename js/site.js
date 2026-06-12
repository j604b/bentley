/* ==========================================================================
   John Bentley Architectural Photography — site.js
   Shared scripts: scroll reveals, parallax, custom cursor, nav, hero slider,
   lightbox, smooth scroll, mobile menu.
   ========================================================================== */

(function() {
  'use strict';

  // -- Page load fade --------------------------------------------------------
  window.addEventListener('load', function() {
    document.body.classList.add('loaded');
    var loader = document.querySelector('.page-load');
    if (loader) {
      var bar = loader.querySelector('.bar');
      if (bar) requestAnimationFrame(function() { bar.style.width = '60vw'; });
      setTimeout(function() {
        loader.classList.add('loaded');
        setTimeout(function() { loader.remove(); }, 1100);
      }, 250);
    }
  });

  // -- Header scroll state ---------------------------------------------------
  var header = document.querySelector('.site-header');
  function onScroll() {
    if (!header) return;
    if (window.scrollY > 12) header.classList.add('scrolled');
    else header.classList.remove('scrolled');
    // Parallax
    document.querySelectorAll('[data-parallax]').forEach(function(el) {
      var rect = el.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > window.innerHeight) return;
      var speed = parseFloat(el.dataset.parallax) || 0.25;
      var offset = (rect.top - window.innerHeight / 2) * -speed;
      el.style.transform = 'translate3d(0,' + offset.toFixed(2) + 'px,0) scale(1.08)';
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // -- Mobile nav ------------------------------------------------------------
  var toggle = document.querySelector('.menu-toggle');
  var mnav = document.querySelector('.mobile-nav');
  if (toggle && mnav) {
    toggle.addEventListener('click', function() {
      toggle.classList.toggle('open');
      mnav.classList.toggle('open');
      document.body.style.overflow = mnav.classList.contains('open') ? 'hidden' : '';
    });
    mnav.querySelectorAll('a').forEach(function(a) {
      a.addEventListener('click', function() {
        toggle.classList.remove('open');
        mnav.classList.remove('open');
        document.body.style.overflow = '';
      });
    });
  }

  // -- Reveal on scroll ------------------------------------------------------
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function(entries) {
      entries.forEach(function(e) {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    document.querySelectorAll('.reveal, .reveal-img-mask').forEach(function(el) { io.observe(el); });
  } else {
    document.querySelectorAll('.reveal, .reveal-img-mask').forEach(function(el) { el.classList.add('in'); });
  }

  // -- Hero rotator ----------------------------------------------------------
  var slides = document.querySelectorAll('.hero-slide');
  var dots = document.querySelectorAll('.hero-pager-dot');
  if (slides.length > 1) {
    var idx = 0;
    function go(i) {
      slides.forEach(function(s, k) { s.classList.toggle('active', k === i); });
      dots.forEach(function(d, k) { d.classList.toggle('active', k === i); });
      idx = i;
    }
    dots.forEach(function(d, i) { d.addEventListener('click', function() { go(i); reset(); }); });
    var timer = setInterval(function() { go((idx + 1) % slides.length); }, 6500);
    function reset() { clearInterval(timer); timer = setInterval(function() { go((idx + 1) % slides.length); }, 6500); }
  }

  // -- Smooth scroll for anchors --------------------------------------------
  document.querySelectorAll('a[href^="#"]').forEach(function(a) {
    a.addEventListener('click', function(e) {
      var id = a.getAttribute('href');
      if (id.length > 1) {
        var t = document.querySelector(id);
        if (t) { e.preventDefault(); t.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
      }
    });
  });

  // -- Lightbox -------------------------------------------------------------
  var galleryLinks = document.querySelectorAll('.gallery-grid a');
  if (galleryLinks.length) {
    var images = Array.from(galleryLinks).map(function(a) { return a.getAttribute('href'); });
    var current = 0;
    var lb = document.createElement('div');
    lb.className = 'lightbox';
    lb.innerHTML = '\
      <button class="lightbox-close" aria-label="Close">✕</button>\
      <button class="lightbox-nav prev" aria-label="Previous">←</button>\
      <img alt="" />\
      <button class="lightbox-nav next" aria-label="Next">→</button>';
    document.body.appendChild(lb);
    var img = lb.querySelector('img');
    function open(i) {
      current = i;
      img.src = images[i];
      lb.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
    function close() { lb.classList.remove('open'); document.body.style.overflow = ''; }
    function step(n) { current = (current + n + images.length) % images.length; img.src = images[current]; }
    galleryLinks.forEach(function(a, i) {
      a.addEventListener('click', function(e) { e.preventDefault(); open(i); });
    });
    lb.querySelector('.lightbox-close').addEventListener('click', close);
    lb.querySelector('.prev').addEventListener('click', function() { step(-1); });
    lb.querySelector('.next').addEventListener('click', function() { step(1); });
    lb.addEventListener('click', function(e) { if (e.target === lb) close(); });
    document.addEventListener('keydown', function(e) {
      if (!lb.classList.contains('open')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') step(-1);
      if (e.key === 'ArrowRight') step(1);
    });
  }

  // -- Year stamp ------------------------------------------------------------
  document.querySelectorAll('[data-year]').forEach(function(el) {
    el.textContent = new Date().getFullYear();
  });

  // -- Form (contact) — submit to Formspree via fetch, inline confirmation ---
  var form = document.querySelector('form[data-contact]');
  if (form) {
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      var btn = form.querySelector('button[type="submit"]');
      var originalLabel = btn ? btn.innerHTML : '';
      if (btn) { btn.disabled = true; btn.innerHTML = '<span>Sending…</span>'; }

      var data = new FormData(form);
      fetch(form.getAttribute('action'), {
        method: 'POST',
        body: data,
        headers: { 'Accept': 'application/json' }
      }).then(function(resp) {
        if (resp.ok) {
          showConfirmation(true);
          form.reset();
        } else {
          resp.json().then(function(d) {
            var msg = (d && d.errors && d.errors[0] && d.errors[0].message)
                      ? d.errors[0].message
                      : 'Something went wrong. Please email info@johnbentley.ca directly.';
            showConfirmation(false, msg);
          }).catch(function() {
            showConfirmation(false, 'Something went wrong. Please email info@johnbentley.ca directly.');
          });
        }
      }).catch(function() {
        showConfirmation(false, 'Network issue. Please email info@johnbentley.ca directly.');
      }).finally(function() {
        if (btn) { btn.disabled = false; btn.innerHTML = originalLabel; }
      });
    });

    function showConfirmation(ok, errorMsg) {
      var existing = document.querySelector('.form-confirmation');
      if (existing) existing.remove();
      var box = document.createElement('div');
      box.className = 'form-confirmation' + (ok ? ' is-success' : ' is-error');
      box.innerHTML = ok
        ? '<button class="form-confirmation-close" aria-label="Close">✕</button>' +
          '<div class="form-confirmation-title">Message sent</div>' +
          '<div class="form-confirmation-body">Thanks — I\'ll reply within one business day. For anything urgent, call 604.765.1843.</div>'
        : '<button class="form-confirmation-close" aria-label="Close">✕</button>' +
          '<div class="form-confirmation-title">Couldn\'t send</div>' +
          '<div class="form-confirmation-body">' + errorMsg + '</div>';
      form.parentNode.insertBefore(box, form);
      box.querySelector('.form-confirmation-close').addEventListener('click', function() { box.remove(); });
      box.scrollIntoView({ behavior: 'smooth', block: 'center' });
      if (ok) setTimeout(function() { if (box.parentNode) box.remove(); }, 9000);
    }
  }
})();
