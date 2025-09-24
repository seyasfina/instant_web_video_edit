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
    darkTheme: "dark", // デフォルトのダークテーマ
    base: true, // ベーススタイルを適用
    styled: true, // コンポーネントスタイルを適用
    utils: true, // ユーティリティクラスを適用
    prefix: "", // プレフィックスなし
    logs: true, // ログを表示
  },
}