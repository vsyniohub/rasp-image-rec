'use strict';

const { promisify } = require('util');
const figlet = require('figlet');

const figletAsync = promisify(figlet);

async function render(text, font = 'Big') {
  return figletAsync(text, { font });
}

module.exports = { render };
