"use strict";
/*
 * Copyright (c) 2016-present Invertase Limited
 */
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../utils");
// TODO name wrong - this is no longer 'Android' specific - is used on android also
function validateAndroidPressAction(pressAction) {
    if (!utils_1.isObject(pressAction)) {
        throw new Error("'pressAction' expected an object value.");
    }
    if (!utils_1.isString(pressAction.id) || pressAction.id.length === 0) {
        throw new Error("'id' expected a non-empty string value.");
    }
    const out = {
        id: pressAction.id,
    };
    if (!utils_1.isUndefined(pressAction.launchActivity)) {
        if (!utils_1.isString(pressAction.launchActivity)) {
            throw new Error("'launchActivity' expected a string value.");
        }
        out.launchActivity = pressAction.launchActivity;
    }
    if (!utils_1.isUndefined(pressAction.launchActivityFlags)) {
        if (!utils_1.isArray(pressAction.launchActivityFlags)) {
            throw new Error("'launchActivityFlags' must be an array of `AndroidLaunchActivityFlag` values.");
        }
        // quick sanity check on first item only
        if (pressAction.launchActivityFlags.length) {
            if (!utils_1.isNumber(pressAction.launchActivityFlags[0])) {
                throw new Error("'launchActivityFlags' must be an array of `AndroidLaunchActivityFlag` values.");
            }
        }
        out.launchActivityFlags = pressAction.launchActivityFlags;
    }
    if (!utils_1.isUndefined(pressAction.mainComponent)) {
        if (!utils_1.isString(pressAction.mainComponent)) {
            throw new Error("'mainComponent' expected a string value.");
        }
        out.mainComponent = pressAction.mainComponent;
    }
    return out;
}
exports.default = validateAndroidPressAction;
//# sourceMappingURL=validateAndroidPressAction.js.map