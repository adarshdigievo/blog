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
    if (typeof DISQUS !== "undefined") {
      DISQUS.reset({ reload: true });
    }
  }

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

    // === Mobile Menu ===
    var hamburger = document.querySelector(".hamburger");
    var mobileMenu = document.querySelector(".mobile-menu");
    var mobileOverlay = document.querySelector(".mobile-overlay");
    var mobileClose = document.querySelector(".mobile-menu-close");

    function openMobileMenu() {
      mobileMenu.classList.add("open");
      mobileOverlay.classList.add("active");
      document.body.classList.add("nav-open");
    }

    function closeMobileMenu() {
      mobileMenu.classList.remove("open");
      mobileOverlay.classList.remove("active");
      document.body.classList.remove("nav-open");
    }

    if (hamburger) hamburger.addEventListener("click", openMobileMenu);
    if (mobileOverlay) mobileOverlay.addEventListener("click", closeMobileMenu);
    if (mobileClose) mobileClose.addEventListener("click", closeMobileMenu);

    // === Search Overlay ===
    var searchBtn = document.querySelector(".header-search-btn");
    var searchOverlay = document.querySelector(".search-overlay");
    var searchInput = document.getElementById("search-input");
    var searchResults = document.getElementById("search-results");
    var postList = document.getElementById("post-list");
    var searchIndex = null;

    function openSearch() {
      if (!searchOverlay) return;
      searchOverlay.classList.add("active");
      setTimeout(function () { searchInput.focus(); }, 50);
    }

    function closeSearch() {
      if (!searchOverlay) return;
      searchOverlay.classList.remove("active");
      searchInput.value = "";
      if (searchResults) searchResults.hidden = true;
      if (postList) postList.style.display = "";
    }

    if (searchBtn) searchBtn.addEventListener("click", openSearch);

    // Close search on overlay click (but not inner)
    if (searchOverlay) {
      searchOverlay.addEventListener("click", function (e) {
        if (e.target === searchOverlay) closeSearch();
      });
    }

    // Keyboard shortcuts
    document.addEventListener("keydown", function (e) {
      if (e.key === "/" && document.activeElement !== searchInput && document.activeElement.tagName !== "INPUT" && document.activeElement.tagName !== "TEXTAREA") {
        e.preventDefault();
        openSearch();
      }
      if (e.key === "Escape") {
        if (searchOverlay && searchOverlay.classList.contains("active")) {
          closeSearch();
        }
        if (mobileMenu && mobileMenu.classList.contains("open")) {
          closeMobileMenu();
        }
      }
    });

    // Search functionality
    if (searchInput && searchResults) {
      function loadSearchIndex(callback) {
        if (searchIndex) return callback(searchIndex);
        fetch("/search-index.json")
          .then(function (r) { return r.json(); })
          .then(function (data) {
            searchIndex = data;
            callback(data);
          })
          .catch(function () {
            searchResults.innerHTML = '<div class="search-no-results">Search unavailable</div>';
            searchResults.hidden = false;
          });
      }

      function performSearch(query) {
        if (!query || query.length < 2) {
          searchResults.hidden = true;
          return;
        }

        loadSearchIndex(function (index) {
          var q = query.toLowerCase();
          var results = index.filter(function (item) {
            return (
              item.title.toLowerCase().indexOf(q) !== -1 ||
              item.excerpt.toLowerCase().indexOf(q) !== -1 ||
              item.tags.some(function (t) { return t.toLowerCase().indexOf(q) !== -1; }) ||
              item.section.toLowerCase().indexOf(q) !== -1
            );
          });

          if (results.length === 0) {
            searchResults.innerHTML = '<div class="search-no-results">No posts found for "' + query.replace(/</g, "&lt;") + '"</div>';
          } else {
            searchResults.innerHTML = results.slice(0, 10).map(function (r) {
              return '<a href="' + r.url + '" class="search-result-item">' +
                '<div class="search-result-title">' + highlightMatch(r.title, q) + '</div>' +
                '<div class="search-result-meta"><span class="search-result-section">' + r.section + '</span> &middot; ' + r.date + '</div>' +
                '</a>';
            }).join("");
          }
          searchResults.hidden = false;
        });
      }

      function highlightMatch(text, query) {
        var idx = text.toLowerCase().indexOf(query);
        if (idx === -1) return escapeHtml(text);
        return escapeHtml(text.substring(0, idx)) +
          '<mark>' + escapeHtml(text.substring(idx, idx + query.length)) + '</mark>' +
          escapeHtml(text.substring(idx + query.length));
      }

      function escapeHtml(str) {
        return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      }

      var debounceTimer;
      searchInput.addEventListener("input", function () {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(function () {
          performSearch(searchInput.value.trim());
        }, 200);
      });
    }

    // === Reading Progress Bar ===
    var progressBar = document.getElementById("reading-progress");
    if (progressBar) {
      window.addEventListener("scroll", function () {
        var scrollTop = window.pageYOffset;
        var docHeight = document.documentElement.scrollHeight - window.innerHeight;
        var progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
        progressBar.style.width = progress + "%";
      }, { passive: true });
    }

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
              var activeLinks = document.querySelectorAll('.toc-list a[href="#' + entry.target.id + '"]');
              activeLinks.forEach(function (link) { link.classList.add("active"); });
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
    var tocMobileContent = document.querySelector(".toc-mobile-content");
    if (tocToggle && tocMobileContent) {
      tocToggle.addEventListener("click", function () {
        tocMobileContent.classList.toggle("open");
        tocToggle.classList.toggle("open");
      });

      // Auto-collapse TOC and scroll with offset when a link is clicked
      tocMobileContent.addEventListener("click", function (e) {
        var link = e.target.closest("a");
        if (link) {
          e.preventDefault();
          tocMobileContent.classList.remove("open");
          tocToggle.classList.remove("open");
          var targetId = link.getAttribute("href").substring(1);
          var target = document.getElementById(targetId);
          if (target) {
            var headerHeight = document.querySelector(".site-header").offsetHeight || 0;
            var tocHeight = document.querySelector(".toc-mobile").offsetHeight || 0;
            var offset = headerHeight + tocHeight + 16;
            var top = target.getBoundingClientRect().top + window.pageYOffset - offset;
            window.scrollTo({ top: top, behavior: "smooth" });
          }
        }
      });
    }

    // === Scroll offset for anchor links (desktop TOC sidebar) ===
    document.querySelectorAll('.toc-list a').forEach(function (link) {
      link.addEventListener("click", function (e) {
        var targetId = this.getAttribute("href").substring(1);
        var target = document.getElementById(targetId);
        if (target) {
          e.preventDefault();
          var headerHeight = document.querySelector(".site-header").offsetHeight || 0;
          var offset = headerHeight + 16;
          var top = target.getBoundingClientRect().top + window.pageYOffset - offset;
          window.scrollTo({ top: top, behavior: "smooth" });
        }
      });
    });

    // === Sidebar Toggle (Desktop) ===
    var SIDEBAR_KEY = "sidebar-hidden";
    var sidebarHideBtn = document.querySelector(".sidebar-toggle");
    var sidebarShowBtn = document.querySelector(".sidebar-show-toggle");

    function applySidebarState(hidden) {
      if (hidden) {
        document.body.classList.add("sidebar-hidden");
      } else {
        document.body.classList.remove("sidebar-hidden");
      }
    }

    var hasSidebar = document.querySelector(".right-sidebar");
    if (!hasSidebar && sidebarHideBtn) {
      sidebarHideBtn.style.display = "none";
    }
    if (hasSidebar) {
      applySidebarState(localStorage.getItem(SIDEBAR_KEY) === "true");

      if (sidebarHideBtn) {
        sidebarHideBtn.addEventListener("click", function () {
          localStorage.setItem(SIDEBAR_KEY, "true");
          applySidebarState(true);
        });
      }

      if (sidebarShowBtn) {
        sidebarShowBtn.addEventListener("click", function () {
          localStorage.setItem(SIDEBAR_KEY, "false");
          applySidebarState(false);
        });
      }
    }
  });
})();
