"use strict";
/*
 * Copyright (c) 2016-present Invertase Limited
 */
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../utils");
const validate_1 = require("./validate");
const NotificationAndroid_1 = require("../types/NotificationAndroid");
const NotificationAndroid_2 = require("../types/NotificationAndroid");
function validateAndroidChannel(channel) {
    if (!utils_1.isObject(channel)) {
        throw new Error("'channel' expected an object value.");
    }
    /**
     * id
     */
    if (!utils_1.isString(channel.id)) {
        throw new Error("'channel.id' expected a string value.");
    }
    // empty check
    if (!channel.id) {
        throw new Error("'channel.id' expected a valid string id.");
    }
    /**
     * name
     */
    if (!utils_1.isString(channel.name)) {
        throw new Error("'channel.name' expected a string value.");
    }
    // empty check
    if (!channel.name) {
        throw new Error("'channel.name' expected a valid channel name.");
    }
    /**
     * Defaults
     */
    const out = {
        id: channel.id,
        name: channel.name,
        bypassDnd: false,
        lights: true,
        vibration: true,
        badge: true,
        importance: NotificationAndroid_1.AndroidImportance.DEFAULT,
        visibility: NotificationAndroid_2.AndroidVisibility.PRIVATE,
    };
    /**
     * badge
     */
    if (utils_1.objectHasProperty(channel, 'badge')) {
        if (!utils_1.isBoolean(channel.badge)) {
            throw new Error("'channel.badge' expected a boolean value.");
        }
        out.badge = channel.badge;
    }
    /**
     * bypassDnd
     */
    if (utils_1.objectHasProperty(channel, 'bypassDnd')) {
        if (!utils_1.isBoolean(channel.bypassDnd)) {
            throw new Error("'channel.bypassDnd' expected a boolean value.");
        }
        out.bypassDnd = channel.bypassDnd;
    }
    /**
     * description
     */
    if (utils_1.objectHasProperty(channel, 'description')) {
        if (!utils_1.isString(channel.description)) {
            throw new Error("'channel.description' expected a string value.");
        }
        out.description = channel.description;
    }
    /**
     * lights
     */
    if (utils_1.objectHasProperty(channel, 'lights')) {
        if (!utils_1.isBoolean(channel.lights)) {
            throw new Error("'channel.lights' expected a boolean value.");
        }
        out.lights = channel.lights;
    }
    /**
     * vibration
     */
    if (utils_1.objectHasProperty(channel, 'vibration')) {
        if (!utils_1.isBoolean(channel.vibration)) {
            throw new Error("'channel.vibration' expected a boolean value.");
        }
        out.vibration = channel.vibration;
    }
    /**
     * groupId
     */
    if (utils_1.objectHasProperty(channel, 'groupId')) {
        if (!utils_1.isString(channel.groupId)) {
            throw new Error("'channel.groupId' expected a string value.");
        }
        out.groupId = channel.groupId;
    }
    /**
     * importance
     */
    if (utils_1.objectHasProperty(channel, 'importance') && channel.importance != undefined) {
        if (!Object.values(NotificationAndroid_1.AndroidImportance).includes(channel.importance)) {
            throw new Error("'channel.importance' expected an Importance value.");
        }
        out.importance = channel.importance;
    }
    /**
     * lightColor
     */
    if (utils_1.objectHasProperty(channel, 'lightColor') && channel.lightColor != undefined) {
        if (!utils_1.isString(channel.lightColor)) {
            throw new Error("'channel.lightColor' expected a string value.");
        }
        if (!validate_1.isValidColor(channel.lightColor)) {
            throw new Error("'channel.lightColor' invalid color. Expected an AndroidColor or hexadecimal string value");
        }
        out.lightColor = channel.lightColor;
    }
    /**
     * visibility
     */
    if (utils_1.objectHasProperty(channel, 'visibility') && channel.visibility != undefined) {
        if (!Object.values(NotificationAndroid_2.AndroidVisibility).includes(channel.visibility)) {
            throw new Error("'channel.visibility' expected visibility to be an AndroidVisibility value.");
        }
        out.visibility = channel.visibility;
    }
    /**
     * sound
     */
    if (utils_1.objectHasProperty(channel, 'sound') && channel.sound != undefined) {
        if (!utils_1.isString(channel.sound)) {
            throw new Error("'channel.sound' expected a string value.");
        }
        out.sound = channel.sound;
    }
    /**
     * vibrationPattern
     */
    if (utils_1.objectHasProperty(channel, 'vibrationPattern') && channel.vibrationPattern != undefined) {
        if (!utils_1.isArray(channel.vibrationPattern)) {
            throw new Error("'channel.vibrationPattern' expected an array.");
        }
        if (!validate_1.isValidVibratePattern(channel.vibrationPattern)) {
            throw new Error("'channel.vibrationPattern' expected an array containing an even number of positive values.");
        }
        out.vibrationPattern = channel.vibrationPattern;
    }
    return out;
}
exports.default = validateAndroidChannel;
//# sourceMappingURL=validateAndroidChannel.js.map