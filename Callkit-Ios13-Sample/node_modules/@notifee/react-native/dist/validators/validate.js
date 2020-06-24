"use strict";
/*
 * Copyright (c) 2016-present Invertase Limited
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidLightPattern = exports.isValidVibratePattern = exports.isValidTimestamp = exports.isValidColor = void 0;
const NotificationAndroid_1 = require("../types/NotificationAndroid");
const utils_1 = require("../utils");
/**
 * Validates any hexadecimal (optional transparency)
 * @param color
 * @returns {boolean}
 */
function isValidColor(color) {
    if (Object.values(NotificationAndroid_1.AndroidColor).includes(color)) {
        return true;
    }
    if (!color.startsWith('#')) {
        return false;
    }
    // exclude #
    const length = color.length - 1;
    return length === 6 || length === 8;
}
exports.isValidColor = isValidColor;
/**
 * Checks the timestamp is at some point in the future.
 * @param timestamp
 * @returns {boolean}
 */
function isValidTimestamp(timestamp) {
    return timestamp > 0;
}
exports.isValidTimestamp = isValidTimestamp;
/**
 * Ensures all values in the pattern are valid
 * @param pattern {array}
 */
function isValidVibratePattern(pattern) {
    if (pattern.length % 2 !== 0) {
        return false;
    }
    for (let i = 0; i < pattern.length; i++) {
        const ms = pattern[i];
        if (!utils_1.isNumber(ms)) {
            return false;
        }
        if (ms <= 0) {
            return false;
        }
    }
    return true;
}
exports.isValidVibratePattern = isValidVibratePattern;
function isValidLightPattern(pattern) {
    const [color, onMs, offMs] = pattern;
    if (!isValidColor(color)) {
        return [false, 'color'];
    }
    if (!utils_1.isNumber(onMs)) {
        return [false, 'onMs'];
    }
    if (!utils_1.isNumber(offMs)) {
        return [false, 'offMs'];
    }
    if (onMs < 1) {
        return [false, 'onMs'];
    }
    if (offMs < 1) {
        return [false, 'offMs'];
    }
    return [true];
}
exports.isValidLightPattern = isValidLightPattern;
//# sourceMappingURL=validate.js.map