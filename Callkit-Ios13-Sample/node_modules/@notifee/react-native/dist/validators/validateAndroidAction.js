"use strict";
/*
 * Copyright (c) 2016-present Invertase Limited
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../utils");
const validateAndroidPressAction_1 = __importDefault(require("./validateAndroidPressAction"));
const validateAndroidInput_1 = __importDefault(require("./validateAndroidInput"));
function validateAndroidAction(action) {
    if (!utils_1.isObject(action)) {
        throw new Error("'action' expected an object value.");
    }
    try {
        validateAndroidPressAction_1.default(action.pressAction);
    }
    catch (e) {
        throw new Error(`'action' ${e.message}.`);
    }
    if (!utils_1.isString(action.title) || !action.title) {
        throw new Error("'action.title' expected a string value.");
    }
    const out = {
        pressAction: action.pressAction,
        title: action.title,
    };
    if (utils_1.objectHasProperty(action, 'icon') && !utils_1.isUndefined(action.icon)) {
        if (!utils_1.isString(action.icon) || !action.icon) {
            throw new Error("'action.icon' expected a string value.");
        }
        out.icon = action.icon;
    }
    if (utils_1.objectHasProperty(action, 'input') && !utils_1.isUndefined(action.input)) {
        if (utils_1.isBoolean(action.input) && action.input) {
            out.input = validateAndroidInput_1.default();
        }
        else {
            try {
                out.input = validateAndroidInput_1.default(action.input);
            }
            catch (e) {
                throw new Error(`'action.input' ${e.message}.`);
            }
        }
    }
    return out;
}
exports.default = validateAndroidAction;
//# sourceMappingURL=validateAndroidAction.js.map