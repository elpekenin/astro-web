module.exports = {
	content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
	theme: {
	  extend: {
		container: {
		  center: true,
		},
		colors: {
		  "palette1": "var(--palette1)",
		  "palette2": "var(--palette2)",
		  "palette3": "var(--palette3)",
		  "palette4": "var(--palette4)",
		  "links"   : "var(--links)"
		},
	  },
	},
	plugins: [],
  };