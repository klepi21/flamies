/** @type {import('next').NextConfig} */
const nextConfig = {
  // distDir: 'build',
  transpilePackages: ['@multiversx/sdk-dapp'],
  images: {

    domains: [
      'storage.googleapis.com',
      'hebbkx1anhila5yf.public.blob.vercel-storage.com',
      'storage.googleapis.com',
      'via.placeholder.com',
      'hebbkx1anhila5yf.public.blob.vercel-storage.com',
      'firebasestorage.googleapis.com',
      'i.imgur.com'
    ],


  },
  webpack: (config, { isServer }) => {
    config.module.rules.push({
      test: /\.js$/,
      include: /node_modules\/undici/,
      use: {
        loader: 'babel-loader',
        options: {
          presets: ['@babel/preset-env'],
        },
      },
    });

    config.resolve.fallback = { fs: false };
    config.externals.push('pino-pretty', 'lokijs', 'encoding', {
      bufferutil: 'bufferutil',
      'utf-8-validate': 'utf-8-validate'
    });

    return config;
  }
};

module.exports = nextConfig;
