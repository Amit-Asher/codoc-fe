const fs = require('fs');
const path = require('path');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const ScriptExtHtmlWebpackPlugin = require('script-ext-html-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CompressionPlugin = require('compression-webpack-plugin');
const webpack = require('webpack');

// on local, load custom env vars from .env file
const customEnv = {}
if (fs.existsSync('./.env')) {
    const envContents = fs.readFileSync('./.env', 'utf8');
    for (const match of envContents.matchAll(/^(?!#)(?<key>REACT_APP_[\w\d]+)=(?<value>.+)$/gm)) {
        const key = match.groups.key?.slice('REACT_APP_'.length);
        const value = match.groups.value.replace(/(^['"]|['"]$)/g, ''); // remove quotes
        customEnv[key] = value;
        console.log(`[webpack] Adding custom env var: ${key}=${value}`);
    }
}

const config = {
    mode: 'development',
    devServer: {
        port: customEnv.FRONT_DEV_SERVER_PORT || 3000,
        hot: true,
        static: {
            directory: path.join(__dirname, 'src'),
            watch: {
                ignored: /node_modules/,
                usePolling: false
            }
        },
        historyApiFallback: true // allow sub-routes to be handled by react-router on refresh
    },
    devtool: 'source-map',
    resolve: {
        extensions: ['.ts', '.tsx', '.js', '.d.ts', '.jsx', '.json', '.mjs', '.css'],
        alias: {
            'react-dnd': path.resolve(__dirname, './node_modules/react-dnd') // drag n drop
        }
    },
    module: {
        rules: [
            { test: /\.tsx?$/, exclude: [/node_modules/, /\.spec.tsx?$/], use: [{ loader: 'ts-loader', options: { transpileOnly: true } }] },
            { test: /\.(png|jpg|gif)?$/, use: 'file-loader' },
            { test: /\.svg$/, use: 'raw-loader' },
            { test: /\.css$/, use: [{ loader: 'style-loader', options: { injectType: 'singletonStyleTag' } }, 'css-loader'] },
            { test: /\.mjs$/, include: /node_modules/, type: 'javascript/auto' },
        ]
    },
    plugins: [
        new ForkTsCheckerWebpackPlugin({ typescript: { memoryLimit: 6144 } }),
        new HtmlWebpackPlugin({
            template: 'public/index.html',
            favicon: 'public/favicon.ico',
            title: 'Codoc - Collaborative Docs'
        }),
        // define src of script tag
        new ScriptExtHtmlWebpackPlugin({
            custom: [{
                test: /\.js$/,
                attribute: 'src',
                value: '/bundle.js'
            }]
        }),
        new webpack.HotModuleReplacementPlugin(),
        new webpack.DefinePlugin({
            __RUN_MODE__: JSON.stringify('development'),
            __CUSTOM_ENV__: JSON.stringify(customEnv)
        })
    ],
    entry: {
        bundle: './src/index.tsx'
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name].js'
    }
}

module.exports = config;