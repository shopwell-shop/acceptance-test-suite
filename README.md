[![NPM Version](https://img.shields.io/npm/v/%40shopwell-ag%2Facceptance-test-suite)](https://www.npmjs.com/package/@shopwell-ag/acceptance-test-suite)
[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-%23FE5196?logo=conventionalcommits&logoColor=white)](https://conventionalcommits.org)
[![License](https://img.shields.io/github/license/shopwell/acceptance-test-suite.svg)](https://github.com/shopwell-shop/acceptance-test-suite/blob/trunk/LICENSE)

# Shopwell Acceptance Test Suite

Version 14 requires the Shopwell customer contract with a single name, optional gender, and credentials-only account registration. Released platform versions through 6.7.16.0 are not supported. CI validates the current development contract at the exact source revision configured in the test workflow; stable platform version testing will resume once that contract is released.

Simplified Chinese is the default language, with Chinese country and currency defaults. Set `LANG=en-GB` (or another supported English locale) to use the English resources.

This repository remains the source code for the test suite but all guides, examples, and setup instructions is in the [documentation](https://developer.shopwell.com/docs/guides/development/testing/e2e-playwright/)

Using an AI coding agent in your project? `npx skills add shopwell/acceptance-test-suite` installs a skill for writing tests against this package.

Feel free to open [issues](https://github.com/shopwell-shop/acceptance-test-suite/issues) or [pull requests](https://github.com/shopwell-shop/acceptance-test-suite/pulls) for bugs or improvements related to the test suite code itself.
