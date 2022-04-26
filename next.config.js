/** @type {import('next').NextConfig} */

const isProd = process.env.NODE_ENV === 'production'

const nextConfig = {
    basePath: isProd ? '/interface' : '',
    assetPrefix: isProd ? '/interface/' : '',
    reactStrictMode: true,
}

module.exports = nextConfig
