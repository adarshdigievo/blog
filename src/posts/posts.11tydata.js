const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

module.exports = {
  layout: "layouts/post.njk",
  eleventyComputed: {
    permalink: "{% if section == 'python' %}/posts/{{ page.fileSlug }}/{% else %}/{{ section }}/posts/{{ page.fileSlug }}/{% endif %}",
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
    autoExcerpt: function (data) {
      if (data.description) return data.description;
      if (!data.page || !data.page.inputPath) return null;
      try {
        const resolved = path.resolve(data.page.inputPath);
        const raw = fs.readFileSync(resolved, "utf-8");
        const fmEnd = raw.indexOf("---", 3);
        if (fmEnd === -1) return null;
        const content = raw.substring(fmEnd + 3).trim();
        const text = content
          .replace(/<[^>]+>/g, "")
          .replace(/^#{1,6}\s+/gm, "")
          .replace(/!\[.*?\]\(.*?\)(\{[^}]*\})?/g, "")
          .replace(/\{:?\s*[^}]*\}/g, "")
          .replace(/\[([^\]]+)\]\(.*?\)/g, "$1")
          .replace(/^>\s*/gm, "")
          .replace(/[*_`~]/g, "")
          .replace(/\n+/g, " ")
          .trim();
        if (text.length <= 160) return text;
        return text.substring(0, 160).replace(/\s+\S*$/, "") + "...";
      } catch (e) {
        return null;
      }
    },
  },
};
