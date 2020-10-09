import {LinkSession, LinkStorage, LinkTransport} from 'anchor-link'
import {SigningRequest} from 'eosio-signing-request'
import * as qrcode from 'qrcode'
import styleText from './styles'

import {fuel} from './fuel'

export interface BrowserTransportOptions {
    /** CSS class prefix, defaults to `anchor-link` */
    classPrefix?: string
    /** Whether to inject CSS styles in the page header, defaults to true. */
    injectStyles?: boolean
    /** Whether to display request success and error messages, defaults to true */
    requestStatus?: boolean
    /** Local storage prefix, defaults to `anchor-link`. */
    storagePrefix?: string
    /**
     * Whether to use Greymass Fuel for low resource accounts, defaults to false.
     * Note that this service is not available on all networks.
     * Visit https://greymass.com/en/fuel for more information.
     */
    disableGreymassFuel?: boolean
}

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

export default class BrowserTransport implements LinkTransport {
    storage: LinkStorage

    constructor(public readonly options: BrowserTransportOptions = {}) {
        this.classPrefix = options.classPrefix || 'anchor-link'
        this.injectStyles = !(options.injectStyles === false)
        this.requestStatus = !(options.requestStatus === false)
        this.fuelEnabled = options.disableGreymassFuel !== true
        this.storage = new Storage(options.storagePrefix || 'anchor-link')
    }

    private classPrefix: string
    private injectStyles: boolean
    private requestStatus: boolean
    private fuelEnabled: boolean
    private activeRequest?: SigningRequest
    private activeCancel?: (reason: string | Error) => void
    private containerEl!: HTMLElement
    private requestEl!: HTMLElement
    private styleEl?: HTMLStyleElement
    private countdownTimer?: NodeJS.Timeout
    private closeTimer?: NodeJS.Timeout
    private prepareStatusEl?: HTMLElement

    private closeModal() {
        this.hide()
        if (this.activeCancel) {
            this.activeRequest = undefined
            this.activeCancel('Modal closed')
            this.activeCancel = undefined
        }
    }

    private setupElements() {
        if (this.injectStyles && !this.styleEl) {
            this.styleEl = document.createElement('style')
            this.styleEl.type = 'text/css'
            const css = styleText.replace(/%prefix%/g, this.classPrefix)
            this.styleEl.appendChild(document.createTextNode(css))
            document.head.appendChild(this.styleEl)
        }
        if (!this.containerEl) {
            this.containerEl = this.createEl()
            this.containerEl.className = this.classPrefix
            this.containerEl.onclick = (event) => {
                if (event.target === this.containerEl) {
                    event.stopPropagation()
                    this.closeModal()
                }
            }
            document.body.appendChild(this.containerEl)
        }
        if (!this.requestEl) {
            let wrapper = this.createEl({class: 'inner'})
            let closeButton = this.createEl({class: 'close'})
            closeButton.onclick = (event) => {
                event.stopPropagation()
                this.closeModal()
            }
            this.requestEl = this.createEl({class: 'request'})
            wrapper.appendChild(this.requestEl)
            wrapper.appendChild(closeButton)
            this.containerEl.appendChild(wrapper)
        }
    }

    private createEl(attrs?: {[key: string]: string}) {
        if (!attrs) attrs = {}
        const el = document.createElement(attrs.tag || 'div')
        if (attrs) {
            for (const attr of Object.keys(attrs)) {
                const value = attrs[attr]
                switch (attr) {
                    case 'src':
                        el.setAttribute(attr, value)
                        break
                    case 'tag':
                        break
                    case 'text':
                        el.appendChild(document.createTextNode(value))
                        break
                    case 'class':
                        el.className = `${this.classPrefix}-${value}`
                        break
                    default:
                        el.setAttribute(attr, value)
                }
            }
        }
        return el
    }

    private hide() {
        if (this.containerEl) {
            this.containerEl.classList.remove(`${this.classPrefix}-active`)
        }
        this.clearTimers()
    }

    private show() {
        if (this.containerEl) {
            this.containerEl.classList.add(`${this.classPrefix}-active`)
        }
    }

