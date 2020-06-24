"use strict";
/*
 * Copyright (c) 2016-present Invertase Limited
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidUrl = exports.isAlphaNumericUnderscore = exports.objectKeyValuesAreStrings = exports.isUndefined = exports.isArrayOfStrings = exports.isArray = exports.isBoolean = exports.isNumber = exports.isString = exports.isFunction = exports.isObject = exports.isNull = void 0;
function isNull(value) {
    return value === null;
}
exports.isNull = isNull;
function isObject(value) {
    return value ? typeof value === 'object' && !Array.isArray(value) && !isNull(value) : false;
}
exports.isObject = isObject;
function isFunction(value) {
    return value ? typeof value === 'function' : false;
}
exports.isFunction = isFunction;
function isString(value) {
    return typeof value === 'string';
}
exports.isString = isString;
function isNumber(value) {
    return typeof value === 'number';
}
exports.isNumber = isNumber;
function isBoolean(value) {
    return typeof value === 'boolean';
}
exports.isBoolean = isBoolean;
function isArray(value) {
    return Array.isArray(value);
}
exports.isArray = isArray;
function isArrayOfStrings(value) {
    if (!isArray(value))
        return false;
    for (let i = 0; i < value.length; i++) {
        if (!isString(value[i]))
            return false;
    }
    return true;
}
exports.isArrayOfStrings = isArrayOfStrings;
function isUndefined(value) {
    return value == undefined;
}
exports.isUndefined = isUndefined;
function objectKeyValuesAreStrings(value) {
    if (!isObject(value)) {
        return false;
    }
    const entries = Object.entries(value);
    for (let i = 0; i < entries.length; i++) {
        const [key, value] = entries[i];
        if (!isString(key) || !isString(value)) {
            return false;
        }
    }
    return true;
}
exports.objectKeyValuesAreStrings = objectKeyValuesAreStrings;
/**
 * /^[a-zA-Z0-9_]+$/
 *
 * @param value
 * @returns {boolean}
 */
const AlphaNumericUnderscore = /^[a-zA-Z0-9_]+$/;
function isAlphaNumericUnderscore(value) {
    return AlphaNumericUnderscore.test(value);
}
exports.isAlphaNumericUnderscore = isAlphaNumericUnderscore;
/**
 * URL test
 * @param url
 * @returns {boolean}
 */
const IS_VALID_URL_REGEX = /^(http|https):\/\/[^ "]+$/;
function isValidUrl(url) {
    return IS_VALID_URL_REGEX.test(url);
}
exports.isValidUrl = isValidUrl;
//# sourceMappingURL=validate.js.map