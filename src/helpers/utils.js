"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sortCommentTree = exports.traverseCommentTree = exports.checkAssociation = exports.checkMedia = exports.getUsername = exports.removeUrls = exports.addUrls = exports.formatNostrData = exports.formatNostrText = exports.formatMessagingData = exports.formatMessagingText = exports.checkGqlCursor = exports.splitArray = exports.stripSearch = exports.unquoteJsonKeys = exports.checkNullValues = exports.getJSONStorage = exports.getTagValue = exports.formatTitle = exports.formatDate = exports.formatMetric = exports.formatFloat = exports.formatCount = exports.formatDataSize = exports.formatAddress = exports.formatArtifactType = exports.getHashUrl = void 0;
const config_1 = require("./config");
function getHashUrl(url) {
    return `${url}/#`;
}
exports.getHashUrl = getHashUrl;
function formatArtifactType(artifactType) {
    return artifactType.includes('Alex') ? artifactType.substring(5) : artifactType;
}
exports.formatArtifactType = formatArtifactType;
function formatAddress(address, wrap) {
    if (!address) {
        return '';
    }
    const formattedAddress = address.substring(0, 5) + '...' + address.substring(36, address.length - 1);
    return wrap ? `(${formattedAddress})` : formattedAddress;
}
exports.formatAddress = formatAddress;
function formatDataSize(size) {
    return `${size} KB`;
}
exports.formatDataSize = formatDataSize;
function formatCount(count) {
    return count.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}
