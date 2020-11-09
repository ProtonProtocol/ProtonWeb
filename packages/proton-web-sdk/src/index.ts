import ProtonLinkBrowserTransport, { BrowserTransportOptions } from '@protonprotocol/proton-browser-transport'
import ProtonLink, { LinkOptions, LinkStorage, PermissionLevel } from '@protonprotocol/proton-link'
import { JsonRpc } from '@protonprotocol/protonjs'
import SupportedWallets from './supported-wallets'

class Storage implements LinkStorage {
    constructor(readonly keyPrefix: string) {}
    async write(key: string, data: string): Promise<void> {
        localStorage.setItem(this.storageKey(key), data)
    }
    async read(key: string): Promise<string | null> {
        return localStorage.getItem(this.storageKey(key))
    }
    async remove(key: string): Promise<void> {
        localStorage.removeItem(this.storageKey(key))
    }
    storageKey(key: string) {
        return `${this.keyPrefix}-${key}`
    }
}

type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

interface ConnectWalletArgs {
    linkOptions: PartialBy<LinkOptions, 'transport'> & {
        endpoints?: string | string[],
        rpc?: JsonRpc,
        storage?: LinkStorage,
        storagePrefix?: string,
        restoreSession?: boolean
    },
    transportOptions?: BrowserTransportOptions;
    selectorOptions?: {
        appName?: string,
        appLogo?: string,
        walletType?: string
        showSelector?: boolean
    }
}

export const ConnectWallet = async ({
    linkOptions = {},
    transportOptions = {},
    selectorOptions = {}
}: ConnectWalletArgs) => {
    // Add RPC if not provided
    if (!linkOptions.rpc && linkOptions.endpoints) {
        linkOptions.rpc = new JsonRpc(linkOptions.endpoints)
    }

    // Add chain ID if not present
    if (!linkOptions.chainId) {
        const info = await linkOptions.rpc!.get_info();;
        linkOptions.chainId = info.chain_id
    }

    // Add storage if not present
    if (!linkOptions.storage) {
        linkOptions.storage = new Storage(linkOptions.storagePrefix || 'proton-storage')
    }

    // Default showSelector to true
    if (selectorOptions.showSelector !== false) {
        selectorOptions.showSelector = true
    }

    // Stop restore session if no saved data
    if (linkOptions.restoreSession) {
        const savedUserAuth = await linkOptions.storage.read('user-auth')
        const walletType = await linkOptions.storage.read('wallet-type')
        if (!savedUserAuth || !walletType) {
            // clean storage to remove unexpected side effects if session restore fails
            linkOptions.storage.remove('wallet-type')
            linkOptions.storage.remove('user-auth')
            return { link: null, session: null }
        }
    }

    let session, link, loginResult

    while(!session) {
        // Create Modal Class
        const wallets = new SupportedWallets(selectorOptions.appName, selectorOptions.appLogo)

        // Determine wallet type from storage or selector modal
        let walletType = selectorOptions.walletType
        if (!walletType) {
            const storedWalletType = await linkOptions.storage.read('wallet-type')
            if (storedWalletType) {
                walletType = storedWalletType
            } else if (selectorOptions.showSelector) {
                try {
                    walletType = await wallets.displayWalletSelector()
                } catch(e) {
                    throw new Error(e)
                }
            } else {
                try {
                    throw new Error('Wallet Type Unavailable: No walletType provided and showSelector is set to false')
                } catch (e) {
                    console.error(e)
                }
            }
        }

        // Set scheme (proton default)
        switch (walletType) {
            case 'anchor':
                linkOptions.scheme = 'esr'
                break
            case 'proton': {
                // Proton Testnet
                if (linkOptions.chainId === '71ee83bcf52142d61019d95f9cc5427ba6a0d7ff8accd9e2088ae2abeaf3d3dd') {
                    linkOptions.scheme = 'proton-dev'
                } else {
                    linkOptions.scheme = 'proton'
                }
                break;
            }
            default:
                linkOptions.scheme = 'proton'
                break
        }

        // Create transport
        const transport = new ProtonLinkBrowserTransport({
            ...transportOptions,
            walletType
        })

        // Create link
        link = new ProtonLink({
            ...linkOptions,
            transport,
            walletType
        })

        // Get session based on login or restore session
        if (!linkOptions.restoreSession) {
            let backToSelector = false
            document.addEventListener('backToSelector', () => {backToSelector = true})
            try {
                loginResult = await link.login(transportOptions.requestAccount || '')
                session = loginResult.session
                linkOptions.storage.write('user-auth', JSON.stringify(session.auth))
            } catch(e) {
                if (backToSelector) {
                    document.removeEventListener('backToSelector', () => {backToSelector = true})
                    continue
                }
                return e
            }
        } else {
            const stringifiedUserAuth = await linkOptions.storage.read('user-auth')
            const parsedUserAuth = stringifiedUserAuth ? JSON.parse(stringifiedUserAuth) : {}
            const savedUserAuth : PermissionLevel = Object.keys(parsedUserAuth).length > 0 ? parsedUserAuth : null
            if (savedUserAuth) {
                session = await link.restoreSession(transportOptions.requestAccount || '', savedUserAuth)
            }
        }
    }

    // Return link, session
    return { link, session, loginResult }
}
