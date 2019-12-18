'use strict'

// Import
import satisfies from 'semver/functions/satisfies'
import { fetch } from 'fetch-h2'
import Cachely from 'cachely'

type Versions = { [name: string]: string | number }
type Ranges = { [name: string]: string }
type SkippedVersions = { [name: string]: Versions }
type Person = { name: string; email?: string; url?: string }

/** @example https://registry.npmjs.org/docpad-plugin-eco */
interface RegistryPackageResult {
	_id: string
	_rev: string
	name: string
	description: string
	'dist-tags': {
		latest: string
	}
	versions: {
		[version: string]: {
			name: string
			version: string
			description: string
			homepage: string
			license: string
			keywords: string[]
			author: Person
			maintainers: Person[]
			contributors: Person[]
			bugs: {
				url: string
			}
			repository: {
				type: string
				url: string
			}
			engines: Ranges
			main: string
			dependencies: Versions
			devDependencies: Ranges
			peerDependencies: Versions
			scripts: {
				[script: string]: string
			}
			gitHead: string
			_id: string
			_shasum?: string
			_from?: string
			_npmVersion: string
			_nodeVersion: string
			_npmUser: Person
			dist: {
				integrity?: string
				shasum: string
				tarball: string
				fileCount?: number
				unpackedSize?: number
				'npm-signature'?: string
			}
			directories: object
			_npmOperationalInternal: {
				host: string
				tmp: string
			}
		}
	}
	readme: string
	maintainers: Person[]
	time: {
		[version: string]: string
		modified: string
		created: string
	}
	author: Person
	repository: {
		type: string
		url: string
	}
	readmeFilename: string
	users: {
		[user: string]: boolean
	}
	homepage: string
	keywords: string[]
	contributors: Person[]
	bugs: {
		url: string
	}
	license: string
	_attachments: object
}

/** @example https://registry.npmjs.org/-/v1/search?text=keywords:docpad-plugin */
interface RegistrySearchResult {
	total: number
	time: string
	objects: {
		package: {
			name: string
			scope: string
			version: string
			description: string
			keywords: string[]
			date: string
			links: {
				[link: string]: string
			}
			author: {
				[prop: string]: string
			}
			publisher: {
				username: string
				email?: string
			}
			maintainers: Person[]
		}
		score: {
			final: number
			detail: {
				quality: number
				popularity: number
				maintenance: number
			}
		}
		searchScore: number
	}[]
}

interface RegistryPackageResults {
	[name: string]: RegistryPackageResult
}

interface FetchPluginsOptions {
	/** specify the `package.json` dependencies that you are using to ensure compatibility */
	dependencies?: Versions
}
interface PluginsOptions extends FetchPluginsOptions {
	/** the database result */
	database: RegistryPackageResults
}

interface FetchPluginOptions {
	/** the name of the package to process the data for */
	name: string
	/** specify the `package.json` dependencies that you are using to ensure compatibility */
	dependencies?: Versions
}
interface PluginOptions extends FetchPluginOptions {
	/** the database result */
	database: RegistryPackageResults
}

interface PluginEntry {
	/** the description for the plugin */
	description: string
	/** the homepage for the plugin */
	homepage: string
	/** the latest version for the plugin */
	version: string
	/** if {@link PluginOptions} `dependencies` was provided, then this is the getPlugin/fetchPlugin result */
	compatibility?: PluginCompatibilityResult
}

interface PluginsResult {
	/** whether or not the process succeeded */
	success: boolean
	/**  a message about success or failure */
	message: string
	/** the processed results for each plugin, mapped by plugin name */
	plugins: {
		[name: string]: PluginEntry
	}
}

interface PluginCompatibilityResultBase {
	/** whether or not the process succeeded */
	success: boolean
	/** a message about success or failure */
	message: string
}
interface PluginCompatibilityResultFailure
	extends PluginCompatibilityResultBase {
	success: false
}
interface PluginCompatibilityResultSuccess
	extends PluginCompatibilityResultBase {
	success: true
	/** if there were skipped versions to ensure compatibility, this is a mapping of the skipped version and the cause */
	skippedVersions: SkippedVersions
	/** this is the latest version available for the package */
	latestVersion: string
	/** this is the latest compatible version available for the package */
	installVersion: string
	/** this is an array of peer dependency names that are missing and would need to be installed */
	installPeers: string[]
}
type PluginCompatibilityResult =
	| PluginCompatibilityResultFailure
	| PluginCompatibilityResultSuccess

