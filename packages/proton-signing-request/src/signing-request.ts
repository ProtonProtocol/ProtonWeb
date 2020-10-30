/**
 * EOSIO Signing Request (ESR).
 */

import {Serialize} from '@protonprotocol/protonjs'
import sha256 from 'fast-sha256'
require('fast-text-encoding');

import * as abi from './abi'
import * as base64u from './base64u'

const ProtocolVersion = 2

const textEncoder = new TextEncoder()
const textDecoder = new TextDecoder()
const AbiTypes = Serialize.getTypesFromAbi(Serialize.createInitialTypes(), abi.data as any)

/** Interface that should be implemented by abi providers. */
export interface AbiProvider {
    /**
     * Return a promise that resolves to an abi object for the given account name,
     * e.g. the result of a rpc call to chain/get_abi.
     */
    getAbi: (account: string) => Promise<any>
}

/** Interface that should be implemented by zlib implementations. */
export interface ZlibProvider {
    /** Deflate data w/o adding zlib header. */
    deflateRaw: (data: Uint8Array) => Uint8Array
    /** Inflate data w/o requiring zlib header. */
    inflateRaw: (data: Uint8Array) => Uint8Array
}

/** Interface that should be implemented by signature providers. */
export interface SignatureProvider {
    /** Sign 32-byte hex-encoded message and return signer name and signature string. */
    sign: (message: string) => {signer: string; signature: string}
}

/**
 * The callback payload sent to background callbacks.
 */
export interface CallbackPayload {
    /** The first signature. */
    sig: string
    /** Transaction ID as HEX-encoded string. */
    tx: string
    /** Block number hint (only present if transaction was broadcast). */
    bn?: string
    /** Signer authority, aka account name. */
    sa: string
    /** Signer permission, e.g. "active". */
    sp: string
    /** Reference block num used when resolving request. */
    rbn: string
    /** Reference block id used when resolving request. */
    rid: string
    /** The originating signing request packed as a uri string. */
    req: string
    /** Expiration time used when resolving request. */
    ex: string
    /** All signatures 0-indexed as `sig0`, `sig1`, etc. */
    [sig0: string]: string | undefined
}

/**
 * Context used to resolve a callback.
 * Compatible with the JSON response from a `push_transaction` call.
 */
export interface ResolvedCallback {
    /** The URL to hit. */
    url: string
    /**
     * Whether to run the request in the background. For a https url this
     * means POST in the background instead of a GET redirect.
     */
    background: boolean
    /**
     * The callback payload as a object that should be encoded to JSON
     * and POSTed to background callbacks.
     */
    payload: CallbackPayload
}

/**
 * Context used to resolve a transaction.
 * Compatible with the JSON response from a `get_block` call.
 */
export interface TransactionContext {
    /** Timestamp expiration will be derived from. */
    timestamp?: string
    /**
     * How many seconds in the future to set expiration when deriving from timestamp.
     * Defaults to 60 seconds if unset.
     */
    expire_seconds?: number
    /** Block number ref_block_num will be derived from. */
    block_num?: number
    /** Reference block number, takes precedence over block_num if both is set. */
    ref_block_num?: number
    /** Reference block prefix. */
    ref_block_prefix?: number
    /** Expiration timestamp, takes precedence over timestamp and expire_seconds if set. */
    expiration?: string
}

/** Chain ID aliases. */
export enum ChainName {
    UNKNOWN = 0, // reserved
    EOS = 1,
    TELOS = 2,
    JUNGLE = 3,
    KYLIN = 4,
    WORBLI = 5,
    BOS = 6,
    MEETONE = 7,
    INSIGHTS = 8,
    BEOS = 9,
    WAX = 10,
    PROTON = 11,
    FIO = 12,
}

