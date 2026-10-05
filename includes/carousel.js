/* Shared carousel behaviour — progressive enhancement over a
   native scroll-snap track. Touch/trackpad swipe and keyboard
   arrow keys (while the track has focus) work without any JS
   via scroll-snap; this file adds prev/next buttons, dot
   paging and active-state sync via IntersectionObserver. */
(function () {
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function initCarousel(root) {
    var viewport = root.querySelector('.carousel__viewport');
    var track = root.querySelector('.carousel__track');
    var slides = Array.prototype.slice.call(track.children);
    var prevBtn = root.querySelector('.carousel__btn--prev');
    var nextBtn = root.querySelector('.carousel__btn--next');
    var dotsWrap = root.querySelector('.carousel__dots');
    if (!viewport || !track || !slides.length) return;

    var dots = slides.map(function (slide, i) {
      var dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'carousel__dot';
      dot.setAttribute('aria-label', 'Go to photo ' + (i + 1) + ' of ' + slides.length);
      dot.addEventListener('click', function () {
        slide.scrollIntoView({
          behavior: reduceMotion ? 'auto' : 'smooth',
          block: 'nearest',
          inline: 'start'
        });
      });
      if (dotsWrap) dotsWrap.appendChild(dot);
      return dot;
    });

    var activeIndex = 0;
    function setActive(i) {
      activeIndex = i;
      dots.forEach(function (d, di) {
        d.classList.toggle('is-active', di === i);
      });
      if (prevBtn) prevBtn.disabled = i === 0;
      if (nextBtn) nextBtn.disabled = i === slides.length - 1;
    }
    setActive(0);

    if ('IntersectionObserver' in window) {
      var observer = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting && entry.intersectionRatio > 0.6) {
              setActive(slides.indexOf(entry.target));
            }
          });
        },
        { root: viewport, threshold: [0, 0.6, 1] }
      );
      slides.forEach(function (slide) {
        observer.observe(slide);
      });
    }

    function scrollToIndex(i) {
      var clamped = Math.max(0, Math.min(slides.length - 1, i));
      slides[clamped].scrollIntoView({
        behavior: reduceMotion ? 'auto' : 'smooth',
        block: 'nearest',
        inline: 'start'
      });
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', function () {
        scrollToIndex(activeIndex - 1);
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', function () {
        scrollToIndex(activeIndex + 1);
      });
    }

    viewport.setAttribute('tabindex', '0');
    viewport.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        scrollToIndex(activeIndex + 1);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        scrollToIndex(activeIndex - 1);
      }
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    var carousels = document.querySelectorAll('[data-carousel]');
    carousels.forEach(initCarousel);
  });
})();
