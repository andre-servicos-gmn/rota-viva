/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: { ignoreBuildErrors: false },

  // O SQLite vive dentro do projeto (POC autocontida). Sem isto, cada gravação
  // no banco acorda o watcher do dev server, que recompila no meio da
  // requisição e derruba a resposta com erro de manifesto parcial.
  webpack: (config) => {
    config.watchOptions = {
      ...config.watchOptions,
      ignored: [
        "**/node_modules/**",
        "**/.git/**",
        "**/prisma/*.db",
        "**/prisma/*.db-journal",
      ],
    };
    return config;
  },
};

export default nextConfig;
