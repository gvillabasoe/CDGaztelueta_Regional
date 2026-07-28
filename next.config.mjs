/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    serverActions: {
      // El archivo de la planificación se envía como base64 al guardar.
      // Se amplía el límite del cuerpo de las Server Actions para no limitarlo
      // desde la app (el proveedor de hosting puede tener su propio máximo).
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