const ChainIdLookup = new Map<abi.ChainAlias, abi.ChainId>([
    [ChainName.EOS, 'aca376f206b8fc25a6ed44dbdc66547c36c6c33e3a119ffbeaef943642f0e906'],
    [ChainName.TELOS, '4667b205c6838ef70ff7988f6e8257e8be0e1284a2f59699054a018f743b1d11'],
    [ChainName.JUNGLE, 'e70aaab8997e1dfce58fbfac80cbbb8fecec7b99cf982a9444273cbc64c41473'],
    [ChainName.KYLIN, '5fff1dae8dc8e2fc4d5b23b2c7665c97f9e9d8edf2b6485a86ba311c25639191'],
    [ChainName.WORBLI, '73647cde120091e0a4b85bced2f3cfdb3041e266cbbe95cee59b73235a1b3b6f'],
    [ChainName.BOS, 'd5a3d18fbb3c084e3b1f3fa98c21014b5f3db536cc15d08f9f6479517c6a3d86'],
    [ChainName.MEETONE, 'cfe6486a83bad4962f232d48003b1824ab5665c36778141034d75e57b956e422'],
    [ChainName.INSIGHTS, 'b042025541e25a472bffde2d62edd457b7e70cee943412b1ea0f044f88591664'],
    [ChainName.BEOS, 'b912d19a6abd2b1b05611ae5be473355d64d95aeff0c09bedc8c166cd6468fe4'],
    [ChainName.WAX, '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4'],
    [ChainName.PROTON, '384da888112027f0321850a169f737c33e53b388aad48b5adace4bab97f437e0'],
    [ChainName.FIO, '21dcae42c0182200e93f954a074011f9048a7624c6fe81d3c9541a614a88bd1c'],
])

const DEFAULT_SCHEME = 'esr'

/**
 * The placeholder name: `............1` aka `uint64(1)`.
 * If used in action data will be resolved to current signer.
 * If used in as an authorization permission will be resolved to
 * the signers permission level.
 *
 * Example action:
 * ```
 * { account: "eosio.token",
 *   name: "transfer",
 *   authorization: [{actor: "............1", permission: "............1"}],
 *   data: {
 *     from: "............1",
 *     to: "bar",
 *     quantity: "42.0000 EOS",
 *     memo: "Don't panic" }}
 * ```
 * When signed by `foo@active` would resolve to:
 * ```
 * { account: "eosio.token",
 *   name: "transfer",
 *   authorization: [{actor: "foo", permission: "active"}],
 *   data: {
 *     from: "foo",
 *     to: "bar",
 *     quantity: "42.0000 EOS",
 *     memo: "Don't panic" }}
 * ```
 */
export const PlaceholderName = '............1' // aka uint64(1)

/** Placeholder that will resolve to signer permission name. */
export const PlaceholderPermission = '............2' // aka uint64(2)

export const PlaceholderAuth: abi.PermissionLevel = {
    actor: PlaceholderName,
    permission: PlaceholderPermission,
}

export type CallbackType = string | {url: string; background: boolean}

export interface SigningRequestCreateArguments {
    /** Single action to create request with. */
    action?: abi.Action
    /** Multiple actions to create request with. */
    actions?: abi.Action[]
    /**
     * Full or partial transaction to create request with.
     * If TAPoS info is omitted it will be filled in when resolving the request.
     */
    transaction?: {actions: abi.Action[]; [key: string]: any}
    /** Create an identity request. */
    identity?: abi.Identity
    /** Chain to use, defaults to EOS main-net if omitted. */
    chainId?: string | number
    /** Whether wallet should broadcast tx, defaults to true. */
    broadcast?: boolean
    /**
     * Optional callback URL the signer should hit after
     * broadcasting or signing. Passing a string means background = false.
     */
    callback?: CallbackType
    /** Optional metadata to pass along with the request. */
    info?: {[key: string]: string | Uint8Array}
}

export interface SigningRequestCreateIdentityArguments {
    /**
     * Callback where the identity should be delivered.
     */
    callback: CallbackType
    /** Chain to use, defaults to EOS if omitted. */
    chainId?: string | number
    /**
     * Requested account name of identity.
     * Defaults to placeholder (any identity) if omitted.
     */
    account?: string
    /**
     * Requested account permission.
     * Defaults to placeholder (any permission) if omitted.
     */
    permission?: string
    /** Optional metadata to pass along with the request. */
    info?: {[key: string]: string | Uint8Array}
}

export interface SigningRequestEncodingOptions {
    /** Optional zlib, if provided the request will be compressed when encoding. */
    zlib?: ZlibProvider
    /** Abi provider, required if the arguments contain un-encoded actions. */
    abiProvider?: AbiProvider
    /** Optional signature provider, will be used to create a request signature if provided. */
    signatureProvider?: SignatureProvider
    /** Custom Scheme . */
    scheme?: string
}

export type AbiMap = Map<string, any>

