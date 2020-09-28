/**
 * Base64u - URL-Safe Base64 variant no padding.
 * Based on https://gist.github.com/jonleighton/958841
 */
export declare function encode(data: Uint8Array): string;
export declare function decode(input: string): Uint8Array;
