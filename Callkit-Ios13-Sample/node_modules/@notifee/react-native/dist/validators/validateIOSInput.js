"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../utils");
function validateIOSInput(input) {
    const out = {};
    // default value
    if (!input) {
        return out;
    }
    // if true, empty object
    if (utils_1.isBoolean(input)) {
        return out;
    }
    if (!utils_1.isObject(input)) {
        throw new Error('expected an object value.');
    }
    if (utils_1.objectHasProperty(input, 'buttonText') && !utils_1.isUndefined(input.buttonText)) {
        if (!utils_1.isString(input.buttonText)) {
            throw new Error("'buttonText' expected a string value.");
        }
        out.buttonText = input.buttonText;
    }
    if (utils_1.objectHasProperty(input, 'placeholderText') && !utils_1.isUndefined(input.placeholderText)) {
        if (!utils_1.isString(input.placeholderText)) {
            throw new Error("'placeholderText' expected a string value.");
        }
        out.placeholderText = input.placeholderText;
    }
    return out;
}
exports.default = validateIOSInput;
//# sourceMappingURL=validateIOSInput.js.map