import * as esr from 'eosio-signing-request'
import {ApiInterfaces, JsonRpc} from 'eosjs'
import * as ecc from 'eosjs-ecc'
import makeFetch from 'fetch-ponyfill'
import * as zlib from 'pako'
import uuid from 'uuid/v4'
import WebSocket from 'ws'

import {CancelError, IdentityError} from './errors'
import {Bytes, LinkCreate} from './link-abi'
import {defaults, LinkOptions} from './link-options'
import {LinkSession, LinkSessionData} from './link-session'
import {ConsoleTransport, LinkTransport} from './link-transport'
import {abiEncode} from './utils'

const {fetch} = makeFetch()

/**
 * Arguments accepted by the `Link::transact` method.
 * Note that one of `action`, `actions` or `transaction` must be set.
 */
export interface TransactArgs {
    /** Full transaction to sign. */
    transaction?: esr.abi.Transaction
    /** Action to sign. */
    action?: esr.abi.Action
    /** Actions to sign. */
    actions?: esr.abi.Action[]
    /**
     * Whether to broadcast the transaction or just return the signature.
     * Defaults to false.
     */
    broadcast?: boolean
}

/**
 * The result of a `Link::transact` call.
 */
export interface TransactResult {
    /** The signing request that was sent. */
    request: esr.SigningRequest
    /** The transaction signatures. */
    signatures: string[]
    /** The callback payload. */
    payload: esr.CallbackPayload
    /** The signer authority. */
    signer: esr.abi.PermissionLevel
    /** The resulting transaction. */
    transaction: esr.abi.Transaction
    /** Serialized version of transaction. */
    serializedTransaction: Uint8Array
    /** Push transaction response from api node, only present if transaction was broadcast. */
    processed?: {[key: string]: any}
}

export class Link implements esr.AbiProvider {
    public readonly rpc: JsonRpc
    public readonly transport: LinkTransport
    public readonly chainId: string | esr.ChainName

    private serviceAddress: string
    private requestOptions: esr.SigningRequestEncodingOptions
    private abiCache = new Map<string, any>()

    constructor(options: LinkOptions = {}) {
        if (options.rpc === undefined || typeof options.rpc === 'string') {
            this.rpc = new JsonRpc(options.rpc || defaults.rpc, {fetch: fetch as any})
        } else {
            this.rpc = options.rpc
        }
        this.chainId = options.chainId || defaults.chainId
        this.serviceAddress = (options.service || defaults.service).trim().replace(/\/$/, '')
        this.transport = options.transport || new ConsoleTransport()
        this.requestOptions = {
            abiProvider: this,
            textDecoder: options.textDecoder || new TextDecoder(),
            textEncoder: options.textEncoder || new TextEncoder(),
            zlib,
        }
    }

    public async getAbi(account: string) {
        let rv = this.abiCache.get(account)
        if (!rv) {
            rv = (await this.rpc.get_abi(account)).abi
            if (rv) {
                this.abiCache.set(account, rv)
            }
        }
        return rv
    }

    public createCallbackUrl() {
        return `${this.serviceAddress}/${uuid()}`
    }

    public async createRequest(args: esr.SigningRequestCreateArguments) {
        // generate unique callback url
        const request = await esr.SigningRequest.create(
            {
                ...args,
                chainId: this.chainId,
                broadcast: false,
                callback: {
                    url: this.createCallbackUrl(),
                    background: true,
                },
            },
            this.requestOptions
        )
        return request
    }

    public async sendRequest(request: esr.SigningRequest, transport?: LinkTransport) {
        const t = transport || this.transport
        const linkUrl = request.data.callback
        if (!linkUrl.startsWith(this.serviceAddress)) {
            throw new Error('Request must have a link callback')
        }
        // wait for callback or user cancel
        const ctx: {cancel?: () => void} = {}
        const socket = waitForCallback(linkUrl, ctx)
        const cancel = new Promise<never>((resolve, reject) => {
            t.onRequest(request, (reason) => {
                if (ctx.cancel) {
                    ctx.cancel()
                }
                if (typeof reason === 'string') {
                    reject(new CancelError(reason))
                } else {
                    reject(reason)
                }
            })
        })
        const payload = await Promise.race([socket, cancel])

        const signer: esr.abi.PermissionLevel = {
            actor: payload.sa,
            permission: payload.sp,
        }
        const signatures: string[] = Object.keys(payload)
            .filter((key) => key.startsWith('sig') && key !== 'sig0')
            .map((key) => payload[key]!)

        return {
            signer,
            payload,
            signatures,
        }
    }

    public async transact(args: TransactArgs, transport?: LinkTransport): Promise<TransactResult> {
        const t = transport || this.transport
        const request = await this.createRequest(args)
        try {
            const {payload, signatures, signer} = await this.sendRequest(request, t)
            // recreate transaction from request response
            const resolved = await esr.ResolvedSigningRequest.fromPayload(
                payload,
                this.requestOptions
            )
            const {serializedTransaction, transaction} = resolved

            // broadcast transaction if requested
            const broadcast = args.broadcast || false
            let processed: {[key: string]: any} | undefined
            if (broadcast) {
                const res = await this.rpc.push_transaction({
                    signatures: [payload.sig],
                    serializedTransaction,
                })
                processed = res.processed
            }
            const result: TransactResult = {
                payload,
                signatures,
                signer,
                request,
                transaction,
                serializedTransaction,
                processed,
            }
            if (t.onSuccess) {
                t.onSuccess(request, result)
            }
            return result
        } catch (error) {
            if (t.onFailure) {
                t.onFailure(request, error)
            }
            throw error
        }
    }

