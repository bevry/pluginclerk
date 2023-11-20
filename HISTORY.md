# History

## v6.1.0 2023 November 20

-   Updated dependencies, [base files](https://github.com/bevry/base), and [editions](https://editions.bevry.me) using [boundation](https://github.com/bevry/boundation)

## v6.0.0 2023 November 20

-   Retry failed requests, in case of timeouts or other issues
-   Drop `semver` dependency for [version-range](https://github.com/bevry/version-range) which is a lightweight alternative, with better ecosystem support. This might change some version resolution behaviour, especially with `0.x` and `-prerelease` versions, hence the major version bump.
-   Updated dependencies, [base files](https://github.com/bevry/base), and [editions](https://editions.bevry.me) using [boundation](https://github.com/bevry/boundation)

## v5.2.0 2023 November 15

-   Updated dependencies, [base files](https://github.com/bevry/base), and [editions](https://editions.bevry.me) using [boundation](https://github.com/bevry/boundation)

## v5.1.0 2023 November 14

-   Updated dependencies, [base files](https://github.com/bevry/base), and [editions](https://editions.bevry.me) using [boundation](https://github.com/bevry/boundation)

## v5.0.0 2023 November 1

-   Updated dependencies, [base files](https://github.com/bevry/base), and [editions](https://editions.bevry.me) using [boundation](https://github.com/bevry/boundation)
-   Updated license from [`MIT`](http://spdx.org/licenses/MIT.html) to [`Artistic-2.0`](http://spdx.org/licenses/Artistic-2.0.html)
-   Minimum required node version changed from `node: >=10` to `node: >=18` to keep up with mandatory ecosystem changes
-   Now uses the [Node.js `fetch` builtin](https://nodejs.org/api/globals.html#fetch)
-   Now skips pre-release versions, such as `docpad-plugin-eco@2.8.0-next.1606022411.1ad0d24d5425e9b8b4ba6a37099d974e6f5b12ad`

## v4.13.0 2020 September 10

-   Add `requirements` option which plugins must meet
-   Tests no longer need to be adapted for each successive DocPad release
-   Updated dependencies, [base files](https://github.com/bevry/base), and [editions](https://editions.bevry.me) using [boundation](https://github.com/bevry/boundation)

## v4.12.0 2020 August 4

-   Updated dependencies, [base files](https://github.com/bevry/base), and [editions](https://editions.bevry.me) using [boundation](https://github.com/bevry/boundation)

## v4.11.0 2020 July 22

-   Updated dependencies, [base files](https://github.com/bevry/base), and [editions](https://editions.bevry.me) using [boundation](https://github.com/bevry/boundation)

## v4.10.0 2020 June 25

-   Updated dependencies, [base files](https://github.com/bevry/base), and [editions](https://editions.bevry.me) using [boundation](https://github.com/bevry/boundation)

## v4.9.0 2020 June 22

-   Updated dependencies, [base files](https://github.com/bevry/base), and [editions](https://editions.bevry.me) using [boundation](https://github.com/bevry/boundation)

## v4.8.0 2020 June 21

-   Updated dependencies, [base files](https://github.com/bevry/base), and [editions](https://editions.bevry.me) using [boundation](https://github.com/bevry/boundation)

## v4.7.0 2020 June 20

-   Updated dependencies, [base files](https://github.com/bevry/base), and [editions](https://editions.bevry.me) using [boundation](https://github.com/bevry/boundation)

## v4.6.0 2020 June 11

-   Updated dependencies, [base files](https://github.com/bevry/base), and [editions](https://editions.bevry.me) using [boundation](https://github.com/bevry/boundation)

## v4.5.0 2020 June 10

-   Updated dependencies, [base files](https://github.com/bevry/base), and [editions](https://editions.bevry.me) using [boundation](https://github.com/bevry/boundation)

## v4.4.0 2020 May 22

-   Updated dependencies, [base files](https://github.com/bevry/base), and [editions](https://editions.bevry.me) using [boundation](https://github.com/bevry/boundation)

## v4.3.0 2020 May 21

-   Updated dependencies, [base files](https://github.com/bevry/base), and [editions](https://editions.bevry.me) using [boundation](https://github.com/bevry/boundation)

## v4.2.0 2020 May 21

-   Updated dependencies, [base files](https://github.com/bevry/base), and [editions](https://editions.bevry.me) using [boundation](https://github.com/bevry/boundation)

## v4.1.0 2020 May 11

-   Updated dependencies, [base files](https://github.com/bevry/base), and [editions](https://editions.bevry.me) using [boundation](https://github.com/bevry/boundation)

## v4.0.0 2019 December 18

-   If you are using CommonJS, you must now do `require('pluginclerk').default`
-   Updated dependencies, [base files](https://github.com/bevry/base), and [editions](https://editions.bevry.me) using [boundation](https://github.com/bevry/boundation)

## v3.1.0 2019 December 10

-   Updated dependencies, [base files](https://github.com/bevry/base), and [editions](https://editions.bevry.me) using [boundation](https://github.com/bevry/boundation)

## v3.0.0 2019 December 9

-   Converted to TypeScript
-   Result of `getPlugins` no longer changes `.version` to `.compatibility.installVersion`, use `.compatibility.installVersion` if that is what you want
-   Updated dependencies, [base files](https://github.com/bevry/base), and [editions](https://editions.bevry.me) using [boundation](https://github.com/bevry/boundation)
-   Minimum required node version changed from `node: >=0.8` to `node: >=10` to keep up with mandatory ecosystem changes

## v2.1.0 2019 September 11

-   Updated [base files](https://github.com/bevry/base) and [editions](https://editions.bevry.me) using [boundation](https://github.com/bevry/boundation)
-   Updated dependencies

## v2.0.0 2018 July 12

-   API updated to use promises instead
-   Minimum supported node version is now version 8, due to the usage of async/await
-   Updated dependencies

## v1.2.0 2017 February 27

-   Fixed registry requests failing as the default registry URL that was used no longer works, so updated to one that does
-   Updated dependencies
-   Added API docs

## v1.1.0 2016 May 27

-   Updated internal conventions
    -   Moved from [ESNextGuardian](https://github.com/bevry/esnextguardian) to [Editions](https://github.com/bevry/editions)

## v1.0.3 2015 December 10

-   Updated internal conventions

## v1.0.2 2015 September 5

-   Abstracted out cache handling into more robust [cachely package](https://github.com/bevry/cachely)

## v1.0.1 2015 September 5

-   Initial working release with prefixes

## v1.0.0 2015 September 4

-   Initial working release