interface PluginClerkConfig {
	/** The keyword that is common among the packages we wish to fetch */
	keyword: string
	/** The prefix that the names of the packages needed to begin with to be valid to our clerk */
	prefix?: string
	/** The registry hostname including scheme */
	registryHostname: string
}

interface PluginClerkOptions extends Partial<PluginClerkConfig> {
	/** Function to send the log messages too */
	log?: (logLevel: string, ...args: any[]) => any
	/** The amount of milliseconds until we have to query the npm database again, defaults to one day */
	cacheDuration?: number
}

/** Construct our PluginClerk class, setting the configuration from the options */
export default class PluginClerk {
	protected config: PluginClerkConfig
	protected log: Function
	protected cachely: Cachely<RegistryPackageResults>
	protected lastPoll?: number
	protected lastUpdate?: number

	constructor(opts: PluginClerkOptions) {
		if (!opts || !opts.keyword) {
			throw new Error(
				'The plugin clerk requires a keyword to be specified, please refer to the API specification'
			)
		}
		this.config = {
			keyword: opts.keyword,
			prefix: opts.prefix,
			registryHostname: opts.registryHostname || 'https://registry.npmjs.org'
		}
		this.log = opts.log || function() {}
		this.cachely = new Cachely({
			retrieve: this.requestDatabase.bind(this),
			duration: opts.cacheDuration,
			log: opts.log
		})
	}

	/** Creates and returns new instance of the current class */
	static create(opts: PluginClerkOptions) {
		return new this(opts)
	}