export class SigningRequest {
    public static type = AbiTypes.get('signing_request')!
    public static idType = AbiTypes.get('identity')!
    public static transactionType = AbiTypes.get('transaction')!
    public scheme: string = DEFAULT_SCHEME

    /** Create a new signing request. */
    public static async create(
        args: SigningRequestCreateArguments,
        options: SigningRequestEncodingOptions = {}
    ) {
        const data: any = {}

        const serialize = (action: abi.Action) => {
            return serializeAction(action, options.abiProvider)
        }

        // set the request data
        if (args.identity !== undefined) {
            data.req = ['identity', args.identity]
        } else if (args.action && !args.actions && !args.transaction) {
            data.req = ['action', await serialize(args.action)]
        } else if (args.actions && !args.action && !args.transaction) {
            if (args.actions.length === 1) {
                data.req = ['action', await serialize(args.actions[0])]
            } else {
                data.req = ['action[]', await Promise.all(args.actions.map(serialize))]
            }
        } else if (args.transaction && !args.action && !args.actions) {
            const tx = args.transaction
            // set default values if missing
            if (tx.expiration === undefined) {
                tx.expiration = '1970-01-01T00:00:00.000'
            }
            if (tx.ref_block_num === undefined) {
                tx.ref_block_num = 0
            }
            if (tx.ref_block_prefix === undefined) {
                tx.ref_block_prefix = 0
            }
            if (tx.context_free_actions === undefined) {
                tx.context_free_actions = []
            }
            if (tx.transaction_extensions === undefined) {
                tx.transaction_extensions = []
            }
            if (tx.delay_sec === undefined) {
                tx.delay_sec = 0
            }
            if (tx.max_cpu_usage_ms === undefined) {
                tx.max_cpu_usage_ms = 0
            }
            if (tx.max_net_usage_words === undefined) {
                tx.max_net_usage_words = 0
            }
            // encode actions if needed
            tx.actions = await Promise.all(tx.actions.map(serialize))
            data.req = ['transaction', tx]
        } else {
            throw new TypeError(
                'Invalid arguments: Must have exactly one of action, actions or transaction'
            )
        }

        // set the chain id
        data.chain_id = variantId(args.chainId)
        data.flags = abi.RequestFlagsNone

        const broadcast = args.broadcast !== undefined ? args.broadcast : true
        if (broadcast) {
            data.flags |= abi.RequestFlagsBroadcast
        }
        if (typeof args.callback === 'string') {
            data.callback = args.callback
        } else if (typeof args.callback === 'object') {
            data.callback = args.callback.url
            if (args.callback.background) {
                data.flags |= abi.RequestFlagsBackground
            }
        } else {
            data.callback = ''
        }

        data.info = []
        if (typeof args.info === 'object') {
            for (const key in args.info) {
                if (args.info.hasOwnProperty(key)) {
                    let value = args.info[key]
                    if (typeof key !== 'string') {
                        throw new Error('Invalid info dict, keys must be strings')
                    }
                    if (typeof value === 'string') {
                        value = textEncoder.encode(value)
                    }
                    data.info.push({key, value})
                }
            }
        }

        const req = new SigningRequest(
            ProtocolVersion,
            data,
            options.zlib,
            options.abiProvider,
            undefined,
            options.scheme
        )

        // sign the request if given a signature provider
        if (options.signatureProvider) {
            req.sign(options.signatureProvider)
        }

        return req
    }

    /** Creates an identity request. */
    public static identity(
        args: SigningRequestCreateIdentityArguments,
        options: SigningRequestEncodingOptions = {}
    ) {
        let permission: abi.PermissionLevel | null = {
            actor: args.account || PlaceholderName,
            permission: args.permission || PlaceholderPermission,
        }
        if (
            permission.actor === PlaceholderName &&
            permission.permission === PlaceholderPermission
        ) {
            permission = null
        }
        return this.create(
            {
                identity: {
                    permission,
                },
                broadcast: false,
                callback: args.callback,
                info: args.info,
            },
            options
        )
    }

