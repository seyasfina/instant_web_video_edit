import daisyui from 'daisyui'

export default {
  content: [
    "./app/views/**/*.{erb,haml,html,slim}",
    "./app/helpers/**/*.rb",
    "./app/assets/javascripts/**/*.js",
    "./app/javascript/**/*.js"
  ],
  theme: {
    extend: {},
  },
  plugins: [daisyui],
  daisyui: {
    themes: [
      "light", 
      "dark", 
      "cupcake", 
      "bumblebee", 
      "emerald", 
      "corporate",
      "synthwave",
      "retro",
      "cyberpunk",
      "valentine",
      "halloween",
      "garden",
      "forest",
      "aqua",
      "lofi",
      "pastel",
      "fantasy",
      "wireframe",
      "black",
      "luxury",
      "dracula"
    ],
    darkTheme: "dark",
    base: true,
    styled: true,
    utils: true,
    prefix: "",
    logs: true,
  },
}