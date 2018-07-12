'use strict'

// Import
const eachr = require('eachr')
const semver = require('semver')
const fetch = require('node-fetch')

/**
@typedef {Object.<string, Object>} Database
@description an object mapped by the plugin name, containing the plugin result from the registry
*/

/**
@typedef {Object} PluginsOptions
@property {Object} [dependencies] - specify the `package.json` dependencies that you are using to ensure compatibility
@property {Database} [database] - the database result
*/

/**
@typedef {Object} PluginOptions
@property {Object} name - the name of the package to process the data for
@property {Object} [dependencies] - specify the `package.json` dependencies that you are using to ensure compatibility
@property {Database} [database] - the database result
*/

/**
@typedef {Object} PluginItem
@property {string} description - the description for the plugin
@property {string} homepage - the homepage for the plugin
@property {string} version - the latest version for the plugin
@property {PluginResult} compatibility - if {@link PluginOptions} `dependencies` was provided, then this is the getPlugin/fetchPlugin result
*/

/**
@typedef {Object} PluginsResult
@property {Boolean} success - whether or not the process succeeded
@property {string} message - a message about success or failure
@property {Object.<string, PluginItem>} plugins - the processed results for each plugin, mapped by plugin name
*/

/**
@typedef {Object} PluginResult
@property {Boolean} success - whether or not the process succeeded
@property {string} message - a message about success or failure
@property {Object} skippedVersions - if there were skipped versions to ensure compatibility, this is a mapping of the skipped version and the cause
@property {string} latestVersion - this is the latest version available for the package
@property {string} installVersion - this is the latest compatible version available for the package
@property {Array} installPeers - this is an array of peer dependency names that are missing and would need to be installed
*/

/**
Construct our PluginClerk class, setting the configuration from the options
@param {Object} opts
@param {string} opts.keyword - the keyword that is common among the packages we wish to fetch
@param {string} opts.prefix - the prefix that the names of the packages needed to begin with to be valid to our clerk
@param {Function} [opts.log] - defaults to `null`, can be a function that receives the arguments: `logLevel`, `...args`
@param {number} [opts.cacheDuration] - the amount of milliseconds until we have to query the npm database again, defaults to one day
@param {string} [opts.registryHostname="https://registry.npmjs.org"] - the registry hostname including scheme
@public
*/
class PluginClerk {
	constructor (opts) {
		this.config = {}

		if (!opts || !opts.keyword) {
			throw new Error('The plugin clerk requires a keyword to be specified, please refer to the API specification')
		}

		this.config.keyword = opts.keyword
		this.config.prefix = opts.prefix
		this.config.registryHostname = 'https://registry.npmjs.org'

		this.log = opts.log || function () { }
		this.cachely = require('cachely').create({
			retrieve: this.requestDatabase.bind(this),
			duration: opts.cacheDuration,
			log: opts.log
		})
		this.lastPoll = null
		this.lastUpdate = null
	}

	/**
	Creates and returns new instance of the current class
	@param {...*} args - the arguments to be forwarded along to the constructor
	@return {Object} The new instance.
	@static
	@public
	*/
	static create (...args) {
		return new this(...args)
	}

	/**
	Internal. The method that fetches the result from the registry and returns it to the cachely instance
	@returns {Promise<Object>} - the fetched packages from the registry that match the keyword
	@protected
	*/
	async requestDatabase ({ database = {}, offset = 0 } = {}) {
		const me = this
		const nameRegex = (/[^a-z0-9]/)
		const url = `${me.config.registryHostname}/-/v1/search?text=keywords:${me.config.keyword}&size=250&from=${offset}`
		let data = null

		me.log('notice', 'Fetching database content')

		try {
			const response = await fetch(url)
			data = await response.json()
			if (!data || !data.objects) {
				me.log('error', 'Fetched data from', url, 'had no objects', data)
				return Promise.reject(new Error('Feteched data had no objects'))
			}

			me.log('info', 'Fetching details for', data.objects.length, 'plugins')
			await Promise.all(
				data.objects.map(async function (entry) {
					const name = entry.package.name
					let pluginData = null
					try {
						const response = await fetch(`${me.config.registryHostname}/${name}`)
						pluginData = await response.json()
					}
					catch (err) {
						return Promise.reject(err)
					}
					if (name !== pluginData.name) {
						return Promise.reject(new Error('name result from search and from package did not match'))
					}
					if (me.config.prefix) {
						const code = name.replace(me.config.prefix, '')
						if (code === name || nameRegex.test(code)) {
							// invalid plugin
							me.log('warn', `Plugin ${name} will be ignored as it has an invalid name, must be prefixed with: ${me.config.prefix}`)
							return Promise.resolve()
						}
					}
					database[name] = pluginData
					me.log('info', `Plugin ${name} was successfully added to the database.`)
					return Promise.resolve()
				})
			)
		}
		catch (err) {
			me.log('error', 'Fetching database content failed', err)
			return Promise.reject(err)
		}

		// this could be optimsied further
		// option 1: fetch all the pages first, then combine them, then fetch package data
		// option 2: calculate how many pages are needed, then fetch them all at once (only possible after first page is retrieved, as we need the total)
		// option 3: do both of the above
		// however, this can be a PR by someone, as need to get this out sooner than later
		const subtotal = data.objects.length + offset
		if (subtotal + offset !== Number(data.total)) {
			me.log('info', 'Fetched a portion of the database content, grabbing the rest')
			return this.requestDatabase({ database, offset: subtotal })
		}

		me.log('notice', 'Fetched all the database content')
		return Promise.resolve(database)
	}