    /**
     * Create a request from a chain id and serialized transaction.
     * @param chainId The chain id where the transaction is valid.
     * @param serializedTransaction The serialized transaction.
     * @param options Creation options.
     */
    public static fromTransaction(
        chainId: Uint8Array | string,
        serializedTransaction: Uint8Array | string,
        options: SigningRequestEncodingOptions = {}
    ) {
        if (typeof chainId !== 'string') {
            chainId = Serialize.arrayToHex(chainId)
        }
        if (typeof serializedTransaction === 'string') {
            serializedTransaction = Serialize.hexToUint8Array(serializedTransaction)
        }
        let buf = new Serialize.SerialBuffer()
        buf.push(2) // header
        const id = variantId(chainId as any)
        if (id[0] === 'chain_alias') {
            buf.push(0)
            buf.push(id[1])
        } else {
            buf.push(1)
            buf.pushArray(Serialize.hexToUint8Array(id[1]))
        }
        buf.push(2) // transaction variant
        buf.pushArray(serializedTransaction)
        buf.push(abi.RequestFlagsBroadcast) // flags
        buf.push(0) // callback
        buf.push(0) // info
        return SigningRequest.fromData(buf.asUint8Array(), options)
    }

    /** Creates a signing request from encoded `esr:` uri string. */
    public static from(uri: string, options: SigningRequestEncodingOptions = {}) {
        if (typeof uri !== 'string') {
            throw new Error('Invalid request uri')
        }
        const [scheme, path] = uri.split(':')
        if (scheme !== (options.scheme || DEFAULT_SCHEME) && scheme !== `web+${(options.scheme || DEFAULT_SCHEME)}`) {
            throw new Error('Invalid scheme')
        }
        const data = base64u.decode(path.startsWith('//') ? path.slice(2) : path)
        return SigningRequest.fromData(data, options)
    }

    public static fromData(data: Uint8Array, options: SigningRequestEncodingOptions = {}) {
        const header = data[0]
        const version = header & ~(1 << 7)
        if (version !== ProtocolVersion) {
            throw new Error('Unsupported protocol version')
        }
        let array = data.slice(1)
        if ((header & (1 << 7)) !== 0) {
            if (!options.zlib) {
                throw new Error('Compressed URI needs zlib')
            }
            array = options.zlib.inflateRaw(array)
        }
        const buffer = new Serialize.SerialBuffer({
            array,
        })
        const req = SigningRequest.type.deserialize(buffer)
        let signature: abi.RequestSignature | undefined
        if (buffer.haveReadData()) {
            const type = AbiTypes.get('request_signature')!
            signature = type.deserialize(buffer)
        }
        return new SigningRequest(
            version,
            req,
            options.zlib,
            options.abiProvider,
            signature,
            options.scheme
        )
    }

    /** The signing request version. */
    public version: number

    /** The raw signing request data. */
    public data: abi.SigningRequest

    /** The request signature. */
    public signature?: abi.RequestSignature

    private zlib?: ZlibProvider
    private abiProvider?: AbiProvider

    /**
     * Create a new signing request.
     * Normally not used directly, see the `create` and `from` class methods.
     */
    constructor(
        version: number,
        data: abi.SigningRequest,
        zlib?: ZlibProvider,
        abiProvider?: AbiProvider,
        signature?: abi.RequestSignature,
        scheme?: string
    ) {
        if ((data.flags & abi.RequestFlagsBroadcast) !== 0 && data.req[0] === 'identity') {
            throw new Error('Invalid request (identity request cannot be broadcast)')
        }
        if ((data.flags & abi.RequestFlagsBroadcast) === 0 && data.callback.length === 0) {
            throw new Error('Invalid request (nothing to do, no broadcast or callback set)')
        }
        this.version = version
        this.data = data
        this.zlib = zlib
        this.abiProvider = abiProvider
        this.signature = signature
        this.scheme = scheme || this.scheme
    }

    /**
     * Sign the request, mutating.
     * @param signatureProvider The signature provider that provides a signature for the signer.
     */
    public sign(signatureProvider: SignatureProvider) {
        const message = this.getSignatureDigest()
        this.signature = signatureProvider.sign(Serialize.arrayToHex(message))
    }

    /**
     * Get the signature digest for this request.
     */
    public getSignatureDigest() {
        const buffer = new Serialize.SerialBuffer()
        // protocol version + utf8 "request"
        buffer.pushArray([this.version, 0x72, 0x65, 0x71, 0x75, 0x65, 0x73, 0x74])
        buffer.pushArray(this.getData())
        return sha256(buffer.asUint8Array())
    }

    /**
     * Set the signature data for this request, mutating.
     * @param signer Account name of signer.
     * @param signature The signature string.
     */
    public setSignature(signer: string, signature: string) {
        this.signature = {signer, signature}
    }

