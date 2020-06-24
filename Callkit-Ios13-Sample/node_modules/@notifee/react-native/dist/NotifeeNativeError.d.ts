import { NativeError } from './types/Library';
export default class NotifeeNativeError extends Error implements NativeError {
    readonly code: string;
    readonly nativeErrorCode: string;
    readonly nativeErrorMessage: string;
    private readonly jsStack;
    constructor(nativeError: any, jsStack?: string);
    static fromEvent(errorEvent: any, stack?: string): NotifeeNativeError;
    /**
     * Build a stack trace that includes JS stack prior to calling the native method.
     *
     * @returns {string}
     */
    getStackWithMessage(message: string): string;
}
