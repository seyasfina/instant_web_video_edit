import daisyui from 'daisyui'

export default {
  content: [
    './public/*.html',
    './app/helpers/**/*.rb',
    './app/javascript/**/*.js',
    './app/views/**/*.{erb,haml,html,slim}'
  ],
  theme: {
    extend: {},
  },
  plugins: [daisyui],
  daisyui: {
    themes: ["light", "dark", "cupcake", "bumblebee", "emerald", "corporate"],
    darkTheme: "dark", // デフォルトのダークテーマ
    base: true, // ベーススタイルを適用
    styled: true, // コンポーネントスタイルを適用
    utils: true, // ユーティリティクラスを適用
    prefix: "", // プレフィックスなし
    logs: true, // ログを表示
  },
}