    /**
     * Set the request callback, mutating.
     * @param url Where the callback should be sent.
     * @param background Whether the callback should be sent in the background.
     */
    public setCallback(url: string, background: boolean) {
        this.data.callback = url
        if (background) {
            this.data.flags |= abi.RequestFlagsBackground
        } else {
            this.data.flags &= ~abi.RequestFlagsBackground
        }
    }

    /**
     * Set broadcast flag.
     * @param broadcast Whether the transaction should be broadcast by receiver.
     */
    public setBroadcast(broadcast: boolean) {
        if (broadcast) {
            this.data.flags |= abi.RequestFlagsBroadcast
        } else {
            this.data.flags &= ~abi.RequestFlagsBroadcast
        }
    }

    /**
     * Encode this request into an `esr:` uri.
     * @argument compress Whether to compress the request data using zlib,
     *                    defaults to true if omitted and zlib is present;
     *                    otherwise false.
     * @argument slashes Whether add slashes after the protocol scheme, i.e. `esr://`.
     *                   Defaults to true.
     * @returns An esr uri string.
     */
    public encode(compress?: boolean, slashes?: boolean): string {
        const shouldCompress = compress !== undefined ? compress : this.zlib !== undefined
        if (shouldCompress && this.zlib === undefined) {
            throw new Error('Need zlib to compress')
        }
        let header = this.version
        const data = this.getData()
        const sigData = this.getSignatureData()
        let array = new Uint8Array(data.byteLength + sigData.byteLength)
        array.set(data, 0)
        array.set(sigData, data.byteLength)
        if (shouldCompress) {
            const deflated = this.zlib!.deflateRaw(array)
            if (array.byteLength > deflated.byteLength) {
                header |= 1 << 7
                array = deflated
            }
        }
        const out = new Uint8Array(1 + array.byteLength)
        out[0] = header
        out.set(array, 1)
        let scheme = `${this.scheme}:`
        if (slashes !== false) {
            scheme += '//'
        }
        return scheme + base64u.encode(out)
    }

    /** Get the request data without header or signature. */
    public getData(): Uint8Array {
        const buffer = new Serialize.SerialBuffer()
        SigningRequest.type.serialize(buffer, this.data)
        return buffer.asUint8Array()
    }

    /** Get signature data, returns an empty array if request is not signed. */
    public getSignatureData(): Uint8Array {
        if (!this.signature) {
            return new Uint8Array(0)
        }
        const buffer = new Serialize.SerialBuffer()
        const type = AbiTypes.get('request_signature')!
        type.serialize(buffer, this.signature)
        return buffer.asUint8Array()
    }

    /** ABI definitions required to resolve request. */
    public getRequiredAbis() {
        return this.getRawActions()
            .filter((action) => !isIdentity(action))
            .map((action) => action.account)
            .filter((value, index, self) => self.indexOf(value) === index)
    }

    /** Whether TaPoS values are required to resolve request. */
    public requiresTapos() {
        let tx = this.getRawTransaction()
        return !this.isIdentity() && !hasTapos(tx)
    }

    /** Resolve required ABI definitions. */
    public async fetchAbis(abiProvider?: AbiProvider): Promise<AbiMap> {
        const provider = abiProvider || this.abiProvider
        if (!provider) {
            throw new Error('Missing ABI provider')
        }
        const abis = new Map<string, any>()
        await Promise.all(
            this.getRequiredAbis().map(async (account) => {
                abis.set(account, await provider.getAbi(account))
            })
        )
        return abis
    }

