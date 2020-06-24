"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable @typescript-eslint/ban-ts-ignore */
/*
 * Copyright (c) 2016-present Invertase Limited
 */
// @ts-ignore
const resolveAssetSource_1 = __importDefault(require("react-native/Libraries/Image/resolveAssetSource"));
const utils_1 = require("../utils");
const NotificationAndroid_1 = require("../types/NotificationAndroid");
const NotificationAndroid_2 = require("../types/NotificationAndroid");
const validate_1 = require("./validate");
const validateAndroidStyle_1 = require("./validateAndroidStyle");
const validateAndroidPressAction_1 = __importDefault(require("./validateAndroidPressAction"));
const validateAndroidAction_1 = __importDefault(require("./validateAndroidAction"));
function validateAndroidNotification(android) {
    // Notification default values
    const out = {
        autoCancel: true,
        asForegroundService: false,
        badgeIconType: NotificationAndroid_2.AndroidBadgeIconType.LARGE,
        colorized: false,
        chronometerDirection: 'up',
        defaults: [NotificationAndroid_2.AndroidDefaults.ALL],
        groupAlertBehavior: NotificationAndroid_2.AndroidGroupAlertBehavior.ALL,
        groupSummary: false,
        localOnly: false,
        ongoing: false,
        onlyAlertOnce: false,
        importance: NotificationAndroid_1.AndroidImportance.DEFAULT,
        showTimestamp: false,
        smallIcon: 'ic_launcher',
        showChronometer: false,
        visibility: NotificationAndroid_2.AndroidVisibility.PRIVATE,
    };
    if (utils_1.isUndefined(android)) {
        return out;
    }
    if (!utils_1.isUndefined(android) && !utils_1.isObject(android)) {
        throw new Error("'notification.android' expected an object value.");
    }
    /**
     * actions
     */
    if (utils_1.objectHasProperty(android, 'actions') && android.actions != undefined) {
        if (!utils_1.isArray(android.actions)) {
            throw new Error("'notification.android.actions' expected an array of AndroidAction types.");
        }
        const actions = [];
        try {
            for (let i = 0; i < android.actions.length; i++) {
                actions.push(validateAndroidAction_1.default(android.actions[i]));
            }
        }
        catch (e) {
            throw new Error(`'notification.android.actions' invalid AndroidAction. ${e.message}.`);
        }
        if (actions.length) {
            out.actions = android.actions;
        }
    }
    /**
     * asForegroundService
     */
    if (utils_1.objectHasProperty(android, 'asForegroundService')) {
        if (!utils_1.isBoolean(android.asForegroundService)) {
            throw new Error("'notification.android.asForegroundService' expected a boolean value.");
        }
        out.asForegroundService = android.asForegroundService;
    }
    /**
     * autoCancel
     */
    if (utils_1.objectHasProperty(android, 'autoCancel')) {
        if (!utils_1.isBoolean(android.autoCancel)) {
            throw new Error("'notification.android.autoCancel' expected a boolean value.");
        }
        out.autoCancel = android.autoCancel;
    }
    /**
     * badgeCount
     */
    if (utils_1.objectHasProperty(android, 'badgeCount')) {
        if (!utils_1.isNumber(android.badgeCount)) {
            throw new Error("'notification.android.badgeCount' expected a number value.");
        }
        out.badgeCount = android.badgeCount;
    }
    /**
     * badgeIconType
     */
    if (utils_1.objectHasProperty(android, 'badgeIconType') && !utils_1.isUndefined(android.badgeIconType)) {
        if (!Object.values(NotificationAndroid_2.AndroidBadgeIconType).includes(android.badgeIconType)) {
            throw new Error("'notification.android.badgeIconType' expected a valid AndroidBadgeIconType.");
        }
        out.badgeIconType = android.badgeIconType;
    }
    /**
     * category
     */
    if (utils_1.objectHasProperty(android, 'category') && !utils_1.isUndefined(android.category)) {
        if (!Object.values(NotificationAndroid_2.AndroidCategory).includes(android.category)) {
            throw new Error("'notification.android.category' expected a valid AndroidCategory.");
        }
        out.category = android.category;
    }
    /**
     * channelId
     */
    if (!utils_1.isString(android.channelId)) {
        throw new Error("'notification.android.channelId' expected a string value.");
    }
    out.channelId = android.channelId;
    /**
     * color
     */
    if (utils_1.objectHasProperty(android, 'color') && !utils_1.isUndefined(android.color)) {
        if (!utils_1.isString(android.color)) {
            throw new Error("'notification.android.color' expected a string value.");
        }
        if (!validate_1.isValidColor(android.color)) {
            throw new Error("'notification.android.color' invalid color. Expected an AndroidColor or hexadecimal string value.");
        }
        out.color = android.color;
    }
    /**
     * colorized
     */
    if (utils_1.objectHasProperty(android, 'colorized')) {
        if (!utils_1.isBoolean(android.colorized)) {
            throw new Error("'notification.android.colorized' expected a boolean value.");
        }
        out.colorized = android.colorized;
    }
    /**
     * chronometerDirection
     */
    if (utils_1.objectHasProperty(android, 'chronometerDirection')) {
        if (!utils_1.isString(android.chronometerDirection)) {
            throw new Error("'notification.android.chronometerDirection' expected a string value.");
        }
        if (android.chronometerDirection !== 'up' && android.chronometerDirection !== 'down') {
            throw new Error(`'notification.android.chronometerDirection' must be one of "up" or "down".`);
        }
        out.chronometerDirection = android.chronometerDirection;
    }
    /**
     * defaults
     */
    if (utils_1.objectHasProperty(android, 'defaults') && !utils_1.isUndefined(android.defaults)) {
        if (!utils_1.isArray(android.defaults)) {
            throw new Error("'notification.android.defaults' expected an array.");
        }
        if (android.defaults.length === 0) {
            throw new Error("'notification.android.defaults' expected an array containing AndroidDefaults.");
        }
        const defaults = Object.values(NotificationAndroid_2.AndroidDefaults);
        for (let i = 0; i < android.defaults.length; i++) {
            if (!defaults.includes(android.defaults[i])) {
                throw new Error("'notification.android.defaults' invalid array value, expected an AndroidDefaults value.");
            }
        }
        out.defaults = android.defaults;
    }
    /**
     * groupId
     */
    if (utils_1.objectHasProperty(android, 'groupId')) {
        if (!utils_1.isString(android.groupId)) {
            throw new Error("'notification.android.groupId' expected a string value.");
        }
        out.groupId = android.groupId;
    }
    /**
     * groupAlertBehavior
     */
    if (utils_1.objectHasProperty(android, 'groupAlertBehavior') &&
        !utils_1.isUndefined(android.groupAlertBehavior)) {
        if (!Object.values(NotificationAndroid_2.AndroidGroupAlertBehavior).includes(android.groupAlertBehavior)) {
            throw new Error("'notification.android.groupAlertBehavior' expected a valid AndroidGroupAlertBehavior.");
        }
        out.groupAlertBehavior = android.groupAlertBehavior;
    }
    /**
     * groupSummary
     */
    if (utils_1.objectHasProperty(android, 'groupSummary')) {
        if (!utils_1.isBoolean(android.groupSummary)) {
            throw new Error("'notification.android.groupSummary' expected a boolean value.");
        }
        out.groupSummary = android.groupSummary;
    }
    if (utils_1.objectHasProperty(android, 'inputHistory')) {
        if (!utils_1.isArrayOfStrings(android.inputHistory)) {
            throw new Error("'notification.android.inputHistory' expected an array of string values.");
        }
        out.inputHistory = android.inputHistory;
    }
    /**
     * largeIcon
     */
    if (utils_1.objectHasProperty(android, 'largeIcon')) {
        if ((!utils_1.isNumber(android.largeIcon) &&
            !utils_1.isString(android.largeIcon) &&
            !utils_1.isObject(android.largeIcon)) ||
            (utils_1.isString(android.largeIcon) && !android.largeIcon.length)) {
            throw new Error("'notification.android.largeIcon' expected a React Native ImageResource value or a valid string URL.");
        }
        if (utils_1.isNumber(android.largeIcon) || utils_1.isObject(android.largeIcon)) {
            const image = resolveAssetSource_1.default(android.largeIcon);
            out.largeIcon = image.uri;
        }
        else {
            out.largeIcon = android.largeIcon;
        }
    }
    /**
     * lights
     */
    if (utils_1.objectHasProperty(android, 'lights') && !utils_1.isUndefined(android.lights)) {
        if (!utils_1.isArray(android.lights)) {
            throw new Error("'notification.android.lights' expected an array value containing the color, on ms and off ms.");
        }
        const [valid, property] = validate_1.isValidLightPattern(android.lights);
        if (!valid) {
            switch (property) {
                case 'color':
                    throw new Error("'notification.android.lights' invalid color. Expected an AndroidColor or hexadecimal string value.");
                case 'onMs':
                    throw new Error(`'notification.android.lights\' invalid "on" millisecond value, expected a number greater than 0.`);
                case 'offMs':
                    throw new Error(`notification.android.lights\' invalid "off" millisecond value, expected a number greater than 0.`);
            }
        }
        out.lights = android.lights;
    }
    /**
     * localOnly
     */
    if (utils_1.objectHasProperty(android, 'localOnly')) {
        if (!utils_1.isBoolean(android.localOnly)) {
            throw new Error("'notification.android.localOnly' expected a boolean value.");
        }
        out.localOnly = android.localOnly;
    }
    /**
     * ongoing
     */
    if (utils_1.objectHasProperty(android, 'ongoing')) {
        if (!utils_1.isBoolean(android.ongoing)) {
            throw new Error("'notification.android.ongoing' expected a boolean value.");
        }
        out.ongoing = android.ongoing;
    }
    /**
     * onlyAlertOnce
     */
    if (utils_1.objectHasProperty(android, 'onlyAlertOnce')) {
        if (!utils_1.isBoolean(android.onlyAlertOnce)) {
            throw new Error("'notification.android.onlyAlertOnce' expected a boolean value.");
        }
        out.onlyAlertOnce = android.onlyAlertOnce;
    }
    /**
     * pressAction
     */
    if (utils_1.objectHasProperty(android, 'pressAction') && !utils_1.isUndefined(android.pressAction)) {
        try {
            out.pressAction = validateAndroidPressAction_1.default(android.pressAction);
        }
        catch (e) {
            throw new Error(`'notification.android.pressAction' ${e.message}`);
        }
    }
    /**
     * importance
     */
    if (utils_1.objectHasProperty(android, 'importance') && !utils_1.isUndefined(android.importance)) {
        if (!Object.values(NotificationAndroid_1.AndroidImportance).includes(android.importance)) {
            throw new Error("'notification.android.importance' expected a valid Importance.");
        }
        out.importance = android.importance;
    }
    /**
     * progress
     */
    if (utils_1.objectHasProperty(android, 'progress') && !utils_1.isUndefined(android.progress)) {
        if (!utils_1.isObject(android.progress)) {
            throw new Error("'notification.android.progress' expected an object value.");
        }
        const progress = {
            indeterminate: false,
        };
        if (utils_1.objectHasProperty(android.progress, 'indeterminate')) {
            if (!utils_1.isBoolean(android.progress.indeterminate)) {
                throw new Error("'notification.android.progress.indeterminate' expected a boolean value.");
            }
            progress.indeterminate = android.progress.indeterminate;
        }
        if (!utils_1.isUndefined(android.progress.max)) {
            if (!utils_1.isNumber(android.progress.max) || android.progress.max < 0) {
                throw new Error("'notification.android.progress.max' expected a positive number value.");
            }
            if (utils_1.isUndefined(android.progress.current)) {
                throw new Error("'notification.android.progress.max' when providing a max value, you must also specify a current value.");
            }
            progress.max = android.progress.max;
        }
        if (!utils_1.isUndefined(android.progress.current)) {
            if (!utils_1.isNumber(android.progress.current) || android.progress.current < 0) {
                throw new Error("'notification.android.progress.current' expected a positive number value.");
            }
            if (utils_1.isUndefined(android.progress.max)) {
                throw new Error("'notification.android.progress.current' when providing a current value, you must also specify a `max` value.");
            }
            progress.current = android.progress.current;
        }
        // We have a max/current value
        if (!utils_1.isUndefined(progress.max) && !utils_1.isUndefined(progress.current)) {
            if (progress.current > progress.max) {
                throw new Error("'notification.android.progress' the current value cannot be greater than the max value.");
            }
        }
        out.progress = progress;
    }
    /**
     * showTimestamp
     */
    if (utils_1.objectHasProperty(android, 'showTimestamp')) {
        if (!utils_1.isBoolean(android.showTimestamp)) {
            throw new Error("'notification.android.showTimestamp' expected a boolean value.");
        }
        out.showTimestamp = android.showTimestamp;
    }
    /**
     * smallIcon
     */
    if (utils_1.objectHasProperty(android, 'smallIcon') && !utils_1.isUndefined(android.smallIcon)) {
        if (!utils_1.isString(android.smallIcon)) {
            throw new Error("'notification.android.smallIcon' expected value to be a string.");
        }
        out.smallIcon = android.smallIcon;
    }
    /**
     * smallIconLevel
     */
    if (utils_1.objectHasProperty(android, 'smallIconLevel') && !utils_1.isUndefined(android.smallIcon)) {
        if (!utils_1.isNumber(android.smallIconLevel)) {
            throw new Error("'notification.android.smallIconLevel' expected value to be a number.");
        }
        out.smallIconLevel = android.smallIconLevel;
    }
    /**
     * sortKey
     */
    if (utils_1.objectHasProperty(android, 'sortKey')) {
        if (!utils_1.isString(android.sortKey)) {
            throw new Error("'notification.android.sortKey' expected a string value.");
        }
        out.sortKey = android.sortKey;
    }
    /**
     * style
     */
    if (utils_1.objectHasProperty(android, 'style') && !utils_1.isUndefined(android.style)) {
        if (!utils_1.isObject(android.style)) {
            throw new Error("'notification.android.style' expected an object value.");
        }
        switch (android.style.type) {
            case NotificationAndroid_2.AndroidStyle.BIGPICTURE:
                out.style = validateAndroidStyle_1.validateAndroidBigPictureStyle(android.style);
                break;
            case NotificationAndroid_2.AndroidStyle.BIGTEXT:
                out.style = validateAndroidStyle_1.validateAndroidBigTextStyle(android.style);
                break;
            case NotificationAndroid_2.AndroidStyle.INBOX:
                out.style = validateAndroidStyle_1.validateAndroidInboxStyle(android.style);
                break;
            case NotificationAndroid_2.AndroidStyle.MESSAGING:
                out.style = validateAndroidStyle_1.validateAndroidMessagingStyle(android.style);
                break;
            default:
                throw new Error("'notification.android.style' style type must be one of AndroidStyle.BIGPICTURE, AndroidStyle.BIGTEXT, AndroidStyle.INBOX or AndroidStyle.MESSAGING.");
        }
    }
    /**
     * tag
     */
    if (utils_1.objectHasProperty(android, 'tag') && android.tag != undefined) {
        if (!utils_1.isString(android.tag)) {
            throw new Error("'notification.android.tag' expected a string value.");
        }
        if (android.tag.includes('|')) {
            throw new Error(`'notification.android.tag' tag cannot contain the "|" (pipe) character.`);
        }
        out.tag = android.tag;
    }
    /**
     * ticker
     */
    if (utils_1.objectHasProperty(android, 'ticker')) {
        if (!utils_1.isString(android.ticker)) {
            throw new Error("'notification.android.ticker' expected a string value.");
        }
        out.ticker = android.ticker;
    }
    /**
     * timeoutAfter
     */
    if (utils_1.objectHasProperty(android, 'timeoutAfter') && android.timeoutAfter != undefined) {
        if (!utils_1.isNumber(android.timeoutAfter)) {
            throw new Error("'notification.android.timeoutAfter' expected a number value.");
        }
        if (!validate_1.isValidTimestamp(android.timeoutAfter)) {
            throw new Error("'notification.android.timeoutAfter' invalid millisecond timestamp.");
        }
        out.timeoutAfter = android.timeoutAfter;
    }
    /**
     * showChronometer
     */
    if (utils_1.objectHasProperty(android, 'showChronometer')) {
        if (!utils_1.isBoolean(android.showChronometer)) {
            throw new Error("'notification.android.showChronometer' expected a boolean value.");
        }
        out.showChronometer = android.showChronometer;
    }
    /**
     * vibrationPattern
     */
    if (utils_1.objectHasProperty(android, 'vibrationPattern') && android.vibrationPattern != undefined) {
        if (!utils_1.isArray(android.vibrationPattern) || !validate_1.isValidVibratePattern(android.vibrationPattern)) {
            throw new Error("'notification.android.vibrationPattern' expected an array containing an even number of positive values.");
        }
        out.vibrationPattern = android.vibrationPattern;
    }
    /**
     * visibility
     */
    if (utils_1.objectHasProperty(android, 'visibility') && android.visibility != undefined) {
        if (!Object.values(NotificationAndroid_2.AndroidVisibility).includes(android.visibility)) {
            throw new Error("'notification.android.visibility' expected a valid AndroidVisibility value.");
        }
        out.visibility = android.visibility;
    }
    /**
     * timestamp
     */
    if (utils_1.objectHasProperty(android, 'timestamp') && android.timestamp != undefined) {
        if (!utils_1.isNumber(android.timestamp)) {
            throw new Error("'notification.android.timestamp' expected a number value.");
        }
        if (!validate_1.isValidTimestamp(android.timestamp)) {
            throw new Error("'notification.android.timestamp' invalid millisecond timestamp, date must be a positive number");
        }
        out.timestamp = android.timestamp;
    }
    /**
     * sound
     */
    if (utils_1.objectHasProperty(android, 'sound') && android.sound != undefined) {
        if (!utils_1.isString(android.sound)) {
            throw new Error("'notification.sound' expected a valid sound string.");
        }
        out.sound = android.sound;
    }
    return out;
}
exports.default = validateAndroidNotification;
//# sourceMappingURL=validateAndroidNotification.js.map