    private async displayRequest(request: SigningRequest) {
        this.setupElements()

        let sameDeviceRequest = request.clone()
        sameDeviceRequest.setInfoKey('same_device', true)
        sameDeviceRequest.setInfoKey('return_path', returnUrl())

        let sameDeviceUri = sameDeviceRequest.encode(true, false)
        let crossDeviceUri = request.encode(true, false)

        const isIdentity = request.isIdentity()
        const title = isIdentity ? 'Login' : 'Sign'
        const subtitle = 'Scan the QR-code with your Anchor app.'

        const qrEl = this.createEl({class: 'qr'})
        try {
            qrEl.innerHTML = await qrcode.toString(crossDeviceUri, {
                margin: 0,
                errorCorrectionLevel: 'L',
            })
        } catch (error) {
            console.warn('Unable to generate QR code', error)
        }

        const linkEl = this.createEl({class: 'uri'})
        const linkA = this.createEl({
            tag: 'a',
            href: crossDeviceUri,
            text: 'Open Anchor app',
        })
        linkA.addEventListener('click', (event) => {
            event.preventDefault()
            if (navigator.userAgent.toLowerCase().indexOf('firefox') > -1) {
                iframe.setAttribute('src', sameDeviceUri)
            } else {
                window.location.href = sameDeviceUri
            }
        })
        linkEl.appendChild(linkA)

        const iframe = this.createEl({
            class: 'wskeepalive',
            src: 'about:blank',
            tag: 'iframe',
        })
        linkEl.appendChild(iframe)

        const infoEl = this.createEl({class: 'info'})
        const infoTitle = this.createEl({class: 'title', tag: 'span', text: title})
        const infoSubtitle = this.createEl({class: 'subtitle', tag: 'span', text: subtitle})
        infoEl.appendChild(infoTitle)
        infoEl.appendChild(infoSubtitle)

        const actionEl = this.createEl({class: 'actions'})
        actionEl.appendChild(qrEl)
        actionEl.appendChild(linkEl)

        let footnoteEl: HTMLElement
        if (isIdentity) {
            footnoteEl = this.createEl({class: 'footnote', text: "Don't have Anchor? "})
            const footnoteLink = this.createEl({
                tag: 'a',
                target: '_blank',
                href: 'https://greymass.com/anchor',
                text: 'Download Anchor app now',
            })
            footnoteEl.appendChild(footnoteLink)
        } else {
            footnoteEl = this.createEl({
                class: 'footnote',
                text: 'Anchor signing is brought to you by ',
            })
            const footnoteLink = this.createEl({
                tag: 'a',
                target: '_blank',
                href: 'https://greymass.com',
                text: 'Greymass',
            })
            footnoteEl.appendChild(footnoteLink)
        }

        emptyElement(this.requestEl)

        const logoEl = this.createEl({class: 'logo'})
        this.requestEl.appendChild(logoEl)
        this.requestEl.appendChild(infoEl)
        this.requestEl.appendChild(actionEl)
        this.requestEl.appendChild(footnoteEl)

        this.show()
    }

    public async showLoading() {
        this.setupElements()
        emptyElement(this.requestEl)
        const infoEl = this.createEl({class: 'info'})
        const infoTitle = this.createEl({class: 'title', tag: 'span', text: 'Loading'})
        const infoSubtitle = this.createEl({
            class: 'subtitle',
            tag: 'span',
            text: 'Preparing request...',
        })
        this.prepareStatusEl = infoSubtitle

        infoEl.appendChild(infoTitle)
        infoEl.appendChild(infoSubtitle)

        const logoEl = this.createEl({class: 'logo loading'})
        this.requestEl.appendChild(logoEl)
        this.requestEl.appendChild(infoEl)

        this.show()
    }

    public onRequest(request: SigningRequest, cancel: (reason: string | Error) => void) {
        this.activeRequest = request
        this.activeCancel = cancel
        this.displayRequest(request).catch(cancel)
    }

    public onSessionRequest(
        session: LinkSession,
        request: SigningRequest,
        cancel: (reason: string | Error) => void
    ) {
        if (session.metadata.sameDevice) {
            request.setInfoKey('return_path', returnUrl())
        }

        if (session.type === 'fallback') {
            this.onRequest(request, cancel)
            if (session.metadata.sameDevice) {
                // trigger directly on a fallback same-device session
                window.location.href = request.encode()
            }
            return
        }

        this.activeRequest = request
        this.activeCancel = cancel
        this.setupElements()

        const timeout = session.metadata.timeout || 60 * 1000 * 2
        const deviceName = session.metadata.name

        const start = Date.now()
        const infoTitle = this.createEl({class: 'title', tag: 'span', text: 'Sign'})

        const updateCountdown = () => {
            const timeLeft = timeout + start - Date.now()
            const timeFormatted =
                timeLeft > 0 ? new Date(timeLeft).toISOString().substr(14, 5) : '00:00'
            infoTitle.textContent = `Sign - ${timeFormatted}`
        }
        this.countdownTimer = setInterval(updateCountdown, 500)
        updateCountdown()

        const infoEl = this.createEl({class: 'info'})
        infoEl.appendChild(infoTitle)

        let subtitle: string
        if (deviceName && deviceName.length > 0) {
            subtitle = `Please open Anchor app on “${deviceName}” to review and sign the transaction.`
        } else {
            subtitle = 'Please review and sign the transaction in the linked wallet.'
        }

        const infoSubtitle = this.createEl({class: 'subtitle', tag: 'span', text: subtitle})
        infoEl.appendChild(infoSubtitle)

        emptyElement(this.requestEl)
        const logoEl = this.createEl({class: 'logo'})
        this.requestEl.appendChild(logoEl)
        this.requestEl.appendChild(infoEl)
        this.show()

        if (isAppleHandheld() && session.metadata.sameDevice) {
            window.location.href = 'anchor://link'
        }
    }

