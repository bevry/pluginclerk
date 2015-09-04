const eachr = require('eachr')
const semver = require('semver')
export default class PluginClerk extends require('events').EventEmitter {
	static create (...args) {
		return new this(...args)
	}

	constructor (opts) {
		super()
		this.config = {}

		if ( !opts || !opts.keyword ) {
			throw new Error('The plugin clerk requires a keyword to be specified, please refer to the API specification')
		}

		this.config.keyword = opts.keyword
		this.config.prefix = opts.prefix
		this.config.log = opts.log || null
		this.config.cacheDuration = 1000 * 60 * 60 * 24  /* one day */
		this.config.registryKeywordUrl = 'http://skimdb.npmjs.com/registry/_design/app/_view/byKeyword'

		this.database = {}
		this.lastPoll = null
		this.lastUpdate = null
	}

	log (...args) {
		if ( this.config.log ) {
			this.config.log(...args)
			return true
		}
		else {
			return false
		}
	}

	// > {name:'docpad-plugin-eco', dependencies: [/* users dependencies */]}
	// < {success, message, skippedVersions, latestVersion, installVersion, installPeers}
	getPlugin ({name, dependencies}) {
		const result = {success: false, message: null}
		const pluginData = this.database[name]

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

	// > {dependencies: {}}
	// < {success, message, plugins: {'docpad-plugin-eco': {name, description, homepage, compatabilityResult}}}
	getPlugins ({dependencies}) {
		const me = this
		const result = {success: true, message: 'Successfully fetched the plugins', plugins: {}}
		eachr(this.database, function (pluginData, pluginName) {
			const pluginResult = {
				description: pluginData.description,
				homepage: pluginData.homepage,
				version: pluginData['dist-tags'].latest
			}
			if ( dependencies ) {
				pluginResult.compatibility = me.getPlugin({name: pluginName, dependencies: dependencies})
				pluginResult.version = pluginResult.compatibility.installVersion
			}
			result.plugins[pluginName] = pluginResult
		})
		return result
	}

	fetchPlugin (opts, next) {
		const me = this
		this.fetchDatabase(null, function (err) {
			if ( err ) {
				next(err)
			}
			else {
				next(null, me.getPlugin(opts))
			}
		})
		return this
	}

	fetchPlugins (opts, next) {
		const me = this
		this.fetchDatabase(null, function (err) {
			if ( err ) {
				next(err)
			}
			else {
				next(null, me.getPlugins(opts))
			}
		})
		return this
	}

	fetchDatabase (opts, next) {
		const me = this
		const nowDate = new Date()
		const nowTime = nowDate.getTime()

		// have we fetched the database?
		if ( this.lastUpdate ) {
			// we have, so let's check if the cache is still valid
			// check to see if the current time (minus the interval) is newer than the last time we checked
			// if we have an interval of an hour, and we are now 02:00, and our last check was at 01:30, then we will compare 01:00 >= 01:30
			const cacheOutdated = new Date(nowTime - this.config.cacheDuration) >= this.lastPoll
			const cacheValid = !cacheOutdated
			if ( cacheValid ) {
				// use the cache
				process.nextTick(function () {  // avoid zalgo
					next(null, me.database)
				})
				return this
			}

			// cache is invalid, so let's continue to update it
			me.log('notice', 'Database cache has expired')
		}

		// we haven't fetched the database yet, let's check to see if we are already trying to
		else if ( this.lastPoll ) {
			// we are currently trying to, so just wait
			this.on('database-updated', next)
			return this
		}

		// fetch the database, either because it is the first time, or because the cache has been invalidated
		const feedOptions = {parse: 'json', log: me.log}
		const nameRegex = (/[^a-z]/)
		me.lastPoll = nowDate
		me.log('notice', 'Refreshing the database at', nowDate)
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
					.done(complete)
			}, {concurrency: 0})
			.action(function (plugins) {
				plugins.forEach(function (pluginData) {
					let code = pluginData.name
					if ( me.config.prefix ) {
						code = pluginData.name.replace(me.config.prefix, '')
						if ( code === name || nameRegex.test(code) ) {
							// invalid plugin
							me.log('warn', `Plugin ${pluginData.name} will be ignored as it has an invalid name, must be prefixed with: ${me.config.prefix}`)
							return
						}
					}
					else {
						me.log('info', `Plugin ${pluginData.name} was successfully added to the database.`)
						me.database[pluginData.name] = pluginData
					}
				})
			})
			.done(function (err) {
				me.lastUpdate = new Date()
				me.log('notice', 'Refreshing the database at', nowDate, me.lastUpdate)
				me.emit('database-updated', err, me.database)
				next(err, me.database)
			})

		// Chain
		return this
	}
}
