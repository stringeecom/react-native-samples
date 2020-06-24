"use strict";
/*
 * Copyright (c) 2016-present Invertase Limited
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateAndroidMessagingStyle = exports.validateAndroidMessagingStyleMessage = exports.validateAndroidPerson = exports.validateAndroidInboxStyle = exports.validateAndroidBigTextStyle = exports.validateAndroidBigPictureStyle = void 0;
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
const resolveAssetSource_1 = __importDefault(require("react-native/Libraries/Image/resolveAssetSource"));
const NotificationAndroid_1 = require("../types/NotificationAndroid");
const utils_1 = require("../utils");
/**
 * Validates a BigPictureStyle
 */
function validateAndroidBigPictureStyle(style) {
    if ((!utils_1.isString(style.picture) && !utils_1.isNumber(style.picture) && !utils_1.isObject(style.picture)) ||
        (utils_1.isString(style.picture) && !style.picture.length)) {
        throw new Error("'notification.android.style' BigPictureStyle: 'picture' expected a number or object created using the 'require()' method or a valid string URL.");
    }
    // Defaults
    const out = {
        type: NotificationAndroid_1.AndroidStyle.BIGPICTURE,
        picture: style.picture,
    };
    if (utils_1.isNumber(style.picture) || utils_1.isObject(style.picture)) {
        const image = resolveAssetSource_1.default(style.picture);
        out.picture = image.uri;
    }
    if (utils_1.objectHasProperty(style, 'largeIcon')) {
        if (!utils_1.isString(style.largeIcon) && !utils_1.isNumber(style.largeIcon) && !utils_1.isObject(style.largeIcon)) {
            throw new Error("'notification.android.style' BigPictureStyle: 'largeIcon' expected a React Native ImageResource value or a valid string URL.");
        }
        if (utils_1.isNumber(style.largeIcon) || utils_1.isObject(style.largeIcon)) {
            const image = resolveAssetSource_1.default(style.largeIcon);
            out.largeIcon = image.uri;
        }
        else {
            out.largeIcon = style.largeIcon;
        }
    }
    if (utils_1.objectHasProperty(style, 'title')) {
        if (!utils_1.isString(style.title)) {
            throw new Error("'notification.android.style' BigPictureStyle: 'title' expected a string value.");
        }
        out.title = style.title;
    }
    if (utils_1.objectHasProperty(style, 'summary')) {
        if (!utils_1.isString(style.summary)) {
            throw new Error("'notification.android.style' BigPictureStyle: 'summary' expected a string value.");
        }
        out.summary = style.summary;
    }
    return out;
}
exports.validateAndroidBigPictureStyle = validateAndroidBigPictureStyle;
/**
 * Validates a BigTextStyle
 */
function validateAndroidBigTextStyle(style) {
    if (!utils_1.isString(style.text) || !style.text) {
        throw new Error("'notification.android.style' BigTextStyle: 'text' expected a valid string value.");
    }
    // Defaults
    const out = {
        type: NotificationAndroid_1.AndroidStyle.BIGTEXT,
        text: style.text,
    };
    if (utils_1.objectHasProperty(style, 'title')) {
        if (!utils_1.isString(style.title)) {
            throw new Error("'notification.android.style' BigTextStyle: 'title' expected a string value.");
        }
        out.title = style.title;
    }
    if (utils_1.objectHasProperty(style, 'summary')) {
        if (!utils_1.isString(style.summary)) {
            throw new Error("'notification.android.style' BigTextStyle: 'summary' expected a string value.");
        }
        out.summary = style.summary;
    }
    return out;
}
exports.validateAndroidBigTextStyle = validateAndroidBigTextStyle;
/**
 * Validates a InboxStyle
 */
function validateAndroidInboxStyle(style) {
    if (!utils_1.isArray(style.lines)) {
        throw new Error("'notification.android.style' InboxStyle: 'lines' expected an array.");
    }
    for (let i = 0; i < style.lines.length; i++) {
        const line = style.lines[i];
        if (!utils_1.isString(line)) {
            throw new Error(`'notification.android.style' InboxStyle: 'lines' expected a string value at array index ${i}.`);
        }
    }
    const out = {
        type: NotificationAndroid_1.AndroidStyle.INBOX,
        lines: style.lines,
    };
    if (utils_1.objectHasProperty(style, 'title')) {
        if (!utils_1.isString(style.title)) {
            throw new Error("'notification.android.style' InboxStyle: 'title' expected a string value.");
        }
        out.title = style.title;
    }
    if (utils_1.objectHasProperty(style, 'summary')) {
        if (!utils_1.isString(style.summary)) {
            throw new Error("'notification.android.style' InboxStyle: 'summary' expected a string value.");
        }
        out.summary = style.summary;
    }
    return out;
}
exports.validateAndroidInboxStyle = validateAndroidInboxStyle;
/**
 * Validates an AndroidPerson
 */
