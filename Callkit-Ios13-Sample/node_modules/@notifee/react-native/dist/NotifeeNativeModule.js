"use strict";
/*
 * Copyright (c) 2016-present Invertase Limited
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const NotifeeJSEventEmitter_1 = __importDefault(require("./NotifeeJSEventEmitter"));
const react_native_1 = require("react-native");
class NotifeeNativeModule {
    constructor(config) {
        this._nativeModule = null;
        this._notifeeConfig = null;
        this._moduleConfig = Object.assign({}, config);
        this._nativeEmitter = new react_native_1.NativeEventEmitter(this.native);
        for (let i = 0; i < config.nativeEvents.length; i++) {
            const eventName = config.nativeEvents[i];
            this._nativeEmitter.addListener(eventName, (payload) => {
                this.emitter.emit(eventName, payload);
            });
        }
    }
    get config() {
        if (this._notifeeConfig) {
            return this._notifeeConfig;
        }
        this._notifeeConfig = JSON.parse(this.native.NOTIFEE_RAW_JSON);
        return this._notifeeConfig;
    }
    get emitter() {
        return NotifeeJSEventEmitter_1.default;
    }
    get native() {
        if (this._nativeModule) {
            return this._nativeModule;
        }
        this._nativeModule = react_native_1.NativeModules[this._moduleConfig.nativeModuleName];
        if (this._nativeModule == null) {
            throw new Error('Notifee native module not found.');
        }
        return this._nativeModule;
    }
}
exports.default = NotifeeNativeModule;
//# sourceMappingURL=NotifeeNativeModule.js.map