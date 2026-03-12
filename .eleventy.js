const { DateTime } = require("luxon");
const markdownIt = require("markdown-it");
const markdownItAnchor = require("markdown-it-anchor");
const markdownItAttrs = require("markdown-it-attrs");
const pluginRss = require("@11ty/eleventy-plugin-rss");
const { execSync } = require("child_process");
const Prism = require("prismjs");

// Load additional Prism languages
require("prismjs/components/prism-python");
require("prismjs/components/prism-bash");
require("prismjs/components/prism-yaml");
require("prismjs/components/prism-json");
require("prismjs/components/prism-ruby");
require("prismjs/components/prism-css");
require("prismjs/components/prism-markup");

module.exports = function (eleventyConfig) {
  // --- Plugins ---
  eleventyConfig.addPlugin(pluginRss);

  // --- Passthrough copy ---
  eleventyConfig.addPassthroughCopy({ "assets": "assets" });
  eleventyConfig.addPassthroughCopy({ "src/css": "css" });
  eleventyConfig.addPassthroughCopy({ "src/js": "js" });

  // --- Markdown config ---
  function escapeHtml(str) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  const mdOptions = {
    html: true,
    breaks: false,
    linkify: true,
    typographer: true,
    highlight: function (str, lang) {
      if (lang && Prism.languages[lang]) {
        try {
          return '<pre class="language-' + lang + '"><code class="language-' + lang + '">' + Prism.highlight(str, Prism.languages[lang], lang) + '</code></pre>';
        } catch (_) {}
      }
      return '<pre class="language-text"><code class="language-text">' + escapeHtml(str) + '</code></pre>';
    },
  };

  const mdLib = markdownIt(mdOptions)
    .use(markdownItAnchor, {
      permalink: markdownItAnchor.permalink.headerLink(),
      level: [2, 3],
      slugify: (s) =>
        s
          .trim()
          .toLowerCase()
          .replace(/[\s+]/g, "-")
          .replace(/[^\w-]/g, ""),
    })
    .use(markdownItAttrs);

  eleventyConfig.setLibrary("md", mdLib);

  // --- Custom transform: hoist .prompt-* classes from <p> to parent <blockquote> ---
  eleventyConfig.addTransform("hoistBlockquoteClasses", function (content) {
    if (!this.page.outputPath || !this.page.outputPath.endsWith(".html")) {
      return content;
    }
    return content.replace(
      /<blockquote>\s*<p class="(prompt-(?:info|tip|warning|danger))">/g,
      '<blockquote class="$1"><p>'
    );
  });

  // --- Collections ---
  function postInSection(post, section) {
    if (post.data.section === section) return true;
    if (Array.isArray(post.data.sections) && post.data.sections.includes(section)) return true;
    return false;
  }

  eleventyConfig.addCollection("python", function (collectionApi) {
    return collectionApi
      .getFilteredByGlob("src/posts/*.md")
      .filter((post) => postInSection(post, "python"))
      .sort((a, b) => b.date - a.date);
  });

  eleventyConfig.addCollection("ai", function (collectionApi) {
    return collectionApi
      .getFilteredByGlob("src/posts/*.md")
      .filter((post) => postInSection(post, "ai"))
      .sort((a, b) => b.date - a.date);
  });

  eleventyConfig.addCollection("personal", function (collectionApi) {
    return collectionApi
      .getFilteredByGlob("src/posts/*.md")
      .filter((post) => postInSection(post, "personal"))
      .sort((a, b) => b.date - a.date);
  });

  eleventyConfig.addCollection("allPosts", function (collectionApi) {
    return collectionApi
      .getFilteredByGlob("src/posts/*.md")
      .sort((a, b) => b.date - a.date);
  });

  eleventyConfig.addCollection("tagList", function (collectionApi) {
    const tagSet = new Set();
    collectionApi.getAll().forEach((item) => {
      if (item.data.tags) {
        item.data.tags.forEach((tag) => {
          if (tag !== "posts") tagSet.add(tag);
        });
      }
    });
    return [...tagSet].sort();
  });

  eleventyConfig.addCollection("categoryMap", function (collectionApi) {
    const catMap = {};
    collectionApi.getFilteredByGlob("src/posts/*.md").forEach((post) => {
      if (post.data.categories) {
        post.data.categories.forEach((cat) => {
          if (!catMap[cat]) catMap[cat] = [];
          catMap[cat].push(post);
        });
      }
    });
    Object.keys(catMap).forEach((cat) => {
      catMap[cat].sort((a, b) => b.date - a.date);
    });
    return catMap;
  });

  eleventyConfig.addCollection("categoryList", function (collectionApi) {
    const catSet = new Set();
    collectionApi.getFilteredByGlob("src/posts/*.md").forEach((post) => {
      if (post.data.categories) {
        post.data.categories.forEach((cat) => catSet.add(cat));
      }
    });
    return [...catSet].sort();
  });

  // --- Filters ---
  eleventyConfig.addFilter("readableDate", (dateObj) => {
    return DateTime.fromJSDate(dateObj, { zone: "Asia/Kolkata" }).toFormat("LLL dd, yyyy");
  });

  eleventyConfig.addFilter("isoDate", (dateObj) => {
    return DateTime.fromJSDate(dateObj, { zone: "Asia/Kolkata" }).toISO();
  });

  eleventyConfig.addFilter("excerpt", (content) => {
    if (!content) return "";
    const text = content.replace(/<[^>]+>/g, "");
    if (text.length <= 160) return text;
    return text.substring(0, 160).replace(/\s+\S*$/, "") + "...";
  });

  eleventyConfig.addFilter("readingTime", (content) => {
    if (!content) return "1 min read";
    const text = content.replace(/<[^>]+>/g, "");
    const words = text.split(/\s+/).length;
    const minutes = Math.ceil(words / 200);
    return minutes + " min read";
  });

  eleventyConfig.addFilter("head", (array, n) => {
    if (!Array.isArray(array)) return [];
    return n < 0 ? array.slice(n) : array.slice(0, n);
  });

  eleventyConfig.addFilter("groupByYear", (posts) => {
    const groups = {};
    posts.forEach((post) => {
      const year = post.date.getFullYear();
      if (!groups[year]) groups[year] = [];
      groups[year].push(post);
    });
    return Object.keys(groups)
      .sort((a, b) => b - a)
      .map((year) => ({ year, posts: groups[year] }));
  });

  eleventyConfig.addFilter("slugify", (str) => {
    return str
      .toLowerCase()
      .trim()
      .replace(/[\s+]/g, "-")
      .replace(/[^\w-]/g, "");
  });

  eleventyConfig.addFilter("postSections", (post) => {
    const sections = [post.data.section];
    if (Array.isArray(post.data.sections)) {
      sections.push(...post.data.sections);
    }
    return sections;
  });

  // --- Last modified from git ---
  eleventyConfig.addGlobalData("eleventyComputed", {
    lastModified: function (data) {
      if (!data.page || !data.page.inputPath) return null;
      try {
        const filePath = data.page.inputPath;
        const commitCount = execSync(
          'git log --oneline -- "' + filePath + '"',
          { encoding: "utf-8" }
        ).trim().split("\n").filter(Boolean).length;

        if (commitCount > 1) {
          const lastMod = execSync(
            'git log -1 --format="%ai" -- "' + filePath + '"',
            { encoding: "utf-8" }
          ).trim();
          return new Date(lastMod);
        }
      } catch (e) {}
      return null;
    },
  });

  // --- Config ---
  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
      data: "_data",
    },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
    templateFormats: ["md", "njk", "html"],
  };
};