    /**
     * Decode raw actions actions to object representations.
     * @param abis ABI defenitions required to decode all actions.
     * @param signer Placeholders in actions will be resolved to signer if set.
     */
    public resolveActions(abis: AbiMap, signer?: abi.PermissionLevel): abi.Action[] {
        return this.getRawActions().map((rawAction) => {
            let contractAbi: any | undefined
            if (isIdentity(rawAction)) {
                contractAbi = abi.data
            } else {
                contractAbi = abis.get(rawAction.account)
            }
            if (!contractAbi) {
                throw new Error(`Missing ABI definition for ${rawAction.account}`)
            }
            const contract = getContract(contractAbi)
            if (signer) {
                // hook into eosjs name decoder and return the signing account if we encounter the placeholder
                // this is fine because getContract re-creates the initial types each time
                contract.types.get('name')!.deserialize = (buffer: Serialize.SerialBuffer) => {
                    const name = buffer.getName()
                    if (name === PlaceholderName) {
                        return signer.actor
                    } else if (name === PlaceholderPermission) {
                        return signer.permission
                    } else {
                        return name
                    }
                }
            }
            const action = Serialize.deserializeAction(
                contract,
                rawAction.account,
                rawAction.name,
                rawAction.authorization,
                rawAction.data as any,
            )
            if (signer) {
                action.authorization = action.authorization.map((auth: any) => {
                    let {actor, permission} = auth
                    if (actor === PlaceholderName) {
                        actor = signer.actor
                    }
                    if (permission === PlaceholderPermission) {
                        permission = signer.permission
                    }
                    // backwards compatibility, actor placeholder will also resolve to permission when used in auth
                    if (permission === PlaceholderName) {
                        permission = signer.permission
                    }
                    return {actor, permission}
                })
            }
            return action
        })
    }

    public resolveTransaction(
        abis: AbiMap,
        signer: abi.PermissionLevel,
        ctx: TransactionContext = {}
    ): abi.Transaction {
        let tx = this.getRawTransaction()
        if (!this.isIdentity() && !hasTapos(tx)) {
            if (
                ctx.expiration !== undefined &&
                ctx.ref_block_num !== undefined &&
                ctx.ref_block_prefix !== undefined
            ) {
                tx.expiration = ctx.expiration
                tx.ref_block_num = ctx.ref_block_num
                tx.ref_block_prefix = ctx.ref_block_prefix
            } else if (
                ctx.block_num !== undefined &&
                ctx.ref_block_prefix !== undefined &&
                ctx.timestamp !== undefined
            ) {
                const header = Serialize.transactionHeader(
                    ctx as any,
                    ctx.expire_seconds !== undefined ? ctx.expire_seconds : 60
                )
                tx.expiration = header.expiration
                tx.ref_block_num = header.ref_block_num
                tx.ref_block_prefix = header.ref_block_prefix
            } else {
                throw new Error(
                    'Invalid transaction context, need either a reference block or explicit TAPoS values'
                )
            }
        }
        const actions = this.resolveActions(abis, signer)
        return {...tx, actions}
    }

    public resolve(abis: AbiMap, signer: abi.PermissionLevel, ctx: TransactionContext = {}) {
        const transaction = this.resolveTransaction(abis, signer, ctx)
        const buf = new Serialize.SerialBuffer()
        const actions = transaction.actions.map((action) => {
            let contractAbi: any
            if (isIdentity(action)) {
                contractAbi = abi.data
            } else {
                contractAbi = abis.get(action.account)
            }
            if (!contractAbi) {
                throw new Error(`Missing ABI definition for ${action.account}`)
            }
            const contract = getContract(contractAbi)
            return Serialize.serializeAction(
                contract,
                action.account,
                action.name,
                action.authorization,
                action.data
            )
        })
        SigningRequest.transactionType.serialize(buf, {
            ...transaction,
            actions,
        })
        const serializedTransaction = buf.asUint8Array()
        return new ResolvedSigningRequest(this, signer, transaction, serializedTransaction)
    }

    /**
     * Get Scheme
     * @returns scheme like 'esr'
     */
    public getScheme(): string {
        return this.scheme
    }

    /**
     * Get the id of the chain where this request is valid.
     * @returns The 32-byte chain id as hex encoded string.
     */
    public getChainId(): abi.ChainId {
        const id = this.data.chain_id
        switch (id[0]) {
            case 'chain_id':
                return id[1]
            case 'chain_alias':
                if (ChainIdLookup.has(id[1])) {
                    return ChainIdLookup.get(id[1])!
                } else {
                    throw new Error('Unknown chain id alias')
                }
            default:
                throw new Error('Invalid signing request data')
        }
    }

    /** Return the actions in this request with action data encoded. */
    public getRawActions() {
        const req = this.data.req
        switch (req[0]) {
            case 'action':
                return [req[1]]
            case 'action[]':
                return req[1]
            case 'identity':
                let data: string = '0101000000000000000200000000000000' // placeholder permission
                let authorization: abi.PermissionLevel[] = [PlaceholderAuth]
                if (req[1].permission) {
                    let buf = new Serialize.SerialBuffer()
                    SigningRequest.idType.serialize(buf, req[1])
                    data = Serialize.arrayToHex(buf.asUint8Array())
                    authorization = [req[1].permission]
                }
                return [
                    {
                        account: '',
                        name: 'identity',
                        authorization,
                        data,
                    },
                ]
            case 'transaction':
                return req[1].actions
            default:
                throw new Error('Invalid signing request data')
        }
    }

