"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const qrcode = __importStar(require("qrcode"));
const styles_1 = __importDefault(require("./styles"));
class Storage {
    constructor(keyPrefix) {
        this.keyPrefix = keyPrefix;
    }
    write(key, data) {
        return __awaiter(this, void 0, void 0, function* () {
            localStorage.setItem(this.storageKey(key), data);
        });
    }
    read(key) {
        return __awaiter(this, void 0, void 0, function* () {
            return localStorage.getItem(this.storageKey(key));
        });
    }
    remove(key) {
        return __awaiter(this, void 0, void 0, function* () {
            localStorage.removeItem(this.storageKey(key));
        });
    }
    storageKey(key) {
        return `${this.keyPrefix}-${key}`;
    }
}
class BrowserTransport {
    constructor(options = {}) {
        this.options = options;
        this.classPrefix = options.classPrefix || 'proton-link';
        this.injectStyles = !(options.injectStyles === false);
        this.requestStatus = !(options.requestStatus === false);
        this.storage = new Storage(options.storagePrefix || 'proton-link');
        this.requestAccount = options.requestAccount || '';
    }
    closeModal() {
        this.hide();
        if (this.activeCancel) {
            this.activeRequest = undefined;
            this.activeCancel('Modal closed');
            this.activeCancel = undefined;
        }
    }
    setupElements() {
        if (this.injectStyles && !this.styleEl) {
            this.styleEl = document.createElement('style');
            this.styleEl.type = 'text/css';
            const css = styles_1.default.replace(/%prefix%/g, this.classPrefix);
            this.styleEl.appendChild(document.createTextNode(css));
            document.head.appendChild(this.styleEl);
        }
        if (!this.containerEl) {
            this.containerEl = this.createEl();
            this.containerEl.className = this.classPrefix;
            this.containerEl.onclick = (event) => {
                if (event.target === this.containerEl) {
                    event.stopPropagation();
                    this.closeModal();
                }
            };
            document.body.appendChild(this.containerEl);
        }
        if (!this.requestEl) {
            let wrapper = this.createEl({ class: 'inner' });
            let closeButton = this.createEl({ class: 'close' });
            closeButton.onclick = (event) => {
                event.stopPropagation();
                this.closeModal();
            };
            this.requestEl = this.createEl({ class: 'request' });
            wrapper.appendChild(this.requestEl);
            wrapper.appendChild(closeButton);
            this.containerEl.appendChild(wrapper);
        }
    }
    createEl(attrs) {
        if (!attrs)
            attrs = {};
        const el = document.createElement(attrs.tag || 'div');
        if (attrs) {
            for (const attr of Object.keys(attrs)) {
                const value = attrs[attr];
                switch (attr) {
                    case 'src':
                        el.setAttribute(attr, value);
                        break;
                    case 'tag':
                        break;
                    case 'text':
                        el.appendChild(document.createTextNode(value));
                        break;
                    case 'class':
                        el.className = `${this.classPrefix}-${value}`;
                        break;
                    default:
                        el.setAttribute(attr, value);
                }
            }
        }
        return el;
    }
    hide() {
        if (this.containerEl) {
            this.containerEl.classList.remove(`${this.classPrefix}-active`);
        }
        this.clearTimers();
    }
    show() {
        if (this.containerEl) {
            this.containerEl.classList.add(`${this.classPrefix}-active`);
        }
    }
    displayRequest(request) {
        return __awaiter(this, void 0, void 0, function* () {
            this.setupElements();
            if (this.requestAccount.length > 0) {
                request.setInfoKey('req_account', this.requestAccount);
            }
            let crossDeviceUri = request.encode(true, false);
            const isIdentity = request.isIdentity();
            const title = isIdentity ? 'Login with Proton' : 'Sign with Proton';
            const subtitle = 'Scan the QR-code with your Proton Wallet';
            const qrEl = this.createEl({ class: 'qr' });
            try {
                qrEl.innerHTML = yield qrcode.toString(crossDeviceUri, {
                    margin: 0,
                    errorCorrectionLevel: 'L',
                });
            }
            catch (error) {
                console.warn('Unable to generate QR code', error);
            }
            const linkEl = this.createEl({ class: 'uri' });
            const iframe = this.createEl({
                class: 'wskeepalive',
                src: 'about:blank',
                tag: 'iframe',
            });
            linkEl.appendChild(iframe);
            const infoEl = this.createEl({ class: 'info' });
            const infoTitle = this.createEl({ class: 'title', tag: 'span', text: title });
            const infoSubtitle = this.createEl({ class: 'subtitle', tag: 'span', text: subtitle });
            infoEl.appendChild(infoTitle);
            infoEl.appendChild(infoSubtitle);
            const backgroundEl = this.createEl({ class: 'background' });
            const waveBackground = this.createEl({ class: 'wave' });
            const actionEl = this.createEl({ class: 'actions' });
            actionEl.appendChild(backgroundEl);
            actionEl.appendChild(waveBackground);
            backgroundEl.appendChild(qrEl);
            let footnoteEl;
            if (isIdentity) {
                footnoteEl = this.createEl({ class: 'footnote', text: "Don't have Proton Wallet? " });
                const footnoteLink = this.createEl({
                    tag: 'a',
                    target: '_blank',
                    href: 'https://protonchain.com',
                    text: 'Download it now',
                });
                footnoteEl.appendChild(footnoteLink);
            }
            else {
            }
            emptyElement(this.requestEl);
            const logoEl = this.createEl({ class: 'logo' });
            this.requestEl.appendChild(logoEl);
            this.requestEl.appendChild(infoEl);
            this.requestEl.appendChild(actionEl);
            this.show();
        });
    }
    showLoading() {
        return __awaiter(this, void 0, void 0, function* () {
            this.setupElements();
            emptyElement(this.requestEl);
            const infoEl = this.createEl({ class: 'info' });
            const infoTitle = this.createEl({ class: 'title', tag: 'span', text: 'Loading' });
            const infoSubtitle = this.createEl({
                class: 'subtitle',
                tag: 'span',
                text: 'Preparing request...',
            });
            infoEl.appendChild(infoTitle);
            infoEl.appendChild(infoSubtitle);
            const logoEl = this.createEl({ class: 'logo loading' });
            this.requestEl.appendChild(logoEl);
            this.requestEl.appendChild(infoEl);
            this.show();
        });
    }
    onRequest(request, cancel) {
        this.activeRequest = request;
        this.activeCancel = cancel;
        this.displayRequest(request).catch(cancel);
    }
    onSessionRequest(session, request, cancel) {
        if (session.metadata.sameDevice) {
            request.setInfoKey('return_path', returnUrl());
        }
        if (session.type === 'fallback') {
            this.onRequest(request, cancel);
            if (session.metadata.sameDevice) {
                window.location.href = request.encode();
            }
            return;
        }
        this.activeRequest = request;
        this.activeCancel = cancel;
        this.setupElements();
        const timeout = session.metadata.timeout || 60 * 1000 * 2;
        const deviceName = session.metadata.name;
        const start = Date.now();
        const infoTitle = this.createEl({ class: 'title', tag: 'span', text: 'Sign' });
        const updateCountdown = () => {
            const timeLeft = timeout + start - Date.now();
            const timeFormatted = timeLeft > 0 ? new Date(timeLeft).toISOString().substr(14, 5) : '00:00';
            infoTitle.textContent = `Sign - ${timeFormatted}`;
        };
        this.countdownTimer = setInterval(updateCountdown, 500);
        updateCountdown();
        const infoEl = this.createEl({ class: 'info' });
        infoEl.appendChild(infoTitle);
        let subtitle;
        if (deviceName && deviceName.length > 0) {
            subtitle = `Please open on “${deviceName}” to review and sign the transaction.`;
        }
        else {
            subtitle = 'Please review and sign the transaction in the linked wallet.';
        }
        const infoSubtitle = this.createEl({ class: 'subtitle', tag: 'span', text: subtitle });
        infoEl.appendChild(infoSubtitle);
        emptyElement(this.requestEl);
        const logoEl = this.createEl({ class: 'logo' });
        this.requestEl.appendChild(logoEl);
        this.requestEl.appendChild(infoEl);
        this.show();
        if (isAppleHandheld() && session.metadata.sameDevice) {
            const scheme = request.getScheme();
            window.location.href = `${scheme}://link`;
        }
    }
    clearTimers() {
        if (this.closeTimer) {
            clearTimeout(this.closeTimer);
            this.closeTimer = undefined;
        }
        if (this.countdownTimer) {
            clearTimeout(this.countdownTimer);
            this.countdownTimer = undefined;
        }
    }
    onSuccess(request) {
        if (request === this.activeRequest) {
            this.clearTimers();
            if (this.requestStatus) {
                this.setupElements();
                const infoEl = this.createEl({ class: 'info' });
                const logoEl = this.createEl({ class: 'logo' });
                logoEl.classList.add('success');
                const infoTitle = this.createEl({ class: 'title', tag: 'span', text: 'Success!' });
                const subtitle = request.isIdentity() ? 'Identity signed.' : 'Transaction signed.';
                const infoSubtitle = this.createEl({ class: 'subtitle', tag: 'span', text: subtitle });
                infoEl.appendChild(infoTitle);
                infoEl.appendChild(infoSubtitle);
                emptyElement(this.requestEl);
                this.requestEl.appendChild(logoEl);
                this.requestEl.appendChild(infoEl);
                this.show();
                this.closeTimer = setTimeout(() => {
                    this.hide();
                }, 1.5 * 1000);
            }
            else {
                this.hide();
            }
        }
    }
    onFailure(request, error) {
        if (request === this.activeRequest && error['code'] !== 'E_CANCEL') {
            this.clearTimers();
            if (this.requestStatus) {
                this.setupElements();
                const infoEl = this.createEl({ class: 'info' });
                const logoEl = this.createEl({ class: 'logo' });
                logoEl.classList.add('error');
                const infoTitle = this.createEl({
                    class: 'title',
                    tag: 'span',
                    text: 'Transaction error',
                });
                const infoSubtitle = this.createEl({
                    class: 'subtitle',
                    tag: 'span',
                    text: error.message || String(error),
                });
                infoEl.appendChild(infoTitle);
                infoEl.appendChild(infoSubtitle);
                emptyElement(this.requestEl);
                this.requestEl.appendChild(logoEl);
                this.requestEl.appendChild(infoEl);
                this.show();
            }
            else {
                this.hide();
            }
        }
    }
}
exports.default = BrowserTransport;
function emptyElement(el) {
    while (el.firstChild) {
        el.removeChild(el.firstChild);
    }
}
const returnUrlAlphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const returnUrlAlphabetLen = returnUrlAlphabet.length;
function returnUrl() {
    let rv = window.location.href.split('#')[0] + '#';
    for (let i = 0; i < 8; i++) {
        rv += returnUrlAlphabet.charAt(Math.floor(Math.random() * returnUrlAlphabetLen));
    }
    return rv;
}
function isAppleHandheld() {
    return /iP(ad|od|hone)/i.test(navigator.userAgent);
}
//# sourceMappingURL=index.js.map