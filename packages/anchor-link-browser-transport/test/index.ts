import {Link, LinkSession} from 'anchor-link'
import {abi, ChainName} from 'eosio-signing-request'
import BrowserTransport from '../src'

const link = new Link({
    chainId: ChainName.JUNGLE,
    transport: new BrowserTransport(),
    rpc: 'https://jungle.greymass.com',
    service: 'https://link.dirty.fish',
})

function loggedIn(session: LinkSession) {
    const app = document.getElementById('app')

    app.innerHTML = `
        Logged in as <b>${session.auth.actor}@${session.auth.permission}</b><br>
        <hr>
        <div id="actions"></div>
        <div style="padding-top: 1em"><code id="log"></code><div>
    `
    const log = app.querySelector('#log')!

    const logoutButton = document.createElement('button')
    logoutButton.textContent = '🦞 log out'
    logoutButton.onclick = () => {
        removeSession()
        app.innerHTML = 'Logged out, refresh page to login again'
    }

    const fuelCheck = document.createElement('input')
    fuelCheck.type = 'checkbox'
    fuelCheck.id = 'use-fuel'

    const fuelLabel = document.createElement('label')
    fuelLabel.htmlFor = 'use-fuel'
    fuelLabel.appendChild(fuelCheck)
    fuelLabel.appendChild(document.createTextNode('⛽️'))

    const actionButton = document.createElement('button')
    actionButton.textContent = '💰 teamgreymass'
    actionButton.onclick = () => {
        actionButton.disabled = true
        let actions: abi.Action[] = [
            {
                account: 'eosio.token',
                name: 'transfer',
                authorization: [session.auth],
                data: {
                    from: session.auth.actor,
                    to: 'teamgreymass',
                    quantity: '0.0042 EOS',
                    memo: 'grey money',
                },
            },
        ]
        if (fuelCheck.checked) {
            actions.unshift({
                account: 'greymassnoop',
                name: 'noop',
                authorization: [
                    {
                        actor: 'greymassfuel',
                        permission: 'cosign',
                    },
                ],
                data: {},
            })
        }
        session
            .transact({
                actions,
                broadcast: true,
            })
            .then((result) => {
                console.log(result.processed)
                const {id} = result.processed
                log.innerHTML += `
                    Transaction sent!
                    <a href="https://jungle.bloks.io/transaction/${id}" target="_blank">${id}</a>
                    <br>
                `
            })
            .catch((error) => {
                console.log('transact error', error)
                log.innerHTML += `
                    Error: ${error.message || String(error)}
                    <br>
                `
            })
            .finally(() => {
                actionButton.disabled = false
            })
    }

    const actions = app.querySelector('#actions')
    actions.appendChild(fuelLabel)
    actions.appendChild(actionButton)
    actions.appendChild(logoutButton)
    actions.appendChild(document.createElement('br'))
}

function restoreSession(): LinkSession | undefined {
    console.log(LinkSession)
    console.log(LinkSession.restore)
    try {
        const stored = localStorage.getItem('link_session')
        if (stored) {
            const data = JSON.parse(stored)
            console.log(data)
            return LinkSession.restore(link, data)
        }
    } catch (error) {
        console.log('unable to restore session', error)
    }
}

function storeSession(session: LinkSession) {
    const data = session.serialize()
    localStorage.setItem('link_session', JSON.stringify(data))
}

function removeSession() {
    localStorage.removeItem('link_session')
}

function main() {
    let session = restoreSession()
    if (session) {
        console.log('restored', session)
        loggedIn(session)
        return
    }
    link.login('dubmledore')
        .then(({account, session}) => {
            console.log('logged in', account)
            storeSession(session)
            loggedIn(session)
        })
        .catch((error) => {
            console.error('login error', error)
            document.querySelector('#app')!.innerHTML = error.message || String(error)
        })
}

window.addEventListener('DOMContentLoaded', main)
