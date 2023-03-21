import { DateType, KeyValueType } from './types';
export declare function getHashUrl(url: string): string;
export declare function formatArtifactType(artifactType: string): string;
export declare function formatAddress(address: string | null, wrap: boolean): string;
export declare function formatDataSize(size: string): string;
export declare function formatCount(count: string): string;
export declare function formatFloat(number: number, value: number): number;
export declare function formatMetric(count: string): string;
export declare function formatDate(dateArg: string | number | null, dateType: DateType): string;
export declare function formatTitle(string: string): string;
export declare function getTagValue(list: KeyValueType[], name: string): string;
export declare function getJSONStorage(key: string): any;
export declare function checkNullValues(obj: any): boolean;
export declare function unquoteJsonKeys(json: Object): string;
export declare function stripSearch(s: string): string;
export declare function splitArray(array: any[], size: number): any[];
export declare function checkGqlCursor(string: string): boolean;
export declare function formatMessagingText(text: string): string;
export declare function formatMessagingData(data: any): string;
export declare function formatNostrText(text: string): string;
export declare function formatNostrData(data: any): string;
export declare function addUrls(text: string): string;
export declare function removeUrls(text: string): string;
export declare function getUsername(data: any): string;
export declare function checkMedia(tags: KeyValueType[]): boolean;
export declare function checkAssociation(tags: KeyValueType[]): boolean;
export declare function traverseCommentTree(callBackFields: string[], obj: any, callBack: any): Promise<void>;
export declare function sortCommentTree(data: any[]): any[];
