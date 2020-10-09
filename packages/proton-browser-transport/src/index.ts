import {LinkSession, LinkStorage, LinkTransport} from '@protonprotocol/proton-link'
import {SigningRequest} from '@protonprotocol/proton-signing-request'
import * as qrcode from 'qrcode'
import styleText from './styles'

export interface BrowserTransportOptions {
    /** CSS class prefix, defaults to `@protonprotocol/proton-link` */
    classPrefix?: string
    /** Whether to inject CSS styles in the page header, defaults to true. */
    injectStyles?: boolean
    /** Whether to display request success and error messages, defaults to true */
    requestStatus?: boolean
    /** Local storage prefix, defaults to `@protonprotocol/proton-link`. */
    storagePrefix?: string
    /** Requesting account of the dapp (optional) */
    requestAccount?: string
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
        this.classPrefix = options.classPrefix || 'proton-link'
        this.injectStyles = !(options.injectStyles === false)
        this.requestStatus = !(options.requestStatus === false)
        this.storage = new Storage(options.storagePrefix || 'proton-link')
        this.requestAccount = options.requestAccount || ''
    }

    private classPrefix: string
    private injectStyles: boolean
    private requestStatus: boolean
    private requestAccount: string
    private activeRequest?: SigningRequest
    private activeCancel?: (reason: string | Error) => void
    private containerEl!: HTMLElement
    private requestEl!: HTMLElement
    private styleEl?: HTMLStyleElement
    private countdownTimer?: NodeJS.Timeout
    private closeTimer?: NodeJS.Timeout

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
            const wrapper = this.createEl({class: 'inner'})
            const nav = this.createEl({class: 'nav'})
            const backButton = this.createEl({class: 'back'})
            const navHeader = this.createEl({ class: 'header', tag: 'span', text: 'Scan the QR-code'})
            const closeButton = this.createEl({class: 'close'})
            closeButton.onclick = (event) => {
                event.stopPropagation()
                this.closeModal()
            }
            this.requestEl = this.createEl({class: 'request'})
            nav.appendChild(backButton)
            nav.appendChild(navHeader)
            nav.appendChild(closeButton)
            wrapper.appendChild(nav)
            wrapper.appendChild(this.requestEl)
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

    private async displayRequest(request) {
        this.setupElements()

        let sameDeviceRequest = request.clone()
        sameDeviceRequest.setInfoKey('same_device', true)
        sameDeviceRequest.setInfoKey('return_path', returnUrl())

        if (this.requestAccount.length > 0) {
            request.setInfoKey('req_account', this.requestAccount)
            sameDeviceRequest.setInfoKey('req_account', this.requestAccount)
        }

        let sameDeviceUri = sameDeviceRequest.encode(true, false)
        let crossDeviceUri = request.encode(true, false)

        const logoEl = this.createEl({class: 'logo'})

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
            text: 'Open Proton Wallet',
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


        const backgroundEl = this.createEl({class: 'background'})
        const divider = this.createEl({class: 'separator', text: 'OR'})

        const actionEl = this.createEl({class: 'actions'})
        actionEl.appendChild(backgroundEl)
        actionEl.appendChild(divider)
        actionEl.appendChild(linkEl)

        backgroundEl.appendChild(qrEl)

        let footnoteEl: HTMLElement = this.createEl({class: 'footnote'})
        const isIdentity = request.isIdentity();
        if (isIdentity) {
            footnoteEl = this.createEl({class: 'footnote', text: "Don't have Proton Wallet? "})
            const footnoteLink = this.createEl({
                tag: 'a',
                target: '_blank',
                href: 'https://protonchain.com',
                text: 'Download it here',
            })
            footnoteEl.appendChild(footnoteLink)
        }

        emptyElement(this.requestEl)

        this.requestEl.appendChild(logoEl)
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
            subtitle = `Please open on “${deviceName}” to review and sign the transaction.`
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
            const scheme = request.getScheme()
            window.location.href = `${scheme}://link`
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

    // private updatePrepareStatus(message: string): void {
    //     if (this.prepareStatusEl) {
    //         this.prepareStatusEl.textContent = message
    //     }
    // }

    // public async prepare(request: SigningRequest, session?: LinkSession) {
    //     this.showLoading()
    //     if (!this.fuelEnabled || !session || request.isIdentity()) {
    //         // don't attempt to cosign id request or if we don't have a session attached
    //         return request
    //     }
    //     try {
    //         const result = fuel(request, session, this.updatePrepareStatus.bind(this))
    //         const timeout = new Promise((r) => setTimeout(r, 3500)).then(() => {
    //             throw new Error('Fuel API timeout after 3500ms')
    //         })
    //         return await Promise.race([result, timeout])
    //     } catch (error) {
    //         console.info(`Not applying fuel (${error.message})`)
    //     }
    //     return request
    // }

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
