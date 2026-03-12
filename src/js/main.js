(function () {
  "use strict";

  // === Theme Toggle ===
  var STORAGE_KEY = "theme-preference";

  function getThemePreference() {
    var stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return stored;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  function setTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(STORAGE_KEY, theme);
    var btn = document.querySelector(".theme-toggle");
    if (btn) {
      btn.querySelector("i").className = theme === "dark" ? "fa-solid fa-sun" : "fa-solid fa-moon";
      btn.setAttribute("aria-label", theme === "dark" ? "Switch to light mode" : "Switch to dark mode");
    }
  }

  // Apply immediately to prevent flash
  setTheme(getThemePreference());

  document.addEventListener("DOMContentLoaded", function () {
    // Theme toggle click
    var toggleBtn = document.querySelector(".theme-toggle");
    if (toggleBtn) {
      toggleBtn.addEventListener("click", function () {
        var current = document.documentElement.getAttribute("data-theme") || getThemePreference();
        setTheme(current === "dark" ? "light" : "dark");
      });
    }

    // === Mobile Navigation ===
    var hamburger = document.querySelector(".hamburger");
    var sidebar = document.querySelector(".sidebar");
    var overlay = document.querySelector(".sidebar-overlay");

    function toggleMobileNav() {
      sidebar.classList.toggle("open");
      overlay.classList.toggle("active");
      document.body.classList.toggle("nav-open");
    }

    if (hamburger) hamburger.addEventListener("click", toggleMobileNav);
    if (overlay) overlay.addEventListener("click", toggleMobileNav);

    // === TOC Generation + Highlight ===
    var headings = document.querySelectorAll(".post-content h2[id], .post-content h3[id]");
    var tocContainers = document.querySelectorAll(".toc-list");

    if (tocContainers.length > 0 && headings.length > 0) {
      tocContainers.forEach(function (tocContainer) {
        headings.forEach(function (heading) {
          var link = document.createElement("a");
          link.href = "#" + heading.id;
          link.textContent = heading.textContent.replace(/^#\s*/, "");
          link.className = heading.tagName === "H3" ? "toc-link toc-h3" : "toc-link";
          tocContainer.appendChild(link);
        });
      });
    }

    var tocLinks = document.querySelectorAll(".toc-list a");

    if (tocLinks.length > 0 && headings.length > 0) {
      var observer = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              tocLinks.forEach(function (link) { link.classList.remove("active"); });
              var activeLink = document.querySelector('.toc-list a[href="#' + entry.target.id + '"]');
              if (activeLink) activeLink.classList.add("active");
            }
          });
        },
        { rootMargin: "0px 0px -80% 0px", threshold: 0 }
      );
      headings.forEach(function (heading) { observer.observe(heading); });
    }

    // === Copy Code Button ===
    document.querySelectorAll("pre[class*='language-']").forEach(function (pre) {
      var btn = document.createElement("button");
      btn.className = "copy-code-btn";
      btn.innerHTML = '<i class="fa-regular fa-copy"></i>';
      btn.setAttribute("aria-label", "Copy code");
      btn.addEventListener("click", function () {
        var code = pre.querySelector("code");
        navigator.clipboard.writeText(code.textContent).then(function () {
          btn.innerHTML = '<i class="fa-solid fa-check"></i>';
          setTimeout(function () {
            btn.innerHTML = '<i class="fa-regular fa-copy"></i>';
          }, 2000);
        });
      });
      pre.style.position = "relative";
      pre.appendChild(btn);
    });

    // === Disqus Lazy Load ===
    var disqusContainer = document.getElementById("disqus_thread");
    if (disqusContainer) {
      var disqusObserver = new IntersectionObserver(
        function (entries) {
          if (entries[0].isIntersecting) {
            var d = document.createElement("script");
            d.src = "https://" + disqusContainer.dataset.shortname + ".disqus.com/embed.js";
            d.setAttribute("data-timestamp", +new Date());
            (document.head || document.body).appendChild(d);
            disqusObserver.disconnect();
          }
        },
        { rootMargin: "200px" }
      );
      disqusObserver.observe(disqusContainer);
    }

    // === Collapsible TOC (mobile) ===
    var tocToggle = document.querySelector(".toc-toggle");
    if (tocToggle) {
      tocToggle.addEventListener("click", function () {
        var tocContent = document.querySelector(".toc-mobile-content");
        tocContent.classList.toggle("open");
        tocToggle.classList.toggle("open");
      });
    }
  });
})();
