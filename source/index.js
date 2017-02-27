'use strict'

// Import
const eachr = require('eachr')
const semver = require('semver')

/**
Plugin Clerk Class
@constructor
@class PluginClerk
@access public
*/
class PluginClerk {
	/**
	Creates and returns new instance of the current class
	@param {...*} args - the arguments to be forwarded along to the constructor
	@return {Object} The new instance.
	@static
	@access public
	*/
	static create (...args) {
		return new this(...args)
	}

	/**
	Construct our class, setting the configuration from the options
	@param {Object} opts
	@param {string} opts.keyword - the keyword that is common among the packages we wish to fetch
	@param {string} opts.prefix - the prefix that the names of the packages needed to begin with to be valid to our clerk
	@param {Function} [opts.log] - defaults to `null`, can be a function that receives the arguments: `logLevel`, `...args`
	@param {number} [opts.cacheDuration] - the amount of milliseconds until we have to query the npm database again, defaults to one day
	@param {string} [opts.registryKeywordUrl] - the URL to the registry, will be set by default
	@access public
	*/
	constructor (opts) {
		this.config = {}

		if ( !opts || !opts.keyword ) {
			throw new Error('The plugin clerk requires a keyword to be specified, please refer to the API specification')
		}

		this.config.keyword = opts.keyword
		this.config.prefix = opts.prefix
		this.config.registryKeywordUrl = 'https://registry.npmjs.org/-/_view/byKeyword'

		this.log = opts.log || function () {}
		this.cachely = require('cachely').create({
			method: this.requestDatabase.bind(this),
			duration: opts.cacheDuration,
			log: opts.log
		})
		this.lastPoll = null
		this.lastUpdate = null
	}

	/**
	The method that fetches the result from the registry and returns it to the cachely instance
	@param {Function} next - the completion callback, accepting the arguments
	@param {Error} [next.err] - an error that may have occured
	@param {Array} [next.result] - the fetched packages from the registry that match the keyword
	@returns {void}
	@access private
	*/
	requestDatabase (next) {
		const me = this
		const feedOptions = {parse: 'json', log: this.log}
		const nameRegex = (/[^a-z0-9]/)
		const database = {}
		me.log('notice', 'Requesting the database')

		/* eslint array-callback-return:0 */
		require('chainy-core').create().require('set feed map')
			.set(`${me.config.registryKeywordUrl}?startkey=[%22${me.config.keyword}%22]&endkey=[%22${me.config.keyword}%22,%7B%7D]&group_level=2`)
			.feed(feedOptions)
			.action(function (data) {
				me.log('info', 'Fetching details for', data.rows.length, 'plugins')
				return data.rows
			})
			.map(function (row, complete) {
				const pluginName = row.key[1]
				this.create()
					.set(`http://registry.npmjs.com/${pluginName}`)
					.feed(feedOptions)
					.action(function (pluginData) {
						const name = pluginData.name
						let code = name
						if ( me.config.prefix ) {
							code = name.replace(me.config.prefix, '')
							if ( code === name || nameRegex.test(code) ) {
								// invalid plugin
								me.log('warn', `Plugin ${name} will be ignored as it has an invalid name, must be prefixed with: ${me.config.prefix}`)
								return
							}
						}
						database[name] = pluginData
						me.log('info', `Plugin ${name} was successfully added to the database.`)
					})
					.done(complete)
			}, {concurrency: 0})
			.done(function (err) {
				me.log('notice', 'Requested the database')
				next(err, database)
			})
	}

