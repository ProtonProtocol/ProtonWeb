import styleText from './styles'

export default class SupportedWallets {
    constructor(public readonly name?: string, logo?: string) {
        this.appLogo = logo
        this.appName = name || 'app'
    }

    private appLogo: string | undefined
    private appName: string

    /** Container and stylesheet for Wallet Selector */
    private selectorContainerEl!: HTMLElement
    private selectorEl!: HTMLElement
    private styleEl?: HTMLStyleElement
    private font?: HTMLLinkElement

    private hideSelector() {
        if (this.selectorContainerEl) {
            this.selectorContainerEl.classList.remove(`wallet-selector-active`)
        }
    }

    private showSelector() {
        if (this.selectorContainerEl) {
            this.selectorContainerEl.classList.add(`wallet-selector-active`)
        }
    }

    private consoleError(error:string) {
        try { 
            throw new Error(error) 
        } catch(e) {
            console.error(e);
        }
    }

    private setUpSelectorContainer() {
        this.font = document.createElement('link')
        this.font.href = 'https://fonts.cdnfonts.com/css/circular-std-book'
        this.font.rel = 'stylesheet';
        this.styleEl = document.createElement('style')
        this.styleEl.type = 'text/css'
        this.styleEl.appendChild(document.createTextNode(styleText))
        this.styleEl.appendChild(this.font)
        document.head.appendChild(this.styleEl)

        if (!this.selectorContainerEl) {
            this.clearDuplicateContainers()
            this.selectorContainerEl = this.createEl()
            this.selectorContainerEl.className = 'wallet-selector'
            this.selectorContainerEl.onclick = (event) => {
                if (event.target === this.selectorContainerEl) {
                    event.stopPropagation()
                    this.hideSelector()
                    this.consoleError('no wallet selected')
                }
            }
            document.body.appendChild(this.selectorContainerEl)
        }
        if (!this.selectorEl) {
            let wrapper = this.createEl({class: 'inner'})
            let closeButton = this.createEl({class: 'close'})
            closeButton.onclick = (event) => {
                event.stopPropagation()
                this.hideSelector()
                this.consoleError('no wallet selected')
            }
            this.selectorEl = this.createEl({class: 'connect'})
            wrapper.appendChild(this.selectorEl)
            wrapper.appendChild(closeButton)
            this.selectorContainerEl.appendChild(wrapper)
        }
    }

    private clearDuplicateContainers() {
        const elements = document.getElementsByClassName('wallet-selector')
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
                        el.className = `wallet-selector-${value}`
                        break
                    default:
                        el.setAttribute(attr, value)
                }
            }
        }
        return el
    }

    /**
     * Only Proton and Anchor are available
     */
    public displayWalletSelector(): Promise<string> {
        return new Promise((resolve) => {
            this.setUpSelectorContainer()
            const header = this.createEl({class: 'connect-header'})
            const body = this.createEl({class: 'connect-body'})
            if (this.appLogo) {
                const logoEl = this.createEl({
                    class: 'logo',
                    tag: 'img',
                    src: this.appLogo,
                    alt: 'app-logo',
                })
                header.appendChild(logoEl)
            }
            const title = 'Connect Wallet'
            const subtitle = `To start using ${this.appName}`
            const titleEl = this.createEl({class: 'title', tag: 'span', text: title})
            const subtitleEl = this.createEl({class: 'subtitle', tag: 'span', text: subtitle})

            const walletList = this.createEl({class: 'wallet-list', tag: 'ul'})
            const protonWallet = this.createEl({class: 'proton-wallet', tag: 'li'})
            const anchorWallet = this.createEl({class: 'anchor-wallet', tag: 'li'})
            anchorWallet.onclick = (event) => {
                event.stopPropagation()
                this.hideSelector()
                resolve('anchor')
            }

            protonWallet.onclick = (event) => {
                event.stopPropagation()
                this.hideSelector()
                resolve('proton')
            }
            const protonLogo = this.createEl({class: 'proton-logo'})
            const anchorLogo = this.createEl({class: 'anchor-logo'})
            const protonName = this.createEl({
                class: 'wallet-name',
                tag: 'span',
                text: 'Proton Wallet',
            })
            const anchorName = this.createEl({class: 'wallet-name', tag: 'span', text: 'Anchor'})
            const protonRightArrow = this.createEl({class: 'right-arrow'})
            const anchorRightArrow = protonRightArrow.cloneNode()

            protonWallet.appendChild(protonLogo)
            protonWallet.appendChild(protonName)
            protonWallet.appendChild(protonRightArrow)

            anchorWallet.appendChild(anchorLogo)
            anchorWallet.appendChild(anchorName)
            anchorWallet.appendChild(anchorRightArrow)

            walletList.appendChild(protonWallet)
            walletList.appendChild(anchorWallet)

            const tosLinkEl = this.createEl({
                class: 'tos-link',
                tag: 'a',
                text: `Terms of Service`,
                href: 'https://protonchain.com/terms',
                target: '_blank',
            })
            const tosAgreementEl = this.createEl({
                class: 'tos-agreement',
                tag: 'p',
                text: `By connecting, I accept Proton's `,
            })
            tosAgreementEl.appendChild(tosLinkEl)

            header.appendChild(titleEl)
            header.appendChild(subtitleEl)
            body.appendChild(walletList)
            body.appendChild(tosAgreementEl)

            emptyElement(this.selectorEl)

            this.selectorEl.appendChild(header)
            this.selectorEl.appendChild(body)
            this.showSelector()
        })
    }
}

function emptyElement(el: HTMLElement) {
    while (el.firstChild) {
        el.removeChild(el.firstChild)
    }
}
