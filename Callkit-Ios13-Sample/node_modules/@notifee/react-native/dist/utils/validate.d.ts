export declare function isNull(value: any): value is null;
export declare function isObject(value: any): value is object;
export declare function isFunction(value: any): value is Function;
export declare function isString(value: any): value is string;
export declare function isNumber(value: any): value is number;
export declare function isBoolean(value: any): value is boolean;
export declare function isArray(value: any): value is Array<any>;
export declare function isArrayOfStrings(value: any): value is Array<string>;
export declare function isUndefined(value: any): value is undefined;
export declare function objectKeyValuesAreStrings(value: object): value is {
    [key: string]: string;
};
export declare function isAlphaNumericUnderscore(value: string): boolean;
export declare function isValidUrl(url: string): boolean;