exports.formatCount = formatCount;
function formatFloat(number, value) {
    let string = number.toString();
    string = string.slice(0, string.indexOf('.') + value + 1);
    return Number(string);
}
exports.formatFloat = formatFloat;
function formatMetric(count) {
    if (Number(count) > 1000) {
        const localeString = Number(count).toLocaleString();
        const parsedString = localeString.substring(0, localeString.indexOf(','));
        const unit = count.toString().length >= 7 ? 'm' : 'k';
        return `${parsedString}${unit}`;
    }
    else {
        return count;
    }
}
exports.formatMetric = formatMetric;
function formatTime(time) {
    return time < 10 ? `0${time.toString()}` : time.toString();
}
function getHours(hours) {
    if (hours > 12)
        return hours - 12;
    else
        return hours;
}
function getHourFormat(hours) {
    if (hours >= 12 && hours <= 23) {
        return `PM`;
    }
    else {
        return `AM`;
    }
}
function formatDate(dateArg, dateType) {
    if (!dateArg) {
        return config_1.STORAGE.none;
    }
    let date = null;
    switch (dateType) {
        case 'iso':
            date = new Date(dateArg);
            break;
        case 'epoch':
            date = new Date(Number(dateArg));
            break;
        default:
            date = new Date(dateArg);
            break;
    }
    return `${date.toLocaleString('default', {
        month: 'long',
    })} ${date.getDate()}, ${date.getUTCFullYear()} @ ${getHours(date.getHours())}:${formatTime(date.getMinutes())}:${formatTime(date.getSeconds())} ${getHourFormat(date.getHours())}`;
}
exports.formatDate = formatDate;
function formatTitle(string) {
    const result = string.replace(/([A-Z])/g, ' $1');
    const finalResult = result.charAt(0).toUpperCase() + result.slice(1);
    return finalResult;
}
exports.formatTitle = formatTitle;
function getTagValue(list, name) {
    for (let i = 0; i < list.length; i++) {
        if (list[i]) {
            if (list[i].name === name) {
                return list[i].value;
            }
        }
    }
    return config_1.STORAGE.none;
}
exports.getTagValue = getTagValue;
function getJSONStorage(key) {
    return JSON.parse(JSON.parse(JSON.stringify(localStorage.getItem(key))));
}
exports.getJSONStorage = getJSONStorage;
function checkNullValues(obj) {
    for (const key in obj) {
        if (obj[key] === null) {
            return true;
        }
    }
    return false;
}
exports.checkNullValues = checkNullValues;
function unquoteJsonKeys(json) {
    return JSON.stringify(json).replace(/"([^"]+)":/g, '$1:');
}
exports.unquoteJsonKeys = unquoteJsonKeys;
function stripSearch(s) {
    return s
        .replaceAll(' ', '')
        .replaceAll('\t', '')
        .replaceAll('\r', '')
        .replaceAll('\n', '')
        .replaceAll(config_1.SEARCH.idTerm, '')
        .replaceAll(config_1.SEARCH.ownerTerm, '')
        .toLowerCase();
}
exports.stripSearch = stripSearch;
function splitArray(array, size) {
    const splitResult = [];
    const arrayCopy = [...array];
    for (let i = 0; i < arrayCopy.length; i += size) {
        const chunk = arrayCopy.slice(i, i + size);
        splitResult.push(chunk);
    }
    return splitResult;
}
exports.splitArray = splitArray;
function checkGqlCursor(string) {
    /* All Search Cursors contain '-'
        GQL Cursors contain letters, numbers or '=' */
    if (/[-]/.test(string)) {
        return false;
    }
    else if (/[A-Za-z0-9]/.test(string) || /[=]/.test(string)) {
        return true;
    }
    else {
        return true;
    }
}
exports.checkGqlCursor = checkGqlCursor;
function formatMessagingText(text) {
    let finalStr = '';
    let count = 0;
    for (let i = 0; i < text.length; i++) {
        if (text[i] === ' ') {
            if (text.substring(count, i).includes('@')) {
                finalStr += `<span>${text.substring(count, i)}</span>`;
            }
            else {
                finalStr += text.substring(count, i);
            }
            count = i;
        }
    }
    if (count < text.length) {
        finalStr += text.substring(count, text.length);
    }
    return removeUrls(finalStr);
}
exports.formatMessagingText = formatMessagingText;
function formatMessagingData(data) {
    if (data && (data.text || data.full_text)) {
        const tweetText = data.text ? data.text : data.full_text;
        return formatMessagingText(tweetText);
    }
    else {
        return config_1.STORAGE.none;
    }
}
exports.formatMessagingData = formatMessagingData;
function formatNostrText(text) {
    return text;
}
exports.formatNostrText = formatNostrText;
function formatNostrData(data) {
    if (data && (data.post || data.post.content)) {
        return formatNostrText(data.post.content);
    }
    else {
        return config_1.STORAGE.none;
    }
}
exports.formatNostrData = formatNostrData;
function addUrls(text) {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.replace(urlRegex, function (url) {
        return `<a href=${url} target={"_blank"}>${url}</a>`;
    });
}
exports.addUrls = addUrls;
function removeUrls(text) {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.replace(urlRegex, '');
}
exports.removeUrls = removeUrls;
function getUsername(data) {
    if (data && data.user) {
        if (data.user.username)
            return `@${data.user.username}`;
        else if (data.user.screen_name)
            return `@${data.user.screen_name}`;
        else
            return config_1.STORAGE.none;
    }
    else {
        return config_1.STORAGE.none;
    }
}
exports.getUsername = getUsername;
function checkMedia(tags) {
    return (getTagValue(tags, config_1.TAGS.keys.mediaIds) !== '{}' &&
        getTagValue(tags, config_1.TAGS.keys.mediaIds) !== '[]' &&
        getTagValue(tags, config_1.TAGS.keys.mediaIds) !== config_1.STORAGE.none &&
        getTagValue(tags, config_1.TAGS.keys.mediaIds) !== '' &&
        getTagValue(tags, config_1.TAGS.keys.mediaIds) !== `{"":""}`);
}
exports.checkMedia = checkMedia;
function checkAssociation(tags) {
    return (getTagValue(tags, config_1.TAGS.keys.associationId) !== '' && getTagValue(tags, config_1.TAGS.keys.associationId) !== config_1.STORAGE.none);
}
exports.checkAssociation = checkAssociation;
async function traverseCommentTree(callBackFields, obj, callBack) {
    for (let key in obj) {
        if (obj.hasOwnProperty(key)) {
            if (callBackFields.includes(key)) {
                await callBack(obj);
            }
            else if (typeof obj[key] === 'object' && obj[key] !== null) {
                await traverseCommentTree(callBackFields, obj[key], callBack);
            }
        }
    }
}
exports.traverseCommentTree = traverseCommentTree;
function sortCommentTree(data) {
    const reversedData = [...data].reverse();
    const bodyListData = reversedData.map((element) => element.body);
    let groupedData = [];
    const finalData = [];
    for (let i = 0; i < reversedData.length; i++) {
        if (reversedData[i].depth === 0) {
            let j = bodyListData.indexOf(reversedData[i].body);
            let commentTraversed = false;
            const subList = [];
            subList.push(reversedData[j]);
            j++;
            while (!commentTraversed) {
                if (reversedData[j]) {
                    if (reversedData[j].depth === 0) {
                        commentTraversed = true;
                    }
                    else {
                        subList.push(reversedData[j]);
                    }
                    j++;
                }
                else {
                    commentTraversed = true;
                }
            }
            groupedData.push(subList);
        }
    }
    groupedData = groupedData.reverse();
    for (let i = 0; i < groupedData.length; i++) {
        finalData.push(groupedData[i]);
    }
    return finalData;
}
exports.sortCommentTree = sortCommentTree;
