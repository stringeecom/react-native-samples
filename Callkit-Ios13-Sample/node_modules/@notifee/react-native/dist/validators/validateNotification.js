"use strict";
/*
 * Copyright (c) 2016-present Invertase Limited
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../utils");
const validateAndroidNotification_1 = __importDefault(require("./validateAndroidNotification"));
const validateIOSNotification_1 = __importDefault(require("./validateIOSNotification"));
function validateNotification(notification) {
    if (!utils_1.isObject(notification)) {
        throw new Error("'notification' expected an object value.");
    }
    // Defaults
    const out = {
        id: '',
        title: '',
        subtitle: '',
        body: '',
        data: {},
    };
    if (utils_1.isAndroid) {
        /* istanbul ignore next */
        out.android = {};
    }
    else if (utils_1.isIOS) {
        out.ios = {};
    }
    /**
     * id
     */
    if (utils_1.objectHasProperty(notification, 'id')) {
        if (!utils_1.isString(notification.id) || !notification.id) {
            throw new Error("'notification.id' invalid notification ID, expected a unique string value.");
        }
        out.id = notification.id;
    }
    else {
        out.id = utils_1.generateId();
    }
    /**
     * title
     */
    if (utils_1.objectHasProperty(notification, 'title')) {
        if (!utils_1.isString(notification.title)) {
            throw new Error("'notification.title' expected a string value.");
        }
        out.title = notification.title;
    }
    /**
     * body
     */
    if (utils_1.objectHasProperty(notification, 'body')) {
        if (!utils_1.isString(notification.body)) {
            throw new Error("'notification.body' expected a string value.");
        }
        out.body = notification.body;
    }
    /**
     * subtitle
     */
    if (utils_1.objectHasProperty(notification, 'subtitle')) {
        if (!utils_1.isString(notification.subtitle)) {
            throw new Error("'notification.subtitle' expected a string value.");
        }
        out.subtitle = notification.subtitle;
    }
    /**
     * data
     */
    if (utils_1.objectHasProperty(notification, 'data') && notification.data != undefined) {
        if (!utils_1.isObject(notification.data)) {
            throw new Error("'notification.data' expected an object value containing key/value pairs.");
        }
        const entries = Object.entries(notification.data);
        for (let i = 0; i < entries.length; i++) {
            const [key, value] = entries[i];
            if (!utils_1.isString(value)) {
                throw new Error(`'notification.data' value for key "${key}" is invalid, expected a string value.`);
            }
        }
        out.data = notification.data;
    }
    /**
     * android
     */
    const validatedAndroid = validateAndroidNotification_1.default(notification.android);
    if (utils_1.isAndroid) {
        /* istanbul ignore next */
        out.android = validatedAndroid;
    }
    /**
     * ios
     */
    const validatedIOS = validateIOSNotification_1.default(notification.ios);
    if (utils_1.isIOS) {
        out.ios = validatedIOS;
    }
    return out;
}
exports.default = validateNotification;
//# sourceMappingURL=validateNotification.js.map