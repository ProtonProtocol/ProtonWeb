/**
 * EOSIO Signing Request (ESR).
 */
import { Serialize } from 'eosjs';
import * as abi from './abi';
/** Interface that should be implemented by abi providers. */
export interface AbiProvider {
    /**
     * Return a promise that resolves to an abi object for the given account name,
     * e.g. the result of a rpc call to chain/get_abi.
     */
    getAbi: (account: string) => Promise<any>;
}
/** Interface that should be implemented by zlib implementations. */
export interface ZlibProvider {
    /** Deflate data w/o adding zlib header. */
    deflateRaw: (data: Uint8Array) => Uint8Array;
    /** Inflate data w/o requiring zlib header. */
    inflateRaw: (data: Uint8Array) => Uint8Array;
}
/** Interface that should be implemented by signature providers. */
export interface SignatureProvider {
    /** Sign 32-byte hex-encoded message and return signer name and signature string. */
    sign: (message: string) => {
        signer: string;
        signature: string;
    };
}
/**
 * The callback payload sent to background callbacks.
 */
export interface CallbackPayload {
    /** The first signature. */
    sig: string;
    /** Transaction ID as HEX-encoded string. */
    tx: string;
    /** Block number hint (only present if transaction was broadcast). */
    bn?: string;
    /** Signer authority, aka account name. */
    sa: string;
    /** Signer permission, e.g. "active". */
    sp: string;
    /** Reference block num used when resolving request. */
    rbn: string;
    /** Reference block id used when resolving request. */
    rid: string;
    /** The originating signing request packed as a uri string. */
    req: string;
    /** Expiration time used when resolving request. */
    ex: string;
    /** All signatures 0-indexed as `sig0`, `sig1`, etc. */
    [sig0: string]: string | undefined;
}
/**
 * Context used to resolve a callback.
 * Compatible with the JSON response from a `push_transaction` call.
 */
export interface ResolvedCallback {
    /** The URL to hit. */
    url: string;
    /**
     * Whether to run the request in the background. For a https url this
     * means POST in the background instead of a GET redirect.
     */
    background: boolean;
    /**
     * The callback payload as a object that should be encoded to JSON
     * and POSTed to background callbacks.
     */
    payload: CallbackPayload;
}
/**
 * Context used to resolve a transaction.
 * Compatible with the JSON response from a `get_block` call.
 */
