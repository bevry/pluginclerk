const eachr = require('eachr')
const semver = require('semver')
export default class PluginClerk {
	static create (...args) {
		return new this(...args)
	}

	constructor (opts) {
		this.config = {}

		if ( !opts || !opts.keyword ) {
			throw new Error('The plugin clerk requires a keyword to be specified, please refer to the API specification')
		}

		this.config.keyword = opts.keyword
		this.config.prefix = opts.prefix
		this.config.registryKeywordUrl = 'http://skimdb.npmjs.com/registry/_design/app/_view/byKeyword'

		this.log = opts.log || function () {}
		this.cachely = require('cachely').create({
			method: this.requestDatabase.bind(this),
			duration: opts.cacheDuration,
			log: opts.log
		})
		this.lastPoll = null
		this.lastUpdate = null
	}

	// next(err, data)
	requestDatabase (next) {
		const me = this
		const feedOptions = {parse: 'json', log: this.log}
		const nameRegex = (/[^a-z0-9]/)
		const database = {}
		me.log('notice', 'Requesting the database')
		require('chainy-core').create().require('set feed map')
			.set(me.config.registryKeywordUrl + '?startkey=[%22' + me.config.keyword + '%22]&endkey=[%22' + me.config.keyword + '%22,%7B%7D]&group_level=2')
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
						let name = pluginData.name
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

	// internal
	// > {name:'docpad-plugin-eco', dependencies: [/* users dependencies */]}
	// < {success, message, skippedVersions, latestVersion, installVersion, installPeers}
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

	// internal
	// > {dependencies: {}}
	// < {success, message, plugins: {'docpad-plugin-eco': {name, description, homepage, compatabilityResult}}}
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

	fetchPlugin (opts, next) {
		const me = this
		this.fetchDatabase(null, function (err, database) {
			if ( err ) {
				next(err)
			}
			else {
				next(null, me.getPlugin({...opts, database}))
			}
		})
		return this
	}

	fetchPlugins (opts, next) {
		const me = this
		this.fetchDatabase(null, function (err, database) {
			if ( err ) {
				next(err)
			}
			else {
				next(null, me.getPlugins({...opts, database}))
			}
		})
		return this
	}

	fetchDatabase (opts, next) {
		this.cachely.request(next)
		return this
	}
}
