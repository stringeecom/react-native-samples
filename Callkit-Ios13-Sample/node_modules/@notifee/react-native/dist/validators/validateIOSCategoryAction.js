"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../utils");
const validateIOSInput_1 = __importDefault(require("./validateIOSInput"));
function validateIOSCategoryAction(action) {
    if (!utils_1.isObject(action)) {
        throw new Error('"action" expected an object value');
    }
    if (!utils_1.isString(action.id) || action.id.length === 0) {
        throw new Error('"action.id" expected a valid string value.');
    }
    if (!utils_1.isString(action.title) || action.title.length === 0) {
        throw new Error('"action.title" expected a valid string value.');
    }
    const out = {
        id: action.id,
        title: action.title,
        destructive: false,
        foreground: false,
        authenticationRequired: false,
    };
    if (utils_1.objectHasProperty(action, 'input') && !utils_1.isUndefined(action.input)) {
        if (utils_1.isBoolean(action.input) && action.input) {
            out.input = true;
        }
        else {
            try {
                out.input = validateIOSInput_1.default(action.input);
            }
            catch (e) {
                throw new Error(`'action' ${e.message}.`);
            }
        }
    }
    if (utils_1.objectHasProperty(action, 'destructive')) {
        if (!utils_1.isBoolean(action.destructive)) {
            throw new Error("'destructive' expected a boolean value.");
        }
        out.destructive = action.destructive;
    }
    if (utils_1.objectHasProperty(action, 'foreground')) {
        if (!utils_1.isBoolean(action.foreground)) {
            throw new Error("'foreground' expected a boolean value.");
        }
        out.foreground = action.foreground;
    }
    if (utils_1.objectHasProperty(action, 'authenticationRequired')) {
        if (!utils_1.isBoolean(action.authenticationRequired)) {
            throw new Error("'authenticationRequired' expected a boolean value.");
        }
        out.authenticationRequired = action.authenticationRequired;
    }
    return out;
}
exports.default = validateIOSCategoryAction;
//# sourceMappingURL=validateIOSCategoryAction.js.map