	/**
	Processes the package data for a plugin name, to return relevant install information, including consideration for dependency compatibility if provided.
	@param {Object} opts
	@param {Object} [opts.database] - the database result from {@link PluginClerk#fetchDatabase}
	@param {Object} opts.name - the name of the package name for the plugin we wish to process the data for
	@param {Object} [opts.dependencies] - this can be the dependencies that you are currently using to ensure compatibility with the fetched plugin
	@param {Function} next - the completion callback, accepting the arguments
	@param {Error} [next.err] - an error that may have occured
	@param {Object} [next.result] - the result data, in the format of:
	@param {Boolean} next.result.success - whether or not the process succeeded
	@param {string} next.result.message - a message about success or failure
	@param {Object} next.result.skippedVersions - if there were skipped versions to ensure compatibility, this is a mapping of the skipped version and the cause
	@param {string} next.result.latestVersion - this is the latest version available for the package
	@param {string} next.result.installVersion - this is the latest compatible version available for the package
	@param {Array} next.result.installPeers - this is an array of peer dependency names that are missing and would need to be installed
	@returns {void}
	@access private
	*/
	getPlugin ({database, name, dependencies}) {
		const result = {success: false, message: null}
		const pluginData = database[name]

		if ( !dependencies ) {
			dependencies = {}
		}

		if ( pluginData == null ) {
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
						if ( suppliedVersion ) {
							if ( semver.satisfies(suppliedVersion, acceptedRange) === false ) {
								if ( result.skippedVersions[pluginVersion] == null )  result.skippedVersions[pluginVersion] = {}
								result.skippedVersions[pluginVersion][name] = acceptedRange
							}
						}
						else if ( type !== 'engines' ) {
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
				if ( result.skippedVersions[pluginVersion] ) {
					return true  // continue
				}

				// version is okay, so install this one
				result.installVersion = pluginVersion
				result.installPeers = pluginVersionMissingPeers
				return false  // break
			})
		}
		catch ( err ) {
			result.message = 'The compatiblity checks failed'
			this.log('warn', 'The compatibility checks failed with error:', err.stack)
			return result
		}

		// Check if we found a version to install
		if ( result.installVersion ) {
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
	Get the information for all the plugins in the database, with optional support for compatibility checks
	@param {Object} opts
	@param {Object} [opts.database] - the database result from {@link PluginClerk#fetchDatabase}
	@param {Object} [opts.dependencies] - this can be the dependencies that you are currently using to ensure compatibility with the fetched plugin
	@param {Function} next - the completion callback, accepting the arguments
	@param {Error} [next.err] - an error that may have occured
	@param {Object} [next.result] - the result data, in the format of:
	@param {Boolean} next.result.success - whether or not the process succeeded
	@param {string} next.result.message - a message about success or failure
	@param {Object} next.result.plugins - the processed results for each plugin, mapped by plugin name
	@param {string} next.result.plugins.name.description - the description for the plugin
	@param {string} next.result.plugins.name.homepage - the homepage for the plugin
	@param {string} next.result.plugins.name.version - the latest version for the plugin
	@param {string} next.result.plugins.name.compatibility - if opts.dependencies provided, this is  {@link PluginClerk#getPlugin} result
	@returns {void}
	@access private
	*/
	getPlugins ({database, dependencies}) {
		const me = this
		const result = {success: true, message: 'Successfully fetched the plugins', plugins: {}}
		eachr(database, function (pluginData, pluginName) {
			const pluginResult = {
				description: pluginData.description,
				homepage: pluginData.homepage,
				version: pluginData['dist-tags'].latest
			}
			if ( dependencies ) {
				pluginResult.compatibility = me.getPlugin({name: pluginName, dependencies, database})
				pluginResult.version = pluginResult.compatibility.installVersion
			}
			result.plugins[pluginName] = pluginResult
		})
		return result
	}

	/**
	Fetches the database via {@link PluginClerk#fetchDatabase} and then processes the data according to {@link PluginClerk#getPlugin}
	@param {Object} opts - forwarded to {@link PluginClerk#getPlugin} with `database` prefilled
	@param {Function} next - forwarded to {@link PluginClerk#getPlugin}
	@returns {this}
	@chainable
	@access public
	*/
	fetchPlugin (opts, next) {
		const me = this
		this.fetchDatabase(null, function (err, database) {
			if ( err ) {
				next(err)
			}
			else {
				opts.database = database
				next(null, me.getPlugin(opts))
			}
		})
		return this
	}

	/**
	Fetches the database via {@link PluginClerk#fetchDatabase} and then processes the data according to {@link PluginClerk#getPlugins}
	@param {Object} opts - forwarded to {@link PluginClerk#getPlugins} with `database` prefilled
	@param {Function} next - forwarded to {@link PluginClerk#getPlugins}
	@returns {this}
	@chainable
	@access public
	*/
	fetchPlugins (opts, next) {
		const me = this
		this.fetchDatabase(null, function (err, database) {
			if ( err ) {
				next(err)
			}
			else {
				opts.database = database
				next(null, me.getPlugins(opts))
			}
		})
		return this
	}

	/**
	Fetches the unprocessed data for the plugins that were fetched from the registry via the caching layer.
	@param {Object} [opts] - not used, here for consistency only
	@param {Function} next - the results from {@link PluginClerk#requestDatabase}
	@returns {this}
	@chainable
	@access private
	*/
	fetchDatabase (opts, next) {
		this.cachely.request(next)
		return this
	}
}

// Export
module.exports = PluginClerk
