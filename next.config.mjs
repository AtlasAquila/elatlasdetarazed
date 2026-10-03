/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // La base de lugares se lee del disco en el servidor: hay que incluirla en la función.
  outputFileTracingIncludes: {
    "/api/lugares": ["./lib/places/places.tsv.gz"],
  },
};

export default nextConfig;
