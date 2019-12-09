# History

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
