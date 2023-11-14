/* eslint no-console:0 */

// Import
import kava from 'kava'
import { equal, inspect, deepEqual, errorEqual } from 'assert-helpers'
import PluginClerk from './index.js'

// Prepare
const ACHIEVABLE_TOTAL_DOCPAD_PLUGINS = 100
const DELAY_MILLISECONDS = 100

// Task
kava.suite('pluginclerk', function (suite) {
	let pluginClerk: PluginClerk,
		totalPlugins: number,
		totalPrefixedPlugins: number,
		latestDocPadVersion: number

	suite('setup', function (suite, test) {
		test('should fetch latest docpad version for later', function (done) {
			fetch('https://unpkg.com/docpad/package.json', {})
				.then((res) => res.json())
				.then((data) => (latestDocPadVersion = data.version))
				.then(() => setImmediate(done))
				.catch(done)
		})

		test('should fail to instantiate with no keyword', function () {
			let err: any = null
			try {
				pluginClerk = new PluginClerk({})
			} catch (_err: any) {
				err = _err
			}
			errorEqual(err, 'The plugin clerk requires a keyword to be specified')
		})

		test('should instantiate successfully with a keyword', function () {
			pluginClerk = PluginClerk.create({
				keyword: 'docpad-plugin',
				log: console.log,
			})
		})

		test('should fetch the database successfully', function (next) {
			pluginClerk
				.fetchDatabase()
				.then(function (database) {
					totalPlugins = Object.keys(database).length
					equal(
						totalPlugins > ACHIEVABLE_TOTAL_DOCPAD_PLUGINS,
						true,
						`should have fetched over ${ACHIEVABLE_TOTAL_DOCPAD_PLUGINS} plugins, it fetched ${totalPlugins}`
					)
					next()
				})
				.catch(next)
		})
	})

	suite('setup', function (suite, test) {
		test('should instantiate successfully with a keyword and prefix', function () {
			pluginClerk = PluginClerk.create({
				keyword: 'docpad-plugin',
				prefix: 'docpad-plugin-',
				log: console.log,
			})
		})

		test('should fetch the database successfully', function (next) {
			pluginClerk
				.fetchDatabase()
				.then(function (database) {
					totalPrefixedPlugins = Object.keys(database).length
					equal(
						totalPrefixedPlugins > ACHIEVABLE_TOTAL_DOCPAD_PLUGINS,
						true,
						`should have fetched over ${ACHIEVABLE_TOTAL_DOCPAD_PLUGINS} prefixed plugins, it fetched ${totalPrefixedPlugins}`
					)
					equal(
						totalPrefixedPlugins < totalPlugins,
						true,
						`prefixed plugins ${totalPrefixedPlugins} should be less than the total plugins ${totalPlugins}`
					)
					next()
				})
				.catch(next)
		})

		test('should fetch the database from cache', function (next) {
			const timeout = setTimeout(function () {
				next(
					new Error(
						'Fetching the database took to long, it should have been from the cache'
					)
				)
			}, DELAY_MILLISECONDS)
			pluginClerk
				.fetchDatabase()
				.then(function (database) {
					clearTimeout(timeout)
					equal(
						Object.keys(database).length > ACHIEVABLE_TOTAL_DOCPAD_PLUGINS,
						true,
						`should have fetched over ${ACHIEVABLE_TOTAL_DOCPAD_PLUGINS} plugins`
					)
					next()
				})
				.catch(next)
		})
	})

	suite('plugin', function (suite, test) {
		test('should handle older version correctly', function (next) {
			const opts = {
				name: 'docpad-plugin-eco',
				requirements: {
					docpad: '5.0.0',
				},
			}
			pluginClerk
				.fetchPlugin(opts)
				.then(function (result) {
					console.log(inspect(result))
					equal(result.success, true, 'success property to be correct')
					equal(
						result.message,
						'Successfully fetched an older and compatible version of the plugin docpad-plugin-eco',
						'message property to be correct'
					)
					if (result.success) {
						equal(
							Object.keys(result.skippedVersions).length !== 0,
							true,
							'there were older versions that were skipped'
						)
						equal(
							result.latestVersion !== result.installVersion,
							true,
							"the old version isn't the latest version"
						)
						deepEqual(
							result.installPeers,
							[],
							'no install peers for this old version as it used engines instead of peerDependencies'
						)
					}
					next()
				})
				.catch(next)
		})

		test('should handle recent version correctly', function (next) {
			const opts = {
				name: 'docpad-plugin-eco',
				requirements: {
					docpad: latestDocPadVersion,
				},
			}
			pluginClerk
				.fetchPlugin(opts)
				.then(function (result) {
					console.log(inspect(result))
					equal(result.success, true, 'success property to be correct')
					equal(
						result.message,
						'Successfully fetched the latest and compatible version of the plugin docpad-plugin-eco',
						'message property to be correct'
					)
					if (result.success) {
						deepEqual(
							result.installPeers,
							[],
							'no install peers for this version as we supplied it'
						)
					}
					next()
				})
				.catch(next)
		})

		test('should handle latest version correctly', function (next) {
			const opts = {
				name: 'docpad-plugin-eco',
			}
			pluginClerk
				.fetchPlugin(opts)
				.then(function (result) {
					console.log(inspect(result))
					equal(result.success, true, 'success property to be correct')
					equal(
						result.message,
						'Successfully fetched the latest and compatible version of the plugin docpad-plugin-eco',
						'message property to be correct'
					)
					if (result.success) {
						equal(
							Object.keys(result.skippedVersions).length === 0,
							true,
							'the install/latest version should have no skipped dependencies'
						)
						equal(
							result.latestVersion === result.installVersion,
							true,
							'the install version should be the latest version'
						)
						deepEqual(
							result.installPeers,
							['docpad'],
							'we should need to install the peer dependency docpad, as it was not supplied as an existing dependency'
						)
					}
					next()
				})
				.catch(next)
		})
	})

	suite('plugins', function (suite, test) {
		test('should fetch the latest plugins successfully', function (next) {
			pluginClerk
				.fetchPlugins({})
				.then(function (results) {
					equal(results.success, true, 'success property to be correct')
					equal(
						results.message,
						'Successfully fetched the plugins',
						'message property to be correct'
					)

					equal(
						Object.keys(results.plugins).length >
							ACHIEVABLE_TOTAL_DOCPAD_PLUGINS,
						true,
						`should have fetched over ${ACHIEVABLE_TOTAL_DOCPAD_PLUGINS} plugins`
					)
					const result = results.plugins['docpad-plugin-eco']
					console.log(inspect(result))
					equal(
						result.description.length !== 0,
						true,
						'description property should exist'
					)
					equal(
						result.homepage.length !== 0,
						true,
						'homepage property should exist'
					)
					equal(
						result.version.length !== 0,
						true,
						'version property should exist'
					)
					equal(
						result.compatibility != null,
						false,
						'compatibility property should not exist'
					)
					next()
				})
				.catch(next)
		})

		test('should fetch the latest compatible plugins successfully', function (next) {
			const opts = {
				requirements: {
					docpad: '5.0.0',
				},
			}
			pluginClerk
				.fetchPlugins(opts)
				.then(function (results) {
					equal(results.success, true, 'success property to be correct')
					equal(
						results.message,
						'Successfully fetched the plugins',
						'message property to be correct'
					)

					equal(
						Object.keys(results.plugins).length >
							ACHIEVABLE_TOTAL_DOCPAD_PLUGINS,
						true,
						`should have fetched over ${ACHIEVABLE_TOTAL_DOCPAD_PLUGINS} plugins`
					)
					const result = results.plugins['docpad-plugin-eco']
					console.log(inspect(result))
					equal(
						result.description.length !== 0,
						true,
						'description property should exist'
					)
					equal(
						result.homepage.length !== 0,
						true,
						'homepage property should exist'
					)
					equal(
						result.version.length !== 0,
						true,
						'version property should exist'
					)

					equal(
						result.compatibility != null,
						true,
						'compatibility property should exist'
					)
					next()
				})
				.catch(next)
		})
	})
})
