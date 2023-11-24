<!-- TITLE/ -->

<h1>pluginclerk</h1>

<!-- /TITLE -->


<!-- BADGES/ -->

<span class="badge-githubworkflow"><a href="https://github.com/bevry/pluginclerk/actions?query=workflow%3Abevry" title="View the status of this project's GitHub Workflow: bevry"><img src="https://github.com/bevry/pluginclerk/workflows/bevry/badge.svg" alt="Status of the GitHub Workflow: bevry" /></a></span>
<span class="badge-npmversion"><a href="https://npmjs.org/package/pluginclerk" title="View this project on NPM"><img src="https://img.shields.io/npm/v/pluginclerk.svg" alt="NPM version" /></a></span>
<span class="badge-npmdownloads"><a href="https://npmjs.org/package/pluginclerk" title="View this project on NPM"><img src="https://img.shields.io/npm/dm/pluginclerk.svg" alt="NPM downloads" /></a></span>
<br class="badge-separator" />
<span class="badge-githubsponsors"><a href="https://github.com/sponsors/balupton" title="Donate to this project using GitHub Sponsors"><img src="https://img.shields.io/badge/github-donate-yellow.svg" alt="GitHub Sponsors donate button" /></a></span>
<span class="badge-thanksdev"><a href="https://thanks.dev/u/gh/bevry" title="Donate to this project using ThanksDev"><img src="https://img.shields.io/badge/thanksdev-donate-yellow.svg" alt="ThanksDev donate button" /></a></span>
<span class="badge-patreon"><a href="https://patreon.com/bevry" title="Donate to this project using Patreon"><img src="https://img.shields.io/badge/patreon-donate-yellow.svg" alt="Patreon donate button" /></a></span>
<span class="badge-liberapay"><a href="https://liberapay.com/bevry" title="Donate to this project using Liberapay"><img src="https://img.shields.io/badge/liberapay-donate-yellow.svg" alt="Liberapay donate button" /></a></span>
<span class="badge-buymeacoffee"><a href="https://buymeacoffee.com/balupton" title="Donate to this project using Buy Me A Coffee"><img src="https://img.shields.io/badge/buy%20me%20a%20coffee-donate-yellow.svg" alt="Buy Me A Coffee donate button" /></a></span>
<span class="badge-opencollective"><a href="https://opencollective.com/bevry" title="Donate to this project using Open Collective"><img src="https://img.shields.io/badge/open%20collective-donate-yellow.svg" alt="Open Collective donate button" /></a></span>
<span class="badge-crypto"><a href="https://bevry.me/crypto" title="Donate to this project using Cryptocurrency"><img src="https://img.shields.io/badge/crypto-donate-yellow.svg" alt="crypto donate button" /></a></span>
<span class="badge-paypal"><a href="https://bevry.me/paypal" title="Donate to this project using Paypal"><img src="https://img.shields.io/badge/paypal-donate-yellow.svg" alt="PayPal donate button" /></a></span>
<br class="badge-separator" />
<span class="badge-discord"><a href="https://discord.gg/nQuXddV7VP" title="Join this project's community on Discord"><img src="https://img.shields.io/discord/1147436445783560193?logo=discord&amp;label=discord" alt="Discord server badge" /></a></span>
<span class="badge-twitch"><a href="https://www.twitch.tv/balupton" title="Join this project's community on Twitch"><img src="https://img.shields.io/twitch/status/balupton?logo=twitch" alt="Twitch community badge" /></a></span>

<!-- /BADGES -->


<!-- DESCRIPTION/ -->

A clerk for retrieving compatible plugins from the npm database

<!-- /DESCRIPTION -->


## Usage

