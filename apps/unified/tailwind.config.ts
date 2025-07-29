import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    // コアパッケージのコンポーネントも含める
    "../../../packages/core/src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // Liberary用の緑色テーマ
        'liberary-primary': '#10b981',
        'liberary-secondary': '#065f46',
        // Platto用の青色テーマ
        'platto-primary': '#3b82f6',
        'platto-secondary': '#1e40af',
      },
      fontFamily: {
        'sans': ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
    },
  },
  plugins: [],
  // プロダクション最適化
  corePlugins: {
    preflight: true,
  },
  // 重要なクラスの保護
  safelist: [
    'bg-green-50', 'bg-green-100', 'bg-green-600', 'bg-green-700',
    'text-green-600', 'text-green-700', 'text-green-800',
    'border-green-200', 'border-green-500',
    'bg-blue-50', 'bg-blue-100', 'bg-blue-600', 'bg-blue-700',
    'text-blue-600', 'text-blue-700', 'text-blue-800',
    'border-blue-200', 'border-blue-500',
    'hover:bg-green-50', 'hover:bg-blue-50',
    'transition-colors', 'transition-all',
    'fixed', 'sticky', 'relative', 'absolute',
    'z-10', 'z-20', 'z-30', 'z-50',
  ]
} satisfies Config;