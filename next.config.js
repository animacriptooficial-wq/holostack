/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["esbuild"],
  /* WebContainer exige crossOriginIsolated no documento que o hospeda.
     credentialless permite recursos cross-origin sem credenciais. */
  async headers() {
    return [
      {
        source: "/generator",
        headers: [
          { key: "Cross-Origin-Embedder-Policy", value: "credentialless" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
        ],
      },
    ]
  },
}

module.exports = nextConfig
