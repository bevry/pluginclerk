<!-- TITLE/ -->

<h1>pluginclerk</h1>

<!-- /TITLE -->


<!-- BADGES/ -->

<span class="badge-travisci"><a href="http://travis-ci.org/bevry/pluginclerk" title="Check this project's build status on TravisCI"><img src="https://img.shields.io/travis/bevry/pluginclerk/master.svg" alt="Travis CI Build Status" /></a></span>
<span class="badge-npmversion"><a href="https://npmjs.org/package/pluginclerk" title="View this project on NPM"><img src="https://img.shields.io/npm/v/pluginclerk.svg" alt="NPM version" /></a></span>
<span class="badge-npmdownloads"><a href="https://npmjs.org/package/pluginclerk" title="View this project on NPM"><img src="https://img.shields.io/npm/dm/pluginclerk.svg" alt="NPM downloads" /></a></span>
<span class="badge-daviddm"><a href="https://david-dm.org/bevry/pluginclerk" title="View the status of this project's dependencies on DavidDM"><img src="https://img.shields.io/david/bevry/pluginclerk.svg" alt="Dependency Status" /></a></span>
<span class="badge-daviddmdev"><a href="https://david-dm.org/bevry/pluginclerk#info=devDependencies" title="View the status of this project's development dependencies on DavidDM"><img src="https://img.shields.io/david/dev/bevry/pluginclerk.svg" alt="Dev Dependency Status" /></a></span>
<br class="badge-separator" />
<span class="badge-slackin"><a href="https://slack.bevry.me" title="Join this project's slack community"><img src="https://slack.bevry.me/badge.svg" alt="Slack community badge" /></a></span>
<span class="badge-patreon"><a href="http://patreon.com/bevry" title="Donate to this project using Patreon"><img src="https://img.shields.io/badge/patreon-donate-yellow.svg" alt="Patreon donate button" /></a></span>
<span class="badge-gratipay"><a href="https://www.gratipay.com/bevry" title="Donate weekly to this project using Gratipay"><img src="https://img.shields.io/badge/gratipay-donate-yellow.svg" alt="Gratipay donate button" /></a></span>
<span class="badge-flattr"><a href="https://flattr.com/profile/balupton" title="Donate to this project using Flattr"><img src="https://img.shields.io/badge/flattr-donate-yellow.svg" alt="Flattr donate button" /></a></span>
<span class="badge-paypal"><a href="https://bevry.me/paypal" title="Donate to this project using Paypal"><img src="https://img.shields.io/badge/paypal-donate-yellow.svg" alt="PayPal donate button" /></a></span>
<span class="badge-bitcoin"><a href="https://bevry.me/bitcoin" title="Donate once-off to this project using Bitcoin"><img src="https://img.shields.io/badge/bitcoin-donate-yellow.svg" alt="Bitcoin donate button" /></a></span>
<span class="badge-wishlist"><a href="https://bevry.me/wishlist" title="Buy an item on our wishlist for us"><img src="https://img.shields.io/badge/wishlist-donate-yellow.svg" alt="Wishlist browse button" /></a></span>

<!-- /BADGES -->


<!-- DESCRIPTION/ -->

A clerk for retrieving compatible plugins from the npm database

<!-- /DESCRIPTION -->


<!-- INSTALL/ -->

<h2>Install</h2>

<a href="https://npmjs.com" title="npm is a package manager for javascript"><h3>NPM</h3></a><ul>
<li>Install: <code>npm install --save pluginclerk</code></li>
<li>Module: <code>require('pluginclerk')</code></li></ul>

<a href="http://browserify.org" title="Browserify lets you require('modules') in the browser by bundling up all of your dependencies"><h3>Browserify</h3></a><ul>
<li>Install: <code>npm install --save pluginclerk</code></li>
<li>Module: <code>require('pluginclerk')</code></li>
<li>CDN URL: <code>//wzrd.in/bundle/pluginclerk@1.1.0</code></li></ul>

<a href="http://enderjs.com" title="Ender is a full featured package manager for your browser"><h3>Ender</h3></a><ul>
<li>Install: <code>ender add pluginclerk</code></li>
<li>Module: <code>require('pluginclerk')</code></li></ul>

