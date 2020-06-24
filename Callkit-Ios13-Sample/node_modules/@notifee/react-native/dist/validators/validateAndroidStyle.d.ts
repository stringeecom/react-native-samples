import { AndroidBigPictureStyle, AndroidBigTextStyle, AndroidInboxStyle, AndroidMessagingStyle, AndroidMessagingStyleMessage, AndroidPerson } from '../types/NotificationAndroid';
/**
 * Validates a BigPictureStyle
 */
export declare function validateAndroidBigPictureStyle(style: AndroidBigPictureStyle): AndroidBigPictureStyle;
/**
 * Validates a BigTextStyle
 */
export declare function validateAndroidBigTextStyle(style: AndroidBigTextStyle): AndroidBigTextStyle;
/**
 * Validates a InboxStyle
 */
export declare function validateAndroidInboxStyle(style: AndroidInboxStyle): AndroidInboxStyle;
/**
 * Validates an AndroidPerson
 */
export declare function validateAndroidPerson(person: AndroidPerson): AndroidPerson;
export declare function validateAndroidMessagingStyleMessage(message: AndroidMessagingStyleMessage): AndroidMessagingStyleMessage;
/**
 * Validates a MessagingStyle
 */
export declare function validateAndroidMessagingStyle(style: AndroidMessagingStyle): AndroidMessagingStyle;
