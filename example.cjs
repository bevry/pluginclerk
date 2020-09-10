'use strict'

const clerk = require('./').default.create({
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

	// Optional: The registry hostname we should use for the API calls
	// Defaults to "https://registry.npmjs.org"
	registryHostname: null,
})

// Fetch the latest version of a particular plugin
// Note the `installPeers` result,
//   as `docpad-plugin-eco` has the peerDependency `docpad`, and no dependencies where supplied, it should be installed
clerk
	.fetchPlugin({ name: 'docpad-plugin-eco' })
	.then(console.log)
	.catch(console.error)

/* {
	success: true,
	message: 'Successfully fetched the latest and compatible version of the plugin docpad-plugin-eco',
	skippedVersions: {},
	latestVersion: '2.1.0',
	installVersion: '2.1.0',
	installPeers: [ 'docpad' ]
} */

// Fetch the latest version of a particular plugin that is compatible with the specified dependencies
// Note the `installPeers` result,
//   as `docpad-plugin-eco` has the peerDependency `docpad`, and we supplied it, there is no need to install it
clerk
	.fetchPlugin({
		name: 'docpad-plugin-eco',
		dependencies: { docpad: '6.78.0' },
	})
	.then(console.log)
	.catch(console.error)

/* {
	success: true,
	message: 'Successfully fetched the latest and compatible version of the plugin docpad-plugin-eco',
	skippedVersions: {},
	latestVersion: '2.1.0',
	installVersion: '2.1.0',
	installPeers: [ ]
} */

// Fetch the latest version of a particular plugin that is compatible with the specified dependencies
// Note the `installVersion` and `skippedVersions` results,
//   a few plugin versions where skipped because they required a `docpad` version range that our supplied `docpad` version didn't fulfill
// Note the `installPeers` result
//   as `docpad-plugin-eco` has the peerDependency `docpad`, and we supplied it, there is no need to install it
clerk
	.fetchPlugin({ name: 'docpad-plugin-eco', dependencies: { docpad: '5.0.0' } })
	.then(console.log)
	.catch(console.error)

/* ] {
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

// You can also fetch all plugins with some basic information
clerk.fetchPlugins({}).then(console.log).catch(console.error)

/* {
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

// You can also fetch all plugins with their compatibility information
clerk
	.fetchPlugins({ dependencies: { docpad: '5.0.0' } })
	.then(console.log)
	.catch(console.error)

/* {
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