function validateAndroidPerson(person) {
    if (!utils_1.isString(person.name)) {
        throw new Error("'person.name' expected a string value.");
    }
    const out = {
        name: person.name,
        bot: false,
        important: false,
    };
    if (utils_1.objectHasProperty(person, 'id')) {
        if (!utils_1.isString(person.id)) {
            throw new Error("'person.id' expected a string value.");
        }
        out.id = person.id;
    }
    if (utils_1.objectHasProperty(person, 'bot')) {
        if (!utils_1.isBoolean(person.bot)) {
            throw new Error("'person.bot' expected a boolean value.");
        }
        out.bot = person.bot;
    }
    if (utils_1.objectHasProperty(person, 'important')) {
        if (!utils_1.isBoolean(person.important)) {
            throw new Error("'person.important' expected a boolean value.");
        }
        out.important = person.important;
    }
    if (utils_1.objectHasProperty(person, 'icon')) {
        if (!utils_1.isString(person.icon)) {
            throw new Error("'person.icon' expected a string value.");
        }
        out.icon = person.icon;
    }
    if (utils_1.objectHasProperty(person, 'uri')) {
        if (!utils_1.isString(person.uri)) {
            throw new Error("'person.uri' expected a string value.");
        }
        out.uri = person.uri;
    }
    return out;
}
exports.validateAndroidPerson = validateAndroidPerson;
function validateAndroidMessagingStyleMessage(message) {
    //text, timestamp, person
    if (!utils_1.isString(message.text)) {
        throw new Error("'message.text' expected a string value.");
    }
    if (!utils_1.isNumber(message.timestamp)) {
        throw new Error("'message.timestamp' expected a number value.");
    }
    const out = {
        text: message.text,
        timestamp: message.timestamp,
    };
    if (utils_1.objectHasProperty(message, 'person') && message.person != undefined) {
        try {
            out.person = validateAndroidPerson(message.person);
        }
        catch (e) {
            throw new Error(`'message.person' is invalid. ${e.message}`);
        }
    }
    return out;
}
exports.validateAndroidMessagingStyleMessage = validateAndroidMessagingStyleMessage;
/**
 * Validates a MessagingStyle
 */
function validateAndroidMessagingStyle(style) {
    if (!utils_1.isObject(style.person)) {
        throw new Error("'notification.android.style' MessagingStyle: 'person' an object value.");
    }
    let person;
    const messages = [];
    try {
        person = validateAndroidPerson(style.person);
    }
    catch (e) {
        throw new Error(`'notification.android.style' MessagingStyle: ${e.message}.`);
    }
    if (!utils_1.isArray(style.messages)) {
        throw new Error("'notification.android.style' MessagingStyle: 'messages' expected an array value.");
    }
    for (let i = 0; i < style.messages.length; i++) {
        try {
            messages.push(validateAndroidMessagingStyleMessage(style.messages[i]));
        }
        catch (e) {
            throw new Error(`'notification.android.style' MessagingStyle: invalid message at index ${i}. ${e.message}`);
        }
    }
    const out = {
        type: NotificationAndroid_1.AndroidStyle.MESSAGING,
        person,
        messages,
        group: false,
    };
    if (utils_1.objectHasProperty(style, 'title')) {
        if (!utils_1.isString(style.title)) {
            throw new Error("'notification.android.style' MessagingStyle: 'title' expected a string value.");
        }
        out.title = style.title;
    }
    if (utils_1.objectHasProperty(style, 'group')) {
        if (!utils_1.isBoolean(style.group)) {
            throw new Error("'notification.android.style' MessagingStyle: 'group' expected a boolean value.");
        }
        out.group = style.group;
    }
    return out;
}
exports.validateAndroidMessagingStyle = validateAndroidMessagingStyle;
//# sourceMappingURL=validateAndroidStyle.js.map