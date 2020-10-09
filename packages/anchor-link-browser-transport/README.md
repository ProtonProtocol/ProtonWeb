# Anchor Link - Browser Transport [![Package Version](https://img.shields.io/npm/v/anchor-link-browser-transport.svg?style=flat-square)](https://www.npmjs.com/package/anchor-link-browser-transport) ![License](https://img.shields.io/npm/l/anchor-link-browser-transport.svg?style=flat-square)

A transport library for usage of [Anchor Link](https://github.com/greymass/anchor-link) within a web browser environment.

## Basic usage

A transport is required for Anchor Link to communicate with clients. In most examples we use the browser transport with no configuration, like so:

```ts
const transport = new AnchorLinkBrowserTransport()
const link = new AnchorLink({transport})
```

Parameters can be passed to the transport during construction as an object, allowing for the following optional changes:

```ts
const transport = new AnchorLinkBrowserTransport({
    /** CSS class prefix, defaults to `anchor-link` */
    classPrefix: 'my-css-prefix',
    /** Whether to inject CSS styles in the page header, defaults to true. */
    injectStyles: true,
    /** Whether to display request success and error messages, defaults to true */
    requestStatus: false,
    /** Local storage prefix, defaults to `anchor-link`. */
    storagePrefix: 'my-localstorage-prefix',
    /**
     * Whether to use Greymass Fuel for low resource accounts, defaults to false.
     *  Note that this service is not available on all networks, and will automatically
     *  determine based on chain id if it should be enabled or not.
     */
    disableGreymassFuel: false,
})
const link = new AnchorLink({transport})
```

## Developing

You need [Make](https://www.gnu.org/software/make/), [node.js](https://nodejs.org/en/) and [yarn](https://classic.yarnpkg.com/en/docs/install) installed.

Clone the repository and run `make` to checkout all dependencies and build the project. See the [Makefile](./Makefile) for other useful targets. Before submitting a pull request make sure to run `make lint`.

## License

[MIT](./LICENSE.md)

---

Made with ☕️ & ❤️ by [Greymass](https://greymass.com), if you find this useful please consider [supporting us](https://greymass.com/support-us).