<h3><a href="https://github.com/bevry/editions" title="Editions are the best way to produce and consume packages you care about.">Editions</a></h3>

<p>This package is published with the following editions:</p>

<ul><li><code>pluginclerk</code> aliases <code>pluginclerk/index.js</code> which uses <a href="https://github.com/bevry/editions" title="Editions are the best way to produce and consume packages you care about.">Editions</a> to automatically select the correct edition for the consumers environment</li>
<li><code>pluginclerk/source/index.js</code> is Source + <a href="https://babeljs.io/docs/learn-es2015/" title="ECMAScript Next">ESNext</a> + <a href="https://nodejs.org/dist/latest-v5.x/docs/api/modules.html" title="Node/CJS Modules">Require</a></li>
<li><code>pluginclerk/es2015/index.js</code> is <a href="https://babeljs.io" title="The compiler for writing next generation JavaScript">Babel</a> Compiled + <a href="http://babeljs.io/docs/plugins/preset-es2015/" title="ECMAScript 2015">ES2015</a> + <a href="https://nodejs.org/dist/latest-v5.x/docs/api/modules.html" title="Node/CJS Modules">Require</a></li></ul>

<p>Older environments may need <a href="https://babeljs.io/docs/usage/polyfill/" title="A polyfill that emulates missing ECMAScript environment features">Babel's Polyfill</a> or something similar.</p>

<!-- /INSTALL -->


## Usage

``` javascript
const clerk = require('pluginclerk').create({
	// Required: The keyword that must be specified inside the plugin's package.json:keywords property
	keyword: 'docpad-plugin',

	// Optional: A prefix that the name of the plugin must be prefixed by to be valid
	// Defaults to nothing
	prefix: 'docpad-plugin-',

	// Optional: A function used for logging receives the arguments (logLevel, ...message)
	// Defaults to nothing
	log: console.log,

	// Optional: The amount of milliseconds until we have to query the npm database again
	// Defaults to one day
	cacheDuration: null,

	// Optional: The URL of the npm registry's byKeyword view that we should use for fetching the plugins
	// Defaults to http://skimdb.npmjs.com/registry/_design/app/_view/byKeyword
	registryKeywordUrl: null
})

// Fetch the latest version of a particular plugin
// Note the `installPeers` result,
//   as `docpad-plugin-eco` has the peerDependency `docpad`, and no dependencies where supplied, it should be installed
clerk.fetchPlugin({name: 'docpad-plugin-eco'}, function (err, result) {
	/* result will be an object like {
		success: true,
		message: 'Successfully fetched the latest and compatible version of the plugin docpad-plugin-eco',
		skippedVersions: {},
		latestVersion: '2.1.0',
		installVersion: '2.1.0',
		installPeers: [ 'docpad' ]
	} */
})

// Fetch the latest version of a particular plugin that is compatible with the specified dependencies
// Note the `installPeers` result,
//   as `docpad-plugin-eco` has the peerDependency `docpad`, and we supplied it, there is no need to install it
clerk.fetchPlugin({name: 'docpad-plugin-eco', dependencies: {docpad: '6.78.0'}}, function (err, result) {
	/* result will be an object like {
		success: true,
		message: 'Successfully fetched the latest and compatible version of the plugin docpad-plugin-eco',
		skippedVersions: {},
		latestVersion: '2.1.0',
		installVersion: '2.1.0',
		installPeers: [ ]
	} */
})

// Fetch the latest version of a particular plugin that is compatible with the specified dependencies
// Note the `installVersion` and `skippedVersions` results,
//   a few plugin versions where skipped because they required a `docpad` version range that our supplied `docpad` version didn't fulfill
// Note the `installPeers` result
//   as `docpad-plugin-eco` has the peerDependency `docpad`, and we supplied it, there is no need to install it
clerk.fetchPlugin({name: 'docpad-plugin-eco', dependencies: {docpad: '5.0.0'}}, function (err, result) {
	/* result will be an object like {
		success: true,
		message: 'Successfully fetched an older and compatible version of the plugin docpad-plugin-eco',
		skippedVersions: {
			'2.1.0': { docpad: '^6.59.0' }
			'2.0.0': { docpad: '^6.53.0' }
		},
		latestVersion: '2.1.0',
		installVersion: '1.0.0',
		installPeers: [] }
	} */
})

// You can also fetch all plugins with some basic information
clerk.fetchPlugins({}, function (err, result) {
	/* result will be an object like {
		success: true,
		message: 'Successfully fetched the plugins',
		plugins: {
			'docpad-plugin-eco': {
				'description': '...',
				'homepage': '...',
				'version': '2.1.0'
			}
		}
	} */
})

// You can also fetch all plugins with their compatibility information
clerk.fetchPlugins({dependencies: {docpad: '5.0.0'}}, function (err, result) {
	/* result will be an object like {
		success: true,
		message: 'Successfully fetched the plugins',
		plugins: {
			'docpad-plugin-eco': {
				'description': '...',
				'homepage': '...',
				'version': '1.0.0',
				'compatibility': {}  // result of fetchPlugin
			}
		}
	} */
})
```

