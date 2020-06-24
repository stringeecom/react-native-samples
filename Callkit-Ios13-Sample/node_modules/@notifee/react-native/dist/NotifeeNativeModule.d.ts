import { EventEmitter, NativeModulesStatic } from 'react-native';
import { JsonConfig } from './types/Module';
export interface NativeModuleConfig {
    version: string;
    nativeModuleName: string;
    nativeEvents: string[];
}
export default class NotifeeNativeModule {
    private readonly _moduleConfig;
    private _nativeModule;
    private _nativeEmitter;
    private _notifeeConfig;
    constructor(config: NativeModuleConfig);
    get config(): JsonConfig;
    get emitter(): EventEmitter;
    get native(): NativeModulesStatic;
}
