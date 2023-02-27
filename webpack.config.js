// import path from 'path';
const path = require('path')
// import { fileURLToPath } from 'url'
const { fileURLToPath } = require('url')

export default {
  entry: './src/index.js',
  target:"node",
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
  },
};