export interface TransactionContext {
    /** Timestamp expiration will be derived from. */
    timestamp?: string;
    /**
     * How many seconds in the future to set expiration when deriving from timestamp.
     * Defaults to 60 seconds if unset.
     */
    expire_seconds?: number;
    /** Block number ref_block_num will be derived from. */
    block_num?: number;
    /** Reference block number, takes precedence over block_num if both is set. */
    ref_block_num?: number;
    /** Reference block prefix. */
    ref_block_prefix?: number;
    /** Expiration timestamp, takes precedence over timestamp and expire_seconds if set. */
    expiration?: string;
}
/** Chain ID aliases. */
export declare enum ChainName {
    UNKNOWN = 0,
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
    FIO = 12
}
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
export declare const PlaceholderName = "............1";
/** Placeholder that will resolve to signer permission name. */
export declare const PlaceholderPermission = "............2";
export declare const PlaceholderAuth: abi.PermissionLevel;
export declare type CallbackType = string | {
    url: string;
    background: boolean;
};
export interface SigningRequestCreateArguments {
    /** Single action to create request with. */
    action?: abi.Action;
    /** Multiple actions to create request with. */
    actions?: abi.Action[];
    /**
     * Full or partial transaction to create request with.
     * If TAPoS info is omitted it will be filled in when resolving the request.
     */
    transaction?: {
        actions: abi.Action[];
        [key: string]: any;
    };
    /** Create an identity request. */
    identity?: abi.Identity;
    /** Chain to use, defaults to EOS main-net if omitted. */
    chainId?: string | number;
    /** Whether wallet should broadcast tx, defaults to true. */
    broadcast?: boolean;
    /**
     * Optional callback URL the signer should hit after
     * broadcasting or signing. Passing a string means background = false.
     */
    callback?: CallbackType;
    /** Optional metadata to pass along with the request. */
    info?: {
        [key: string]: string | Uint8Array;
    };
}
export interface SigningRequestCreateIdentityArguments {
    /**
     * Callback where the identity should be delivered.
     */
    callback: CallbackType;
    /** Chain to use, defaults to EOS if omitted. */
    chainId?: string | number;
    /**
     * Requested account name of identity.
     * Defaults to placeholder (any identity) if omitted.
     */
    account?: string;
    /**
     * Requested account permission.
     * Defaults to placeholder (any permission) if omitted.
     */
    permission?: string;
    /** Optional metadata to pass along with the request. */
    info?: {
        [key: string]: string | Uint8Array;
    };
}
export interface SigningRequestEncodingOptions {
    /** UTF-8 text encoder, required when using node.js. */
    textEncoder?: any;
    /** UTF-8 text decoder, required when using node.js. */
    textDecoder?: any;
    /** Optional zlib, if provided the request will be compressed when encoding. */
    zlib?: ZlibProvider;
    /** Abi provider, required if the arguments contain un-encoded actions. */
    abiProvider?: AbiProvider;
    /** Optional signature provider, will be used to create a request signature if provided. */
    signatureProvider?: SignatureProvider;
    /** Custom Scheme . */
    scheme?: string;
}
export declare type AbiMap = Map<string, any>;
export declare class SigningRequest {
    static type: Serialize.Type;
    static idType: Serialize.Type;
    static transactionType: Serialize.Type;
    scheme: string;
    /** Create a new signing request. */
    static create(args: SigningRequestCreateArguments, options?: SigningRequestEncodingOptions): Promise<SigningRequest>;
    /** Creates an identity request. */
    static identity(args: SigningRequestCreateIdentityArguments, options?: SigningRequestEncodingOptions): Promise<SigningRequest>;
    /**
     * Create a request from a chain id and serialized transaction.
     * @param chainId The chain id where the transaction is valid.
     * @param serializedTransaction The serialized transaction.
     * @param options Creation options.
     */
    static fromTransaction(chainId: Uint8Array | string, serializedTransaction: Uint8Array | string, options?: SigningRequestEncodingOptions): SigningRequest;
    /** Creates a signing request from encoded `esr:` uri string. */
    static from(uri: string, options?: SigningRequestEncodingOptions): SigningRequest;
    static fromData(data: Uint8Array, options?: SigningRequestEncodingOptions): SigningRequest;
    /** The signing request version. */
    version: number;
    /** The raw signing request data. */
    data: abi.SigningRequest;
    /** The request signature. */
    signature?: abi.RequestSignature;
    private textEncoder;
    private textDecoder;
    private zlib?;
    private abiProvider?;
    /**
     * Create a new signing request.
     * Normally not used directly, see the `create` and `from` class methods.
     */
    constructor(version: number, data: abi.SigningRequest, textEncoder: TextEncoder, textDecoder: TextDecoder, zlib?: ZlibProvider, abiProvider?: AbiProvider, signature?: abi.RequestSignature, scheme?: string);
    /**
     * Sign the request, mutating.
     * @param signatureProvider The signature provider that provides a signature for the signer.
     */
    sign(signatureProvider: SignatureProvider): void;
    /**
     * Get the signature digest for this request.
     */
    getSignatureDigest(): Uint8Array;
    /**
     * Set the signature data for this request, mutating.
     * @param signer Account name of signer.
     * @param signature The signature string.
     */
    setSignature(signer: string, signature: string): void;
    /**
     * Set the request callback, mutating.
     * @param url Where the callback should be sent.
     * @param background Whether the callback should be sent in the background.
     */
    setCallback(url: string, background: boolean): void;
    /**
     * Set broadcast flag.
     * @param broadcast Whether the transaction should be broadcast by receiver.
     */
    setBroadcast(broadcast: boolean): void;
    /**
     * Encode this request into an `esr:` uri.
     * @argument compress Whether to compress the request data using zlib,
     *                    defaults to true if omitted and zlib is present;
     *                    otherwise false.
     * @argument slashes Whether add slashes after the protocol scheme, i.e. `esr://`.
     *                   Defaults to true.
     * @returns An esr uri string.
     */
    encode(compress?: boolean, slashes?: boolean): string;
    /** Get the request data without header or signature. */
    getData(): Uint8Array;
    /** Get signature data, returns an empty array if request is not signed. */
    getSignatureData(): Uint8Array;
    /** ABI definitions required to resolve request. */
    getRequiredAbis(): string[];
    /** Whether TaPoS values are required to resolve request. */
    requiresTapos(): boolean;
    /** Resolve required ABI definitions. */
    fetchAbis(abiProvider?: AbiProvider): Promise<AbiMap>;
    /**
     * Decode raw actions actions to object representations.
     * @param abis ABI defenitions required to decode all actions.
     * @param signer Placeholders in actions will be resolved to signer if set.
     */
    resolveActions(abis: AbiMap, signer?: abi.PermissionLevel): abi.Action[];
    resolveTransaction(abis: AbiMap, signer: abi.PermissionLevel, ctx?: TransactionContext): abi.Transaction;
    resolve(abis: AbiMap, signer: abi.PermissionLevel, ctx?: TransactionContext): ResolvedSigningRequest;
    /**
     * Get Scheme
     * @returns scheme like 'esr'
     */
    getScheme(): string;
    /**
     * Get the id of the chain where this request is valid.
     * @returns The 32-byte chain id as hex encoded string.
     */
    getChainId(): abi.ChainId;
    /** Return the actions in this request with action data encoded. */
    getRawActions(): abi.Action[];
    /** Unresolved transaction. */
    getRawTransaction(): abi.Transaction;
    /** Whether the request is an identity request. */
    isIdentity(): boolean;
    /** Whether the request should be broadcast by signer. */
    shouldBroadcast(): boolean;
    /**
     * Present if the request is an identity request and requests a specific account.
     * @note This returns `nil` unless a specific identity has been requested,
     *       use `isIdentity` to check id requests.
     */
    getIdentity(): string | null;
    /**
     * Present if the request is an identity request and requests a specific permission.
     * @note This returns `nil` unless a specific permission has been requested,
     *       use `isIdentity` to check id requests.
     */
    getIdentityPermission(): string | null;
    /** Get raw info dict */
    getRawInfo(): {
        [key: string]: Uint8Array;
    };
    /** Get metadata values as strings. */
    getInfo(): {
        [key: string]: string;
    };
    /** Set a metadata key. */
    setInfoKey(key: string, value: string | boolean): void;
    /** Return a deep copy of this request. */
    clone(): SigningRequest;
    toString(): string;
    toJSON(): string;
}
export declare class ResolvedSigningRequest {
    /** Recreate a resolved request from a callback payload. */
    static fromPayload(payload: CallbackPayload, options?: SigningRequestEncodingOptions): Promise<ResolvedSigningRequest>;
    readonly request: SigningRequest;
    readonly signer: abi.PermissionLevel;
    readonly transaction: abi.Transaction;
    readonly serializedTransaction: Uint8Array;
    constructor(request: SigningRequest, signer: abi.PermissionLevel, transaction: abi.Transaction, serializedTransaction: Uint8Array);
    getTransactionId(): string;
    getCallback(signatures: string[], blockNum?: number): ResolvedCallback | null;
}
/** Resolve a chain id to a chain name alias, returns UNKNOWN (0x00) if the chain id has no alias. */
export declare function idToName(chainId: abi.ChainId): ChainName;
/** Resolve a chain name alias to a chain id. */
export declare function nameToId(chainName: ChainName): abi.ChainId;
