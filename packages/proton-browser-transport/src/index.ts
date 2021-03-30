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
            window.location.href = sameDeviceUri
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
        if (isMobile() || this.walletType == 'anchor') {
            actionEl.appendChild(divider)
            actionEl.appendChild(linkEl)
        }

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
            request.setInfoKey('same_device', true)
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

        if (isMobile() && session.metadata.sameDevice) {
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

function isMobile() {
    return /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(navigator.userAgent)
        ||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test((navigator.userAgent).substr(0,4))
}