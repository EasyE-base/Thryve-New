/** @type {import('next').NextConfig} */

// ✅ OPTIMIZED NEXT.JS CONFIG: Performance-focused configuration
const nextConfig = {
  // ✅ PERFORMANCE: Enable modern optimizations
  experimental: {
    optimizeCss: true,
    serverComponentsExternalPackages: ['mongodb', 'firebase-admin'],
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },

  // ✅ WEBPACK: Bundle optimization
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Code splitting optimization
    config.optimization.splitChunks = {
      chunks: 'all',
      cacheGroups: {
        default: {
          minChunks: 2,
          priority: -20,
          reuseExistingChunk: true
        },
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
          priority: -10
        },
        // Separate UI library chunks
        ui: {
          test: /[\\/]node_modules[\\/](@radix-ui|lucide-react)[\\/]/,
          name: 'ui',
          chunks: 'all',
          priority: 10
        },
        // Separate chart libraries
        charts: {
          test: /[\\/]node_modules[\\/](recharts|react-big-calendar)[\\/]/,
          name: 'charts',
          chunks: 'all',
          priority: 5
        }
      }
    }

    // Tree shaking for unused code
    config.optimization.usedExports = true
    config.optimization.sideEffects = false

    return config
  },

  // ✅ IMAGES: Optimization for performance
  images: {
    domains: [
      'images.unsplash.com',
      'customer-assets.emergentagent.com'
    ],
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // ✅ COMPRESSION: Enable gzip compression
  compress: true,

  // ✅ HEADERS: Security and performance headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      }
    ]
  },

  // ✅ REDIRECTS: Handle common routing patterns
  async redirects() {
    return [
      {
        source: '/dashboard',
        destination: '/dashboard/customer',
        permanent: false
      }
    ]
  },

  // ✅ REWRITES: API route optimization
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: '/api/:path*'
      }
    ]
  },

  // ✅ ENVIRONMENT: Production optimizations
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },

  // ✅ OUTPUT: Static optimization
  output: 'standalone',
  
  // ✅ TRAILING SLASH: Consistent URL handling
  trailingSlash: false,

  // ✅ POWER MODE: Enable all optimizations
  poweredByHeader: false,
  generateEtags: false,
  
  // ✅ BUNDLE ANALYZER: Optional bundle analysis
  ...(process.env.ANALYZE === 'true' && {
    webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
      if (!dev && !isServer) {
        const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')
        config.plugins.push(
          new BundleAnalyzerPlugin({
            analyzerMode: 'static',
            reportFilename: './analyze/client.html',
            defaultSizes: 'gzip'
          })
        )
      }
      return config
    }
  })
}

module.exports = nextConfig