	/**
	 * The method that fetches the result from the registry and returns it to the cachely instance
	 * @returns The fetched packages from the registry that match the keyword
	 */
	protected async requestDatabase({
		database = {},
		offset = 0
	}: { database?: RegistryPackageResults; offset?: number } = {}): Promise<
		RegistryPackageResults
	> {
		const me = this
		const nameRegex = /[^a-z0-9]/
		const url = `${me.config.registryHostname}/-/v1/search?text=keywords:${me.config.keyword}&size=250&from=${offset}`
		let data: RegistrySearchResult

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
				data.objects.map(async function(entry) {
					const name = entry.package.name
					let pluginData: RegistryPackageResult
					try {
						const response = await fetch(
							`${me.config.registryHostname}/${name}`
						)
						pluginData = await response.json()
					} catch (err) {
						return Promise.reject(err)
					}
					if (name !== pluginData.name) {
						return Promise.reject(
							new Error(
								'name result from search and from package did not match'
							)
						)
					}
					if (me.config.prefix) {
						const code = name.replace(me.config.prefix, '')
						if (code === name || nameRegex.test(code)) {
							// invalid plugin
							me.log(
								'warn',
								`Plugin ${name} will be ignored as it has an invalid name, must be prefixed with: ${me.config.prefix}`
							)
							return Promise.resolve()
						}
					}
					database[name] = pluginData
					me.log(
						'info',
						`Plugin ${name} was successfully added to the database.`
					)
					return Promise.resolve()
				})
			)
		} catch (err) {
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
			me.log(
				'info',
				'Fetched a portion of the database content, grabbing the rest'
			)
			return this.requestDatabase({ database, offset: subtotal })
		}

		me.log('notice', 'Fetched all the database content')
		return Promise.resolve(database)
	}

	/** Processes the package data for a plugin name, to return relevant install information, including consideration for dependency compatibility if provided. */
	protected getPlugin({
		database,
		name,
		dependencies = {}
	}: PluginOptions): PluginCompatibilityResult {
		const pluginData = database[name]

		if (pluginData == null) {
			return {
				message: `The requested plugin ${name} was not found in the plugin database`,
				success: false
			}
		}

		const skippedVersions: SkippedVersions = {} /* {
			'2.0.0': {
				'docpad': '^6.53.0'
			}
		} */
		const latestVersion = pluginData['dist-tags'].latest
		let installVersion: string
		let installPeers: string[] = [] /* ['docpad'] */

		try {
			// cycle through the plugins versions
			// to discover the most recent version that satisfies installed dependencies
			const pluginVersionsData = pluginData.versions
			const pluginVersionsKeysLatestFirst = Object.keys(
				pluginVersionsData
			).reverse()
			for (const pluginVersion of pluginVersionsKeysLatestFirst) {
				const pluginVersionData = pluginVersionsData[pluginVersion]
				const pluginVersionMissingPeers: string[] = []

				/* eslint no-inner-declarations:0 */
				function compat(list: Versions, type: string) {
					for (const [name, acceptedRange] of Object.entries(list)) {
						const suppliedVersion = dependencies[name]
						if (suppliedVersion) {
							if (satisfies(suppliedVersion, acceptedRange) === false) {
								if (skippedVersions[pluginVersion] == null)
									skippedVersions[pluginVersion] = {}
								skippedVersions[pluginVersion][name] = acceptedRange
							}
						} else if (type !== 'engines') {
							pluginVersionMissingPeers.push(name)
						}
					}
				}

				// cycle through the versions of the engines
				// to check if the engine dependencies are satisfied by the installed dependencies
				compat(pluginVersionData.engines || {}, 'engines')

				// cycle through the versions peer dependencies
				// to check if the peer dependencies are satisfied by the installed dependencies
				compat(pluginVersionData.peerDependencies || {}, 'dependencies')

				// check if this version is to be skipped
				if (skippedVersions[pluginVersion]) {
					continue
				}

				// version is okay, so install this one
				installVersion = pluginVersion
				installPeers = pluginVersionMissingPeers
				break
			}
		} catch (err) {
			this.log('warn', 'The compatibility checks failed with error:', err.stack)
			return {
				message: 'The compatiblity checks failed',
				success: false
			}
		}

		// Check if we found a version to install
		// @ts-ignore
		if (!installVersion) {
			return {
				message: `Failed to find a compatible version of the plugin ${name}`,
				success: false
			}
		}

		// success
		return {
			message: `Successfully fetched ${
				latestVersion === installVersion ? 'the latest' : 'an older'
			} and compatible version of the plugin ${name}`,
			success: true,
			skippedVersions,
			latestVersion,
			installVersion,
			installPeers
		}
	}

	/** Get the information for all the plugins in the database, with optional support for compatibility checks */
	protected getPlugins({
		database,
		dependencies
	}: PluginsOptions): PluginsResult {
		const result: PluginsResult = {
			success: true,
			message: 'Successfully fetched the plugins',
			plugins: {}
		}
		for (const [pluginName, pluginData] of Object.entries(database)) {
			const plugin: PluginEntry = {
				description: pluginData.description,
				homepage: pluginData.homepage,
				version: pluginData['dist-tags'].latest
			}
			if (dependencies) {
				plugin.compatibility = this.getPlugin({
					name: pluginName,
					dependencies,
					database
				})
			}
			result.plugins[pluginName] = plugin
		}
		return result
	}

	/**
	 * Fetches the database via {@link PluginClerk#fetchDatabase} and then processes the data according to {@link PluginClerk#getPlugin}
	 * @param opts - forwarded to {@link PluginClerk#getPlugin}, with `database` prefilled
	 */
	public async fetchPlugin(
		opts: FetchPluginOptions
	): Promise<PluginCompatibilityResult> {
		let database: RegistryPackageResults
		try {
			database = await this.fetchDatabase()
		} catch (err) {
			return Promise.reject(err)
		}
		return this.getPlugin({ database, ...opts })
	}

	/**
	 * Fetches the database via {@link PluginClerk#fetchDatabase} and then processes the data according to {@link PluginClerk#getPlugins}
	 * @param opts - forwarded to {@link PluginClerk#getPlugins}, with `database` prefilled
	 */
	public async fetchPlugins(opts: FetchPluginsOptions): Promise<PluginsResult> {
		let database: RegistryPackageResults
		try {
			database = await this.fetchDatabase()
		} catch (err) {
			return Promise.reject(err)
		}
		return this.getPlugins({ database, ...opts })
	}

	/** Fetches the unprocessed data for the plugins that were fetched from the registry via the caching layer */
	fetchDatabase() {
		return this.cachely.resolve()
	}
}
