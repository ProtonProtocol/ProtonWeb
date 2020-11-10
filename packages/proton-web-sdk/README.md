# Proton Web SDK

Installation
```
npm i @protonprotocol/proton-web-sdk
yarn add @protonprotocol/proton-web-sdk
```

Usage
```javascript
import { ConnectWallet } from '@protonprotocol/proton-web-sdk'

// Constants
const appIdentifier = 'taskly'

// Pop up modal
const link = await ConnectWallet({
    linkOptions: {
        endpoints: ['https://proton.greymass.com'],
        // rpc: rpc /* Optional: if you wish to provide rpc directly instead of endpoints */
    },
    transportOptions: {
        requestAccount: 'myprotonacc', /* Optional: Your proton account */
        requestStatus: true, /* Optional: Display request success and error messages, Default true */
    },
    selectorOptions: {
        appName: 'Taskly', /* Optional: Name to show in modal, Default 'app' */
        appLogo: 'https://protondemos.com/static/media/taskly-logo.ad0bfb0f.svg', /* Optional: Logo to show in modal */
        // walletType: 'proton' /* Optional: Connect to only specified wallet (e.g. 'proton', 'anchor') */
    }
})

// Login
const { session } = await link.login(appIdentifier)
console.log('User authorization:', session.auth) // { actor: 'fred', permission: 'active }

// Save auth for reconnection on refresh
localStorage.setItem('saved-user-auth', JSON.stringify(session.auth))

// Send Transaction
const result = await session.transact({
    transaction: {
        actions: [{
            // Token contract for XUSDT
            account: 'xtokens',
            // Action name
            name: 'transfer',
            // Action parameters
            data: {
                from: session.auth.actor,
                to: 'syed',
                quantity: '0.000001 XUSDT',
                memo: 'Tip!'
            },
            authorization: [session.auth]
        }]
    },
    broadcast: true
})
console.log('Transaction ID', result.processed.id)

// Restore session after refresh
const savedUserAuth = JSON.parse(localstorage.getItem('saved-user-auth'))
const session = await link.restoreSession(appIdentifier, savedUserAuth)

// Logout
await link.removeSession(appIdentifier, session.auth)
session = undefined
localStorage.removeItem('saved-user-auth')
```