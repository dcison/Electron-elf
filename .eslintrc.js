/*
 * @LastEditors: Dcison
 * @LastEditTime: 2021-01-31 16:11:34
 * @Description:
 */
module.exports = {
  env: {
    browser: true,
    commonjs: true,
    es2021: true,
  },
  extends: [
    'airbnb-base',
  ],
  parserOptions: {
    ecmaVersion: 12,
  },
  rules: {
    'no-prototype-builtins': 'warn',
    'no-plusplus': 'warn',

  },
};