	/**
	Internal. Processes the package data for a plugin name, to return relevant install information, including consideration for dependency compatibility if provided.
	@param {PluginOptions} opts
	@returns {Promise<PluginResult>}
	@protected
	*/
	getPlugin ({ database, name, dependencies }) {
		const result = { success: false, message: null }
		const pluginData = database[name]

		if (!dependencies) {
			dependencies = {}
		}

		if (pluginData == null) {
			result.message = `The requested plugin ${name} was not found in the plugin database`
			return result
		}

		result.skippedVersions = {} /* {
			'2.0.0': {
				'docpad': '^6.53.0'
			}
		} */
		result.latestVersion = pluginData['dist-tags'].latest
		result.installVersion = null
		result.installPeers = [] /* ['docpad'] */

		try {
			// cycle through the plugins versions
			// to discover the most recent version that satisfies installed dependencies
			const pluginVersionsData = pluginData.versions
			const pluginVersionsKeysLatestFirst = Object.keys(pluginVersionsData).reverse()
			eachr(pluginVersionsKeysLatestFirst, function (pluginVersion) {
				const pluginVersionData = pluginVersionsData[pluginVersion]
				const pluginVersionMissingPeers = []
				function compat (list, type) {
					eachr(list || {}, function (acceptedRange, name) {
						const suppliedVersion = dependencies[name]
						if (suppliedVersion) {
							if (semver.satisfies(suppliedVersion, acceptedRange) === false) {
								if (result.skippedVersions[pluginVersion] == null) result.skippedVersions[pluginVersion] = {}
								result.skippedVersions[pluginVersion][name] = acceptedRange
							}
						}
						else if (type !== 'engines') {
							pluginVersionMissingPeers.push(name)
						}
					})
				}

				// cycle through the versions of the engines
				// to check if the engine dependencies are satisfied by the installed dependencies
				compat(pluginVersionData.engines, 'engines')

				// cycle through the versions peer dependencies
				// to check if the peer dependencies are satisfied by the installed dependencies
				compat(pluginVersionData.peerDependencies, 'dependencies')

				// check if this version is to be skipped
				if (result.skippedVersions[pluginVersion]) {
					return true  // continue
				}

				// version is okay, so install this one
				result.installVersion = pluginVersion
				result.installPeers = pluginVersionMissingPeers
				return false  // break
			})
		}
		catch (err) {
			result.message = 'The compatiblity checks failed'
			this.log('warn', 'The compatibility checks failed with error:', err.stack)
			return result
		}

		// Check if we found a version to install
		if (result.installVersion) {
			const status = result.latestVersion === result.installVersion ? 'the latest' : 'an older'
			result.success = true
			result.message = `Successfully fetched ${status} and compatible version of the plugin ${name}`
		}
		else {
			result.message = `Failed to find a compatible version of the plugin ${name}`
		}

		// Return the result
		return result
	}

	/**
	Internal. Get the information for all the plugins in the database, with optional support for compatibility checks
	@param {PluginsOptions} opts
	@returns {Promise<PluginsResult>}
	@protected
	*/
	getPlugins ({ database, dependencies }) {
		const me = this
		const result = { success: true, message: 'Successfully fetched the plugins', plugins: {} }
		eachr(database, function (pluginData, pluginName) {
			const pluginResult = {
				description: pluginData.description,
				homepage: pluginData.homepage,
				version: pluginData['dist-tags'].latest
			}
			if (dependencies) {
				pluginResult.compatibility = me.getPlugin({ name: pluginName, dependencies, database })
				pluginResult.version = pluginResult.compatibility.installVersion
			}
			result.plugins[pluginName] = pluginResult
		})
		return result
	}

	/**
	Public. Fetches the database via {@link PluginClerk#fetchDatabase} and then processes the data according to {@link PluginClerk#getPlugin}
	@param {PluginOptions} opts - forwarded to {@link PluginClerk#getPlugin}, with `database` prefilled
	@returns {Promise<PluginResult>}
	@public
	*/
	async fetchPlugin (opts = {}) {
		try {
			const database = await this.fetchDatabase()
			opts.database = database
		}
		catch (err) {
			return Promise.reject(err)
		}
		return this.getPlugin(opts)
	}

	/**
	Public. Fetches the database via {@link PluginClerk#fetchDatabase} and then processes the data according to {@link PluginClerk#getPlugins}
	@param {PluginsOptions} opts - forwarded to {@link PluginClerk#getPlugins}, with `database` prefilled
	@returns {Promise<PluginsResult>}
	@public
	*/
	async fetchPlugins (opts = {}) {
		try {
			const database = await this.fetchDatabase()
			opts.database = database
		}
		catch (err) {
			return Promise.reject(err)
		}
		return this.getPlugins(opts)
	}

	/**
	Internal. Fetches the unprocessed data for the plugins that were fetched from the registry via the caching layer
	@returns {Promise<Database>}
	@protected
	*/
	fetchDatabase () {
		return this.cachely.resolve()
	}
}

// Export
module.exports = PluginClerk