[Complete API Documentation.](http://master.pluginclerk.bevry.surge.sh/docs/)

```javascript
import PluginClerk from 'pluginclerk'

// Create the new clerk instance with our configuration
const clerk = new PluginClerk({
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
// as `docpad-plugin-eco` has the peerDependency `docpad`,
// and no dependencies where supplied, it should be installed
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
// as `docpad-plugin-eco` has the peerDependency `docpad`,
// and we supplied it, there is no need to install it
clerk
    .fetchPlugin({
        name: 'docpad-plugin-eco',
        requirements: { docpad: '6.78.0' },
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
// a few plugin versions where skipped because they required a `docpad` version range that our supplied `docpad` version didn't fulfill
// Note the `installPeers` result,
// as `docpad-plugin-eco` has the peerDependency `docpad`, and we supplied it, there is no need to install it
clerk
    .fetchPlugin({
        name: 'docpad-plugin-eco',
        requirements: { docpad: '5.0.0' },
    })
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
    .fetchPlugins({ requirements: { docpad: '5.0.0' } })
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
```

<!-- INSTALL/ -->

<h2>Install</h2>

<a href="https://npmjs.com" title="npm is a package manager for javascript"><h3>npm</h3></a>
<ul>
<li>Install: <code>npm install --save pluginclerk</code></li>
<li>Import: <code>import pkg from ('pluginclerk')</code></li>
<li>Require: <code>const pkg = require('pluginclerk').default</code></li>
</ul>

<a href="https://deno.land" title="Deno is a secure runtime for JavaScript and TypeScript, it is an alternative for Node.js"><h3>Deno</h3></a>

``` typescript
import pkg from 'https://unpkg.com/pluginclerk@^6.3.0/edition-deno/index.ts'
```

<h3><a href="https://editions.bevry.me" title="Editions are the best way to produce and consume packages you care about.">Editions</a></h3>

<p>This package is published with the following editions:</p>

<ul><li><code>pluginclerk/source/index.ts</code> is <a href="https://www.typescriptlang.org/" title="TypeScript is a typed superset of JavaScript that compiles to plain JavaScript. ">TypeScript</a> source code with <a href="https://babeljs.io/docs/learn-es2015/#modules" title="ECMAScript Modules">Import</a> for modules</li>
<li><code>pluginclerk</code> aliases <code>pluginclerk/edition-es2022/index.js</code></li>
<li><code>pluginclerk/edition-es2022/index.js</code> is <a href="https://www.typescriptlang.org/" title="TypeScript is a typed superset of JavaScript that compiles to plain JavaScript. ">TypeScript</a> compiled against ES2022 for <a href="https://nodejs.org" title="Node.js is a JavaScript runtime built on Chrome's V8 JavaScript engine">Node.js</a> 18 || 20 || 21 with <a href="https://nodejs.org/dist/latest-v5.x/docs/api/modules.html" title="Node/CJS Modules">Require</a> for modules</li>
<li><code>pluginclerk/edition-es2022-esm/index.js</code> is <a href="https://www.typescriptlang.org/" title="TypeScript is a typed superset of JavaScript that compiles to plain JavaScript. ">TypeScript</a> compiled against ES2022 for <a href="https://nodejs.org" title="Node.js is a JavaScript runtime built on Chrome's V8 JavaScript engine">Node.js</a> 18 || 20 || 21 with <a href="https://babeljs.io/docs/learn-es2015/#modules" title="ECMAScript Modules">Import</a> for modules</li>
<li><code>pluginclerk/edition-types/index.d.ts</code> is <a href="https://www.typescriptlang.org/" title="TypeScript is a typed superset of JavaScript that compiles to plain JavaScript. ">TypeScript</a> compiled Types with <a href="https://babeljs.io/docs/learn-es2015/#modules" title="ECMAScript Modules">Import</a> for modules</li>
<li><code>pluginclerk/edition-deno/index.ts</code> is <a href="https://www.typescriptlang.org/" title="TypeScript is a typed superset of JavaScript that compiles to plain JavaScript. ">TypeScript</a> source code made to be compatible with <a href="https://deno.land" title="Deno is a secure runtime for JavaScript and TypeScript, it is an alternative to Node.js">Deno</a></li></ul>

<!-- /INSTALL -->


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

<ul><li><a href="https://github.com/balupton">Benjamin Lupton</a> — <a href="https://github.com/bevry/pluginclerk/commits?author=balupton" title="View the GitHub contributions of Benjamin Lupton on repository bevry/pluginclerk">view contributions</a></li></ul>

<h3>Sponsors</h3>

No sponsors yet! Will you be the first?

<span class="badge-githubsponsors"><a href="https://github.com/sponsors/balupton" title="Donate to this project using GitHub Sponsors"><img src="https://img.shields.io/badge/github-donate-yellow.svg" alt="GitHub Sponsors donate button" /></a></span>
<span class="badge-thanksdev"><a href="https://thanks.dev/u/gh/bevry" title="Donate to this project using ThanksDev"><img src="https://img.shields.io/badge/thanksdev-donate-yellow.svg" alt="ThanksDev donate button" /></a></span>
<span class="badge-patreon"><a href="https://patreon.com/bevry" title="Donate to this project using Patreon"><img src="https://img.shields.io/badge/patreon-donate-yellow.svg" alt="Patreon donate button" /></a></span>
<span class="badge-liberapay"><a href="https://liberapay.com/bevry" title="Donate to this project using Liberapay"><img src="https://img.shields.io/badge/liberapay-donate-yellow.svg" alt="Liberapay donate button" /></a></span>
<span class="badge-buymeacoffee"><a href="https://buymeacoffee.com/balupton" title="Donate to this project using Buy Me A Coffee"><img src="https://img.shields.io/badge/buy%20me%20a%20coffee-donate-yellow.svg" alt="Buy Me A Coffee donate button" /></a></span>
<span class="badge-opencollective"><a href="https://opencollective.com/bevry" title="Donate to this project using Open Collective"><img src="https://img.shields.io/badge/open%20collective-donate-yellow.svg" alt="Open Collective donate button" /></a></span>
<span class="badge-crypto"><a href="https://bevry.me/crypto" title="Donate to this project using Cryptocurrency"><img src="https://img.shields.io/badge/crypto-donate-yellow.svg" alt="crypto donate button" /></a></span>
<span class="badge-paypal"><a href="https://bevry.me/paypal" title="Donate to this project using Paypal"><img src="https://img.shields.io/badge/paypal-donate-yellow.svg" alt="PayPal donate button" /></a></span>

<h3>Contributors</h3>

These amazing people have contributed code to this project:

<ul><li><a href="https://github.com/balupton">Benjamin Lupton</a> — <a href="https://github.com/bevry/pluginclerk/commits?author=balupton" title="View the GitHub contributions of Benjamin Lupton on repository bevry/pluginclerk">view contributions</a></li></ul>

<a href="https://github.com/bevry/pluginclerk/blob/master/CONTRIBUTING.md#files">Discover how you can contribute by heading on over to the <code>CONTRIBUTING.md</code> file.</a>

<!-- /BACKERS -->


<!-- LICENSE/ -->

<h2>License</h2>

Unless stated otherwise all works are:

<ul><li>Copyright &copy; 2015+ <a href="http://bevry.me">Bevry Pty Ltd</a></li></ul>

and licensed under:

<ul><li><a href="http://spdx.org/licenses/Artistic-2.0.html">Artistic License 2.0</a></li></ul>

<!-- /LICENSE -->
