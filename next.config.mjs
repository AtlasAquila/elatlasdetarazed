/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async redirects() {
    // La ruta con tilde se codifica en la URL; se lleva a la ruta sin tilde.
    return [{ source: "/venus-retr%C3%B3grado", destination: "/venus-retrogrado", permanent: true }];
  },
  // La base de lugares se lee del disco en el servidor: hay que incluirla en la función.
  outputFileTracingIncludes: {
    "/api/lugares": ["./lib/places/places.tsv.gz"],
  },
};

export default nextConfig;
