const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const ZipPlugin = require('zip-webpack-plugin');

module.exports = (env = {}) => {
  const isDevelopment = env.NODE_ENV === 'development';

  const createConfig = (browser, manifestFile) => {
    const outputPath = path.resolve(__dirname, 'dist', browser);

    const optimization = {
      minimize: !isDevelopment,
      minimizer: [],
    };

    // Skip TerserPlugin in development mode
    if (!isDevelopment) {
      optimization.minimizer.push(
        new TerserPlugin({
          terserOptions: {
            format: {
              comments: false,
            },
            compress: {
              pure_funcs: ['console.info', 'console.log'],
            },
          },
          extractComments: false, // Prevents the creation of LICENSE.txt files
        })
      );
    }

    const rules = [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: [],
      },
    ];

    // Skip Babel loader in development mode
    if (!isDevelopment) {
      rules[0].use.push({
        loader: 'babel-loader',
        options: {
          presets: ['@babel/preset-env'],
        },
      });
    }

    return {
      entry: {
        background: './src/background.js',
        content: './src/content/content.js',
        inject: './src/inject.js',
      },
      output: {
        path: outputPath,
        filename: '[name].js',
      },
      module: {
        rules,
      },
      optimization,
      plugins: [
        new CopyWebpackPlugin({
          patterns: [
            { from: `src/${manifestFile}`, to: 'manifest.json' },
            { from: 'src/options', to: 'options' },
            { from: 'src/styles.css', to: '' },
            { from: 'src/RogueDex.png', to: '' },
            { from: 'src/images', to: 'images' },
            { from: 'src/fonts', to: 'fonts' },
            { from: 'src/content', to: 'content' },
            { from: 'src/libs', to: 'libs' },
            { from: 'src/images', to: 'images' },
          ],
        }),
        new ZipPlugin({
          path: path.resolve(__dirname, 'dist'),
          filename: `${browser}.zip`,
        }),
      ],
      performance: {
        hints: false, // Disables the size limit warnings
      },
      mode: isDevelopment ? 'development' : 'production',
    };
  };

  return [
    createConfig('chrome', 'manifest.json'),
    createConfig('firefox', 'manifest_firefox.json'),
  ];
};
