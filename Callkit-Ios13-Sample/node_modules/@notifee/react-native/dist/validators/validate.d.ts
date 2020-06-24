/**
 * Validates any hexadecimal (optional transparency)
 * @param color
 * @returns {boolean}
 */
export declare function isValidColor(color: string): boolean;
/**
 * Checks the timestamp is at some point in the future.
 * @param timestamp
 * @returns {boolean}
 */
export declare function isValidTimestamp(timestamp: number): boolean;
/**
 * Ensures all values in the pattern are valid
 * @param pattern {array}
 */
export declare function isValidVibratePattern(pattern: number[]): boolean;
/**
 * Ensures a given light pattern is valid
 * @param pattern {array}
 */
declare type LightPattern = [string, number, number];
declare type ValidLightPattern = [boolean] | [boolean, 'color' | 'onMs' | 'offMs'];
export declare function isValidLightPattern(pattern: LightPattern): ValidLightPattern;
export {};