    /**
     * Create a identity request.
     * @param requestPermission Optional request permission if the request is for a specific account or permission.
     * @param info Metadata to add to the request.
     */
    public async identify(
        requestPermission?: esr.abi.PermissionLevel,
        info?: {[key: string]: string | Uint8Array}
    ) {
        const request = await this.createRequest({
            identity: {permission: requestPermission},
            info,
        })
        const res = await this.sendRequest(request)
        const {serializedTransaction} = await esr.ResolvedSigningRequest.fromPayload(
            res.payload,
            this.requestOptions
        )
        const message = Buffer.concat([
            Buffer.from(request.getChainId(), 'hex'),
            Buffer.from(serializedTransaction),
            Buffer.alloc(32),
        ])
        const {signer} = res
        const signerKey = ecc.recover(res.signatures[0], message)
        const account = await this.rpc.get_account(signer.actor)
        if (!account) {
            throw new IdentityError(`Signature from unknown account: ${signer.actor}`)
        }
        const permission = account.permissions.find(
            ({perm_name}) => perm_name === signer.permission
        )
        if (!permission) {
            throw new IdentityError(
                `${signer.actor} signed for unknown permission: ${signer.permission}`
            )
        }
        const auth = permission.required_auth
        const keyAuth = auth.keys.find(({key}) => key === signerKey)
        if (!keyAuth) {
            throw new IdentityError(
                `${signer.actor}@${signer.permission} has no key matching id signature`
            )
        }
        if (auth.threshold > keyAuth.weight) {
            throw new IdentityError(
                `${signer.actor}@${signer.permission} signature does not reach auth threshold`
            )
        }
        return {
            ...res,
            account,
            signerKey,
        }
    }

    /**
     * Login and create a persistent session.
     */
    public async login(sessionName: string) {
        const privateKey = await ecc.randomKey()
        const requestKey = ecc.privateToPublic(privateKey)
        const createInfo: LinkCreate = {
            session_name: sessionName,
            request_key: requestKey,
        }
        const res = await this.identify(undefined, {
            link: abiEncode(createInfo, 'link_create'),
        })
        let session: LinkSession
        if (res.payload.link_ch && res.payload.link_key) {
            let data: LinkSessionData = {
                auth: res.signer,
                publicKey: res.signerKey,
                channel: res.payload.link_ch,
                channelKey: res.payload.link_key,
                channelSequence: 0,
                privateKey,
            }
            session = new LinkSession(this, data)
        } else {
            /// todo fallback session using current transport
            throw new Error('User wallet not link compatible')
        }
        return {
            ...res,
            session,
        }
    }

    /**
     * Create an eosjs signature provider using this link.
     * Note that we don't know what keys are available so those have to be provided.
     */
    public makeSignatureProvider(
        availableKeys: string[],
        transport?: LinkTransport
    ): ApiInterfaces.SignatureProvider {
        return {
            getAvailableKeys: async () => availableKeys,
            sign: async (args) => {
                const request = esr.SigningRequest.fromTransaction(
                    args.chainId,
                    args.serializedTransaction,
                    this.requestOptions
                )
                request.setCallback(this.createCallbackUrl(), true)
                request.setBroadcast(false)
                const {signatures} = await this.sendRequest(request, transport)
                return {
                    ...args,
                    signatures,
                }
            },
        }
    }
}

function waitForCallback(url: string, ctx: {cancel?: () => void}) {
    return new Promise<esr.CallbackPayload>((resolve, reject) => {
        let active = true
        let retries = 0
        const socketUrl = url.replace(/^http/, 'ws')
        const handleResponse = (response: string) => {
            try {
                resolve(JSON.parse(response))
            } catch (error) {
                error.message = 'Unable to parse callback JSON: ' + error.message
                reject(error)
            }
        }
        const connect = () => {
            const socket = new WebSocket(socketUrl)
            ctx.cancel = () => {
                active = false
                if (
                    socket.readyState === WebSocket.OPEN ||
                    socket.readyState === WebSocket.CONNECTING
                ) {
                    socket.close()
                }
            }
            socket.onmessage = (event) => {
                active = false
                if (socket.readyState === WebSocket.OPEN) {
                    socket.close()
                }
                if (typeof Blob !== 'undefined' && event.data instanceof Blob) {
                    const reader = new FileReader()
                    reader.onload = () => {
                        handleResponse(reader.result as string)
                    }
                    reader.onerror = (error) => {
                        reject(error)
                    }
                    reader.readAsText(event.data)
                } else {
                    if (typeof event.data === 'string') {
                        handleResponse(event.data)
                    } else {
                        handleResponse(event.data.toString())
                    }
                }
            }
            socket.onopen = () => {
                retries = 0
            }
            socket.onerror = (error) => {}
            socket.onclose = (close) => {
                if (active) {
                    setTimeout(connect, backoff(retries++))
                }
            }
        }
        connect()
    })
}

/**
 * Exponential backoff function that caps off at 10s after 10 tries.
 * https://i.imgur.com/IrUDcJp.png
 */
function backoff(tries: number): number {
    return Math.min(Math.pow(tries * 10, 2), 10 * 1000)
}