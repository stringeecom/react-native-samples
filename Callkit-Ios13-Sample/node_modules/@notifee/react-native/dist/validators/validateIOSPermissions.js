"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../utils");
function validateIOSPermissions(permissions) {
    const out = {
        alert: true,
        badge: true,
        sound: true,
        carPlay: true,
        provisional: false,
        announcement: false,
        criticalAlert: false,
    };
    if (!permissions) {
        return out;
    }
    if (utils_1.objectHasProperty(permissions, 'alert')) {
        if (!utils_1.isBoolean(permissions.alert)) {
            throw new Error("'alert' expected a boolean value.");
        }
        out.alert = permissions.alert;
    }
    if (utils_1.objectHasProperty(permissions, 'badge')) {
        if (!utils_1.isBoolean(permissions.badge)) {
            throw new Error("'alert' badge a boolean value.");
        }
        out.badge = permissions.badge;
    }
    if (utils_1.objectHasProperty(permissions, 'sound')) {
        if (!utils_1.isBoolean(permissions.sound)) {
            throw new Error("'sound' expected a boolean value.");
        }
        out.sound = permissions.sound;
    }
    if (utils_1.objectHasProperty(permissions, 'carPlay')) {
        if (!utils_1.isBoolean(permissions.carPlay)) {
            throw new Error("'carPlay' expected a boolean value.");
        }
        out.carPlay = permissions.carPlay;
    }
    if (utils_1.objectHasProperty(permissions, 'provisional')) {
        if (!utils_1.isBoolean(permissions.provisional)) {
            throw new Error("'provisional' expected a boolean value.");
        }
        out.provisional = permissions.provisional;
    }
    if (utils_1.objectHasProperty(permissions, 'announcement')) {
        if (!utils_1.isBoolean(permissions.announcement)) {
            throw new Error("'announcement' expected a boolean value.");
        }
        out.announcement = permissions.announcement;
    }
    if (utils_1.objectHasProperty(permissions, 'criticalAlert')) {
        if (!utils_1.isBoolean(permissions.criticalAlert)) {
            throw new Error("'criticalAlert' expected a boolean value.");
        }
        out.criticalAlert = permissions.criticalAlert;
    }
    return out;
}
exports.default = validateIOSPermissions;
//# sourceMappingURL=validateIOSPermissions.js.map