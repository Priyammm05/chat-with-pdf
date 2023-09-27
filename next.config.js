/** @type {import('next').NextConfig} */
const nextConfig = {
    // (Optional) Export as a static site
    // See https://nextjs.org/docs/pages/building-your-application/deploying/static-exports#configuration // Feel free to modify/remove this option

    webpack: (config) => {
        // Ignore node-specific modules when bundling for the browser
        // See https://webpack.js.org/configuration/resolve/#resolvealias
        config.optimization.providedExports = true;
        config.resolve.alias = {
            ...config.resolve.alias,
            sharp$: false,
            "onnxruntime-node$": false,
        };
        return config;
    },

    // Override the default webpack configuration
    experimental: {
        serverComponentsExternalPackages: ["sharp", "onnxruntime-node"],
        esmExternals: "loose",
    },
};

module.exports = nextConfig;
