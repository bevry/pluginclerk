/* eslint no-console:0 */
'use strict'

// Import
const joe = require('joe')
const assert = require('assert-helpers')
const PluginClerk = require('../')

// Prepare
const ACHIEVABLE_TOTAL_DOCPAD_PLUGINS = 100
const DELAY_MILLISECONDS = 100

// Task
joe.describe('pluginclerk', function (describe) {
	let pluginClerk, totalPlugins, totalPrefixedPlugins

	describe('setup', function (describe, it) {
		it('should fail to instantiate with no keyword', function () {
			let err = null
			try {
				pluginClerk = new PluginClerk()
			}
			catch (_err) {
				err = _err
			}
			assert.errorEqual(err, 'The plugin clerk requires a keyword to be specified')
		})

		it('should instantiate successfully with a keyword', function () {
			pluginClerk = PluginClerk.create({
				keyword: 'docpad-plugin',
				log: console.log
			})
		})

		it('should fetch the database successfully', function (next) {
			pluginClerk.fetchDatabase({}, function (err, database) {
				assert.errorEqual(err, null, 'no error to occur')
				totalPlugins = Object.keys(database).length
				assert.equal(totalPlugins > ACHIEVABLE_TOTAL_DOCPAD_PLUGINS, true, `should have fetched over ${ACHIEVABLE_TOTAL_DOCPAD_PLUGINS} plugins, it fetched ${totalPlugins}`)
				next()
			})
		})
	})

	describe('setup', function (describe, it) {
		it('should instantiate successfully with a keyword and prefix', function () {
			pluginClerk = PluginClerk.create({
				keyword: 'docpad-plugin',
				prefix: 'docpad-plugin-',
				log: console.log
			})
		})

		it('should fetch the database successfully', function (next) {
			pluginClerk.fetchDatabase({}, function (err, database) {
				assert.errorEqual(err, null, 'no error to occur')
				totalPrefixedPlugins = Object.keys(database).length
				assert.equal(totalPrefixedPlugins > ACHIEVABLE_TOTAL_DOCPAD_PLUGINS, true, `should have fetched over ${ACHIEVABLE_TOTAL_DOCPAD_PLUGINS} prefixed plugins, it fetched ${totalPrefixedPlugins}`)
				assert.equal(totalPrefixedPlugins < totalPlugins, true, `prefixed plugins ${totalPrefixedPlugins} should be less than the total plugins ${totalPlugins}`)
				next()
			})
		})

		it('should fetch the database from cache', function (next) {
			const timeout = setTimeout(function () {
				next(new Error('Fetching the database took to long, it should have been from the cache'))
			}, DELAY_MILLISECONDS)
			pluginClerk.fetchDatabase({}, function (err, database) {
				clearTimeout(timeout)
				assert.errorEqual(err, null, 'no error to occur')
				assert.equal(Object.keys(database).length > ACHIEVABLE_TOTAL_DOCPAD_PLUGINS, true, `should have fetched over ${ACHIEVABLE_TOTAL_DOCPAD_PLUGINS} plugins`)
				next()
			})
		})
	})

	describe('plugin', function (describe, it) {
		it('should handle older version correctly', function (next) {
			const opts = {
				name: 'docpad-plugin-eco',
				dependencies: {
					docpad: '5.0.0'
				}
			}
			pluginClerk.fetchPlugin(opts, function (err, result) {
				assert.errorEqual(err, null, 'no error to occur')
				console.log(assert.inspect(result))
				assert.equal(result.success, true, 'success property to be correct')
				assert.equal(result.message, 'Successfully fetched an older and compatible version of the plugin docpad-plugin-eco', 'message property to be correct')
				assert.equal(Object.keys(result.skippedVersions).length !== 0, true, 'there were older versions that were skipped')
				assert.equal(result.latestVersion !== result.installVersion, true, 'the old version isn\'t the latest version')
				assert.deepEqual(result.installPeers, [], 'no install peers for this old version as it used engines instead of peerDependencies')
				next()
			})
		})

		it('should handle recent version correctly', function (next) {
			const opts = {
				name: 'docpad-plugin-eco',
				dependencies: {
					docpad: '6.0.0'
				}
			}
			pluginClerk.fetchPlugin(opts, function (err, result) {
				assert.errorEqual(err, null, 'no error to occur')
				console.log(assert.inspect(result))
				assert.equal(result.success, true, 'success property to be correct')
				assert.equal(result.message, 'Successfully fetched the latest and compatible version of the plugin docpad-plugin-eco', 'message property to be correct')
				assert.deepEqual(result.installPeers, [], 'no install peers for this version as we supplied it')
				next()
			})
		})

		it('should handle latest version correctly', function (next) {
			const opts = {
				name: 'docpad-plugin-eco'
			}
			pluginClerk.fetchPlugin(opts, function (err, result) {
				assert.errorEqual(err, null, 'no error to occur')
				console.log(assert.inspect(result))
				assert.equal(result.success, true, 'success property to be correct')
				assert.equal(result.message, 'Successfully fetched the latest and compatible version of the plugin docpad-plugin-eco', 'message property to be correct')
				assert.equal(Object.keys(result.skippedVersions).length === 0, true, 'the install/latest version should have no skipped dependencies')
				assert.equal(result.latestVersion === result.installVersion, true, 'the install version should be the latest version')
				assert.deepEqual(result.installPeers, ['docpad'], 'we should need to install the peer dependency docpad, as it was not supplied as an existing dependency')
				next()
			})
		})
	})

	describe('plugins', function (describe, it) {
		it('should fetch the latest plugins successfully', function (next) {
			pluginClerk.fetchPlugins({}, function (err, results) {
				assert.errorEqual(err, null, 'no error to occur')
				assert.equal(results.success, true, 'success property to be correct')
				assert.equal(results.message, 'Successfully fetched the plugins', 'message property to be correct')

				assert.equal(Object.keys(results.plugins).length > ACHIEVABLE_TOTAL_DOCPAD_PLUGINS, true, `should have fetched over ${ACHIEVABLE_TOTAL_DOCPAD_PLUGINS} plugins`)
				const result = results.plugins['docpad-plugin-eco']
				console.log(assert.inspect(result))
				assert.equal(result.description.length !== 0, true, 'description property should exist')
				assert.equal(result.homepage.length !== 0, true, 'homepage property should exist')
				assert.equal(result.version.length !== 0, true, 'version property should exist')

				assert.equal(result.compatibility != null, false, 'compatibility property should not exist')
				next()
			})
		})

		it('should fetch the latest compatible plugins successfully', function (next) {
			const opts = {
				dependencies: {
					docpad: '5.0.0'
				}
			}
			pluginClerk.fetchPlugins(opts, function (err, results) {
				assert.errorEqual(err, null, 'no error to occur')
				assert.equal(results.success, true, 'success property to be correct')
				assert.equal(results.message, 'Successfully fetched the plugins', 'message property to be correct')

				assert.equal(Object.keys(results.plugins).length > ACHIEVABLE_TOTAL_DOCPAD_PLUGINS, true, `should have fetched over ${ACHIEVABLE_TOTAL_DOCPAD_PLUGINS} plugins`)
				const result = results.plugins['docpad-plugin-eco']
				console.log(assert.inspect(result))
				assert.equal(result.description.length !== 0, true, 'description property should exist')
				assert.equal(result.homepage.length !== 0, true, 'homepage property should exist')
				assert.equal(result.version.length !== 0, true, 'version property should exist')

				assert.equal(result.compatibility != null, true, 'compatibility property should exist')
				next()
			})
		})
	})

})