    private clearTimers() {
        if (this.closeTimer) {
            clearTimeout(this.closeTimer)
            this.closeTimer = undefined
        }
        if (this.countdownTimer) {
            clearTimeout(this.countdownTimer)
            this.countdownTimer = undefined
        }
    }

    private updatePrepareStatus(message: string): void {
        if (this.prepareStatusEl) {
            this.prepareStatusEl.textContent = message
        }
    }

    public async prepare(request: SigningRequest, session?: LinkSession) {
        this.showLoading()
        if (!this.fuelEnabled || !session || request.isIdentity()) {
            // don't attempt to cosign id request or if we don't have a session attached
            return request
        }
        try {
            const result = fuel(request, session, this.updatePrepareStatus.bind(this))
            const timeout = new Promise((r) => setTimeout(r, 3500)).then(() => {
                throw new Error('Fuel API timeout after 3500ms')
            })
            return await Promise.race([result, timeout])
        } catch (error) {
            console.info(`Not applying fuel (${error.message})`)
        }
        return request
    }

    public onSuccess(request: SigningRequest) {
        if (request === this.activeRequest) {
            this.clearTimers()
            if (this.requestStatus) {
                this.setupElements()
                const infoEl = this.createEl({class: 'info'})
                const logoEl = this.createEl({class: 'logo'})
                logoEl.classList.add('success')
                const infoTitle = this.createEl({class: 'title', tag: 'span', text: 'Success!'})
                const subtitle = request.isIdentity() ? 'Identity signed.' : 'Transaction signed.'
                const infoSubtitle = this.createEl({class: 'subtitle', tag: 'span', text: subtitle})
                infoEl.appendChild(infoTitle)
                infoEl.appendChild(infoSubtitle)
                emptyElement(this.requestEl)
                this.requestEl.appendChild(logoEl)
                this.requestEl.appendChild(infoEl)
                this.show()
                this.closeTimer = setTimeout(() => {
                    this.hide()
                }, 1.5 * 1000)
            } else {
                this.hide()
            }
        }
    }

    public onFailure(request: SigningRequest, error: Error) {
        if (request === this.activeRequest && error['code'] !== 'E_CANCEL') {
            this.clearTimers()
            if (this.requestStatus) {
                this.setupElements()
                const infoEl = this.createEl({class: 'info'})
                const logoEl = this.createEl({class: 'logo'})
                logoEl.classList.add('error')
                const infoTitle = this.createEl({
                    class: 'title',
                    tag: 'span',
                    text: 'Transaction error',
                })
                const infoSubtitle = this.createEl({
                    class: 'subtitle',
                    tag: 'span',
                    text: error.message || String(error),
                })
                infoEl.appendChild(infoTitle)
                infoEl.appendChild(infoSubtitle)
                emptyElement(this.requestEl)
                this.requestEl.appendChild(logoEl)
                this.requestEl.appendChild(infoEl)
                this.show()
            } else {
                this.hide()
            }
        }
    }
}

function emptyElement(el: HTMLElement) {
    while (el.firstChild) {
        el.removeChild(el.firstChild)
    }
}

const returnUrlAlphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
const returnUrlAlphabetLen = returnUrlAlphabet.length
/** Generate a return url with a random #fragment so mobile safari will redirect back w/o reload. */
function returnUrl() {
    let rv = window.location.href.split('#')[0] + '#'
    for (let i = 0; i < 8; i++) {
        rv += returnUrlAlphabet.charAt(Math.floor(Math.random() * returnUrlAlphabetLen))
    }
    return rv
}

function isAppleHandheld() {
    return /iP(ad|od|hone)/i.test(navigator.userAgent)
}
