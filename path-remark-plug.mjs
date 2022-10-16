export function pathRemarkPlugin() {
    return function (tree, file) {
      file.data.astro.frontmatter.filename = file.history[0].split("/").slice(7).join("-").replace(".md", "");
    }
  }