    /** Unresolved transaction. */
    public getRawTransaction(): abi.Transaction {
        const req = this.data.req
        switch (req[0]) {
            case 'transaction':
                return req[1]
            case 'action':
            case 'action[]':
            case 'identity':
                return {
                    actions: this.getRawActions(),
                    context_free_actions: [],
                    transaction_extensions: [],
                    expiration: '1970-01-01T00:00:00.000',
                    ref_block_num: 0,
                    ref_block_prefix: 0,
                    max_cpu_usage_ms: 0,
                    max_net_usage_words: 0,
                    delay_sec: 0,
                }
            default:
                throw new Error('Invalid signing request data')
        }
    }

    /** Whether the request is an identity request. */
    public isIdentity(): boolean {
        return this.data.req[0] === 'identity'
    }

    /** Whether the request should be broadcast by signer. */
    public shouldBroadcast(): boolean {
        if (this.isIdentity()) {
            return false
        }
        return (this.data.flags & abi.RequestFlagsBroadcast) !== 0
    }

    /**
     * Present if the request is an identity request and requests a specific account.
     * @note This returns `nil` unless a specific identity has been requested,
     *       use `isIdentity` to check id requests.
     */
    public getIdentity(): string | null {
        if (this.data.req[0] === 'identity' && this.data.req[1].permission) {
            const {actor} = this.data.req[1].permission
            return actor === PlaceholderName ? null : actor
        }
        return null
    }

    /**
     * Present if the request is an identity request and requests a specific permission.
     * @note This returns `nil` unless a specific permission has been requested,
     *       use `isIdentity` to check id requests.
     */
    public getIdentityPermission(): string | null {
        if (this.data.req[0] === 'identity' && this.data.req[1].permission) {
            const {permission} = this.data.req[1].permission
            return permission === PlaceholderName ? null : permission
        }
        return null
    }

    /** Get raw info dict */
    public getRawInfo(): {[key: string]: Uint8Array} {
        let rv: {[key: string]: Uint8Array} = {}
        for (const {key, value} of this.data.info) {
            rv[key] = typeof value === 'string' ? Serialize.hexToUint8Array(value) : value
        }
        return rv
    }

    /** Get metadata values as strings. */
    public getInfo(): {[key: string]: string} {
        let rv: {[key: string]: string} = {}
        let raw = this.getRawInfo()
        for (const key of Object.keys(raw)) {
            rv[key] = textDecoder.decode(raw[key] as any)
        }
        return rv
    }

    /** Set a metadata key. */
    public setInfoKey(key: string, value: string | boolean) {
        let pair = this.data.info.find((pair) => {
            return pair.key === key
        })
        let encodedValue: Uint8Array
        switch (typeof value) {
            case 'string':
                encodedValue = textEncoder.encode(value)
                break
            case 'boolean':
                encodedValue = new Uint8Array([value ? 1 : 0])
                break
            default:
                throw new TypeError('Invalid value type, expected string or boolean.')
        }
        if (!pair) {
            pair = {key, value: encodedValue}
            this.data.info.push(pair)
        } else {
            pair.value = encodedValue
        }
    }

    /** Return a deep copy of this request. */
    public clone(): SigningRequest {
        let signature: abi.RequestSignature | undefined
        if (this.signature) {
            signature = JSON.parse(JSON.stringify(this.signature))
        }
        const data = JSON.stringify(this.data, (_, value) => {
            if (value instanceof Uint8Array) {
                return Array.from(value)
            }
            return value
        })
        return new SigningRequest(
            this.version,
            JSON.parse(data),
            this.zlib,
            this.abiProvider,
            signature,
            this.scheme
        )
    }

    // Convenience methods.

    public toString() {
        return this.encode()
    }

    public toJSON() {
        return this.encode()
    }
}

