
<!-- TITLE/ -->

# pluginclerk

<!-- /TITLE -->


<!-- BADGES/ -->

[![Build Status](https://img.shields.io/travis/bevry/pluginclerk/master.svg)](http://travis-ci.org/bevry/pluginclerk "Check this project's build status on TravisCI")
[![NPM version](https://img.shields.io/npm/v/pluginclerk.svg)](https://npmjs.org/package/pluginclerk "View this project on NPM")
[![NPM downloads](https://img.shields.io/npm/dm/pluginclerk.svg)](https://npmjs.org/package/pluginclerk "View this project on NPM")
[![Dependency Status](https://img.shields.io/david/bevry/pluginclerk.svg)](https://david-dm.org/bevry/pluginclerk)
[![Dev Dependency Status](https://img.shields.io/david/dev/bevry/pluginclerk.svg)](https://david-dm.org/bevry/pluginclerk#info=devDependencies)<br/>
[![Gratipay donate button](https://img.shields.io/gratipay/bevry.svg)](https://www.gratipay.com/bevry/ "Donate weekly to this project using Gratipay")
[![Flattr donate button](https://img.shields.io/badge/flattr-donate-yellow.svg)](http://flattr.com/thing/344188/balupton-on-Flattr "Donate monthly to this project using Flattr")
[![PayPayl donate button](https://img.shields.io/badge/paypal-donate-yellow.svg)](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=QB8GQPZAH84N6 "Donate once-off to this project using Paypal")
[![BitCoin donate button](https://img.shields.io/badge/bitcoin-donate-yellow.svg)](https://bevry.me/bitcoin "Donate once-off to this project using BitCoin")
[![Wishlist browse button](https://img.shields.io/badge/wishlist-donate-yellow.svg)](https://bevry.me/wishlist "Buy an item on our wishlist for us")

<!-- /BADGES -->


<!-- DESCRIPTION/ -->

A clerk for retrieving compatible plugins from the npm database

<!-- /DESCRIPTION -->


<!-- INSTALL/ -->

## Install

### [NPM](http://npmjs.org/)
- Use: `require('pluginclerk')`
- Install: `npm install --save pluginclerk`

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

## History
[Discover the change history by heading on over to the `HISTORY.md` file.](https://github.com/bevry/pluginclerk/blob/master/HISTORY.md#files)

<!-- /HISTORY -->


<!-- CONTRIBUTE/ -->

## Contribute

[Discover how you can contribute by heading on over to the `CONTRIBUTING.md` file.](https://github.com/bevry/pluginclerk/blob/master/CONTRIBUTING.md#files)

<!-- /CONTRIBUTE -->


<!-- BACKERS/ -->

## Backers

### Maintainers

These amazing people are maintaining this project:

- Benjamin Lupton <b@lupton.cc> (https://github.com/balupton)

### Sponsors

No sponsors yet! Will you be the first?

[![Gratipay donate button](https://img.shields.io/gratipay/bevry.svg)](https://www.gratipay.com/bevry/ "Donate weekly to this project using Gratipay")
[![Flattr donate button](https://img.shields.io/badge/flattr-donate-yellow.svg)](http://flattr.com/thing/344188/balupton-on-Flattr "Donate monthly to this project using Flattr")
[![PayPayl donate button](https://img.shields.io/badge/paypal-donate-yellow.svg)](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=QB8GQPZAH84N6 "Donate once-off to this project using Paypal")
[![BitCoin donate button](https://img.shields.io/badge/bitcoin-donate-yellow.svg)](https://bevry.me/bitcoin "Donate once-off to this project using BitCoin")
[![Wishlist browse button](https://img.shields.io/badge/wishlist-donate-yellow.svg)](https://bevry.me/wishlist "Buy an item on our wishlist for us")

### Contributors

No contributors yet! Will you be the first?
[Discover how you can contribute by heading on over to the `CONTRIBUTING.md` file.](https://github.com/bevry/pluginclerk/blob/master/CONTRIBUTING.md#files)

<!-- /BACKERS -->


<!-- LICENSE/ -->

## License

Unless stated otherwise all works are:

- Copyright &copy; 2015+ Bevry Pty Ltd <us@bevry.me> (http://bevry.me)

and licensed under:

- The incredibly [permissive](http://en.wikipedia.org/wiki/Permissive_free_software_licence) [MIT License](http://opensource.org/licenses/mit-license.php)

<!-- /LICENSE -->


