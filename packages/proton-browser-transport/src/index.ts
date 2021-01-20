import {LinkSession, LinkTransport} from '@proton/link'
import {SigningRequest} from '@proton/signing-request'
import * as qrcode from 'qrcode'
import styleSelector from './styles'

export interface BrowserTransportOptions {
    /** CSS class prefix, defaults to `@proton/link` */
    classPrefix?: string
    /** Whether to inject CSS styles in the page header, defaults to true. */
    injectStyles?: boolean
    /** Whether to display request success and error messages, defaults to true */
    requestStatus?: boolean
    /** Requesting account of the dapp (optional) */
    requestAccount?: string
    /** Wallet name e.g. proton, anchor, etc */
    walletType?: string
    /** Option to include back button in transport modal */
    backButton?: boolean
}

interface footNoteDownloadLinks {
    [key: string]: string
}

const footnoteLinks : footNoteDownloadLinks = {
    proton: 'https://protonchain.com/wallet',
    anchor: 'https://greymass.com/en/anchor/'
}

export default class BrowserTransport implements LinkTransport {
    constructor(public readonly options: BrowserTransportOptions = {}) {
        this.classPrefix = options.classPrefix || 'proton-link'
        this.injectStyles = !(options.injectStyles === false)
        this.requestStatus = !(options.requestStatus === false)
        this.requestAccount = options.requestAccount || ''
        this.walletType = options.walletType || 'proton'
        this.backButton = !(options.backButton === false)
    }

    private classPrefix: string
    private injectStyles: boolean
    private requestStatus: boolean
    private requestAccount: string
    private walletType: string
    private backButton: boolean
    private activeRequest?: SigningRequest
    private activeCancel?: (reason: string | Error) => void
    private containerEl!: HTMLElement
    private requestEl!: HTMLElement
    private styleEl?: HTMLStyleElement
    private font?: HTMLLinkElement
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

    private setupElements(title = '') {
        if (this.injectStyles && !this.styleEl) {
            this.font = document.createElement('link')
            this.font.href = 'https://fonts.cdnfonts.com/css/circular-std-book'
            this.font.rel = 'stylesheet';
            this.styleEl = document.createElement('style')
            this.styleEl.type = 'text/css'
            const css = styleSelector(this.walletType).replace(/%prefix%/g, this.classPrefix)
            this.styleEl.appendChild(document.createTextNode(css))
            this.styleEl.appendChild(this.font)
            document.head.appendChild(this.styleEl)
        }
        if (!this.containerEl) {
            this.clearDuplicateContainers()
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
            const navHeader = this.createEl({
                class: 'header',
                tag: 'span',
                text: '',
            })
            if (this.backButton) {
                const backButton = this.createEl({class: 'back' })
                backButton.onclick = (event) => {
                    event.stopPropagation()
                    this.closeModal()
                    document.dispatchEvent(new CustomEvent('backToSelector'))
                }
                nav.appendChild(backButton)
            }
            const closeButton = this.createEl({class: 'close'})
            closeButton.onclick = (event) => {
                event.stopPropagation()
                this.closeModal()
            }
            this.requestEl = this.createEl({class: 'request'})
            nav.appendChild(navHeader)
            nav.appendChild(closeButton)
            wrapper.appendChild(nav)
            wrapper.appendChild(this.requestEl)
            this.containerEl.appendChild(wrapper)
        }
        document.getElementsByClassName(`${this.classPrefix}-header`)[0].textContent = title
    }

    private clearDuplicateContainers() {
        const elements = document.getElementsByClassName(this.classPrefix)
        while(elements.length > 0) {
            elements[0].remove()
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

    private async displayRequest(request: any) {
        this.setupElements('Scan the QR-Code')

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
            text: `Open ${this.walletType.replace(/\b[a-z]/g, (letter) => letter.toUpperCase())} Wallet`,
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
        const isIdentity = request.isIdentity()
        if (isIdentity) {
            footnoteEl = this.createEl({class: 'footnote', text: `Don't have ${this.walletType.replace(/\b[a-z]/g, (letter) => letter.toUpperCase())} Wallet? `})
            const footnoteLink = this.createEl({
                tag: 'a',
                target: '_blank',
                href: footnoteLinks[this.walletType],
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
        this.setupElements('Pending...')

        const timeout = session.metadata.timeout || 60 * 1000 * 2
        const deviceName = session.metadata.name

        const start = Date.now()
        const countdown = this.createEl({class: 'countdown', tag: 'span', text: ''})

        const updateCountdown = () => {
            const timeLeft = timeout + start - Date.now()
            const timeFormatted =
                timeLeft > 0 ? new Date(timeLeft).toISOString().substr(14, 5) : '00:00'
            countdown.textContent = `${timeFormatted}`
        }
        this.countdownTimer = global.setInterval(updateCountdown, 500)
        updateCountdown()

        const infoEl = this.createEl({class: 'info'})
        const infoTitle = this.createEl({class: 'title', tag: 'span', text: 'Confirm request'})
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
        this.requestEl.appendChild(countdown)
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

    public onSuccess(request: SigningRequest) {
        if (request === this.activeRequest) {
            this.clearTimers()
            if (this.requestStatus) {
                this.setupElements('Success')
                const infoEl = this.createEl({class: 'info'})
                const logoEl = this.createEl({class: 'logo'})
                logoEl.classList.add('success')
                const info = request.isIdentity() ? 'Your wallet was successfully linked' : 'Your transaction was successfully signed'
                const infoTitle = this.createEl({class: 'title', tag: 'span', text: info})
                infoEl.appendChild(infoTitle)
                emptyElement(this.requestEl)
                this.requestEl.appendChild(logoEl)
                this.requestEl.appendChild(infoEl)
                this.show()
                this.closeTimer = global.setTimeout(() => {
                    this.hide()
                }, 1.5 * 1000)
            } else {
                this.hide()
            }
        }
    }

    public onFailure(request: SigningRequest, error: Error | any) {
        if (request === this.activeRequest && error['code'] !== 'E_CANCEL') {
            this.clearTimers()
            if (this.requestStatus) {
                this.setupElements('Transaction Failed')
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