export class ResolvedSigningRequest {
    /** Recreate a resolved request from a callback payload. */
    static async fromPayload(
        payload: CallbackPayload,
        options: SigningRequestEncodingOptions = {}
    ): Promise<ResolvedSigningRequest> {
        const request = SigningRequest.from(payload.req, options)
        const abis = await request.fetchAbis()
        return request.resolve(
            abis,
            {actor: payload.sa, permission: payload.sp},
            {
                ref_block_num: Number(payload.rbn),
                ref_block_prefix: Number(payload.rid),
                expiration: payload.ex,
            }
        )
    }

    public readonly request: SigningRequest
    public readonly signer: abi.PermissionLevel
    public readonly transaction: abi.Transaction
    public readonly serializedTransaction: Uint8Array

    constructor(
        request: SigningRequest,
        signer: abi.PermissionLevel,
        transaction: abi.Transaction,
        serializedTransaction: Uint8Array
    ) {
        this.request = request
        this.signer = signer
        this.transaction = transaction
        this.serializedTransaction = serializedTransaction
    }

    public getTransactionId(): string {
        return Serialize.arrayToHex(sha256(this.serializedTransaction))
    }

    public getCallback(signatures: string[], blockNum?: number): ResolvedCallback | null {
        const {callback, flags} = this.request.data
        if (!callback || callback.length === 0) {
            return null
        }
        if (!signatures || signatures.length === 0) {
            throw new Error('Must have at least one signature to resolve callback')
        }
        const payload: CallbackPayload = {
            sig: signatures[0],
            tx: this.getTransactionId(),
            rbn: String(this.transaction.ref_block_num),
            rid: String(this.transaction.ref_block_prefix),
            ex: this.transaction.expiration,
            req: this.request.encode(),
            sa: this.signer.actor,
            sp: this.signer.permission,
        }
        for (const [n, sig] of signatures.slice(1).entries() as any) {
            payload[`sig${n}`] = sig
        }
        if (blockNum) {
            payload.bn = String(blockNum)
        }
        const url = callback.replace(/({{([a-z0-9]+)}})/g, (_1, _2, m) => {
            return payload[m] || ''
        })
        return {
            background: (flags & abi.RequestFlagsBackground) !== 0,
            payload,
            url,
        }
    }
}

/** Internal helper that creates a contract representation from an abi for the eosjs serializer. */
function getContract(contractAbi: any): Serialize.Contract {
    const types = Serialize.getTypesFromAbi(Serialize.createInitialTypes(), contractAbi)
    const actions = new Map<string, Serialize.Type>()
    for (const {name, type} of contractAbi.actions) {
        actions.set(name, Serialize.getType(types, type))
    }
    return {types, actions}
}

async function serializeAction(
    action: abi.Action,
    abiProvider?: AbiProvider
) {
    if (typeof action.data === 'string') {
        return action
    }
    let contractAbi: any
    if (isIdentity(action)) {
        contractAbi = abi.data
    } else if (abiProvider) {
        contractAbi = await abiProvider.getAbi(action.account)
    } else {
        throw new Error('Missing abi provider')
    }
    const contract = getContract(contractAbi)
    return Serialize.serializeAction(
        contract,
        action.account,
        action.name,
        action.authorization,
        action.data
    )
}

function variantId(chainId?: abi.ChainId | abi.ChainAlias): abi.VariantId {
    if (!chainId) {
        chainId = ChainName.EOS
    }
    if (typeof chainId === 'number') {
        return ['chain_alias', chainId]
    } else {
        // resolve known chain id's to their aliases
        const name = idToName(chainId)
        if (name !== ChainName.UNKNOWN) {
            return ['chain_alias', name]
        }
        return ['chain_id', chainId]
    }
}

function isIdentity(action: abi.Action) {
    return action.account === '' && action.name === 'identity'
}

function hasTapos(tx: abi.Transaction) {
    return !(
        tx.expiration === '1970-01-01T00:00:00.000' &&
        tx.ref_block_num === 0 &&
        tx.ref_block_prefix === 0
    )
}

/** Resolve a chain id to a chain name alias, returns UNKNOWN (0x00) if the chain id has no alias. */
export function idToName(chainId: abi.ChainId): ChainName {
    chainId = chainId.toLowerCase()
    for (const [n, id] of ChainIdLookup as any) {
        if (id === chainId) {
            n
        }
    }
    return ChainName.UNKNOWN
}

/** Resolve a chain name alias to a chain id. */
export function nameToId(chainName: ChainName): abi.ChainId {
    return (
        ChainIdLookup.get(chainName) ||
        '0000000000000000000000000000000000000000000000000000000000000000'
    )
}