<!-- HISTORY/ -->

<h2>History</h2>

<a href="https://github.com/bevry/pluginclerk/blob/master/HISTORY.md#files">Discover the release history by heading on over to the <code>HISTORY.md</code> file.</a>

<!-- /HISTORY -->


<!-- CONTRIBUTE/ -->

<h2>Contribute</h2>

<a href="https://github.com/bevry/pluginclerk/blob/master/CONTRIBUTING.md#files">Discover how you can contribute by heading on over to the <code>CONTRIBUTING.md</code> file.</a>

<!-- /CONTRIBUTE -->


<!-- BACKERS/ -->

<h2>Backers</h2>

<h3>Maintainers</h3>

These amazing people are maintaining this project:

<ul><li><a href="http://balupton.com">Benjamin Lupton</a></li></ul>

<h3>Sponsors</h3>

No sponsors yet! Will you be the first?

<span class="badge-patreon"><a href="http://patreon.com/bevry" title="Donate to this project using Patreon"><img src="https://img.shields.io/badge/patreon-donate-yellow.svg" alt="Patreon donate button" /></a></span>
<span class="badge-gratipay"><a href="https://www.gratipay.com/bevry" title="Donate weekly to this project using Gratipay"><img src="https://img.shields.io/badge/gratipay-donate-yellow.svg" alt="Gratipay donate button" /></a></span>
<span class="badge-flattr"><a href="https://flattr.com/profile/balupton" title="Donate to this project using Flattr"><img src="https://img.shields.io/badge/flattr-donate-yellow.svg" alt="Flattr donate button" /></a></span>
<span class="badge-paypal"><a href="https://bevry.me/paypal" title="Donate to this project using Paypal"><img src="https://img.shields.io/badge/paypal-donate-yellow.svg" alt="PayPal donate button" /></a></span>
<span class="badge-bitcoin"><a href="https://bevry.me/bitcoin" title="Donate once-off to this project using Bitcoin"><img src="https://img.shields.io/badge/bitcoin-donate-yellow.svg" alt="Bitcoin donate button" /></a></span>
<span class="badge-wishlist"><a href="https://bevry.me/wishlist" title="Buy an item on our wishlist for us"><img src="https://img.shields.io/badge/wishlist-donate-yellow.svg" alt="Wishlist browse button" /></a></span>

<h3>Contributors</h3>

These amazing people have contributed code to this project:

<ul><li><a href="http://balupton.com">Benjamin Lupton</a></li>
<li><a href="https://balupton.com">Benjamin Lupton</a> — <a href="https://github.com/bevry/pluginclerk/commits?author=balupton" title="View the GitHub contributions of Benjamin Lupton on repository bevry/pluginclerk">view contributions</a></li></ul>

<a href="https://github.com/bevry/pluginclerk/blob/master/CONTRIBUTING.md#files">Discover how you can contribute by heading on over to the <code>CONTRIBUTING.md</code> file.</a>

<!-- /BACKERS -->


<!-- LICENSE/ -->

<h2>License</h2>

Unless stated otherwise all works are:

<ul><li>Copyright &copy; 2015+ <a href="http://bevry.me">Bevry Pty Ltd</a></li></ul>

and licensed under:

<ul><li><a href="http://spdx.org/licenses/MIT.html">MIT License</a></li></ul>

<!-- /LICENSE -->
