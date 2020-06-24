"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/*
 * Copyright (c) 2016-present Invertase Limited
 */
const NotificationIOS_1 = require("../types/NotificationIOS");
const utils_1 = require("../utils");
const validateIOSCategoryAction_1 = __importDefault(require("./validateIOSCategoryAction"));
function validateIOSCategory(category) {
    if (!utils_1.isObject(category)) {
        throw new Error("'category' expected an object value.");
    }
    /**
     * id
     */
    if (!utils_1.isString(category.id)) {
        throw new Error("'category.id' expected a string value.");
    }
    // empty check
    if (!category.id) {
        throw new Error("'category.id' expected a valid string id.");
    }
    const out = {
        id: category.id,
        allowInCarPlay: false,
        allowAnnouncement: false,
        hiddenPreviewsShowTitle: false,
        hiddenPreviewsShowSubtitle: false,
    };
    /**
     * summaryFormat
     */
    if (utils_1.objectHasProperty(category, 'summaryFormat')) {
        if (!utils_1.isString(category.summaryFormat)) {
            throw new Error("'category.summaryFormat' expected a string value.");
        }
        out.summaryFormat = category.summaryFormat;
    }
    /**
     * allowInCarPlay
     */
    if (utils_1.objectHasProperty(category, 'allowInCarPlay')) {
        if (!utils_1.isBoolean(category.allowInCarPlay)) {
            throw new Error("'category.allowInCarPlay' expected a boolean value.");
        }
        out.allowInCarPlay = category.allowInCarPlay;
    }
    /**
     * allowAnnouncement
     */
    if (utils_1.objectHasProperty(category, 'allowAnnouncement')) {
        if (!utils_1.isBoolean(category.allowAnnouncement)) {
            throw new Error("'category.allowAnnouncement' expected a boolean value.");
        }
        out.allowAnnouncement = category.allowAnnouncement;
    }
    /**
     * hiddenPreviewsShowTitle
     */
    if (utils_1.objectHasProperty(category, 'hiddenPreviewsShowTitle')) {
        if (!utils_1.isBoolean(category.hiddenPreviewsShowTitle)) {
            throw new Error("'category.hiddenPreviewsShowTitle' expected a boolean value.");
        }
        out.hiddenPreviewsShowTitle = category.hiddenPreviewsShowTitle;
    }
    /**
     * hiddenPreviewsShowSubtitle
     */
    if (utils_1.objectHasProperty(category, 'hiddenPreviewsShowSubtitle')) {
        if (!utils_1.isBoolean(category.hiddenPreviewsShowSubtitle)) {
            throw new Error("'category.hiddenPreviewsShowSubtitle' expected a boolean value.");
        }
        out.hiddenPreviewsShowSubtitle = category.hiddenPreviewsShowSubtitle;
    }
    /**
     * summaryFormat
     */
    if (utils_1.objectHasProperty(category, 'hiddenPreviewsBodyPlaceholder')) {
        if (!utils_1.isString(category.hiddenPreviewsBodyPlaceholder)) {
            throw new Error("'category.hiddenPreviewsBodyPlaceholder' expected a string value.");
        }
        out.hiddenPreviewsBodyPlaceholder = category.hiddenPreviewsBodyPlaceholder;
    }
    /**
     * intentIdentifiers
     */
    if (utils_1.objectHasProperty(category, 'intentIdentifiers')) {
        if (!utils_1.isArray(category.intentIdentifiers)) {
            throw new Error("'category.intentIdentifiers' expected an array value.");
        }
        const identifiers = Object.values(NotificationIOS_1.IOSIntentIdentifier);
        for (let i = 0; i < category.intentIdentifiers.length; i++) {
            const intentIdentifier = category.intentIdentifiers[i];
            if (!identifiers.includes(intentIdentifier)) {
                throw new Error(`'category.intentIdentifiers' unexpected intentIdentifier "${intentIdentifier}" at array index "${i}".`);
            }
        }
        out.intentIdentifiers = category.intentIdentifiers;
    }
    /**
     * actions
     */
    if (utils_1.objectHasProperty(category, 'actions')) {
        if (!utils_1.isArray(category.actions)) {
            throw new Error("'category.actions' expected an array value.");
        }
        const actions = [];
        for (let i = 0; i < category.actions.length; i++) {
            try {
                actions[i] = validateIOSCategoryAction_1.default(category.actions[i]);
            }
            catch (e) {
                throw new Error(`'category.actions' invalid action at index "${i}". ${e}`);
            }
        }
        out.actions = actions;
    }
    return out;
}
exports.default = validateIOSCategory;
//# sourceMappingURL=validateIOSCategory.js.map