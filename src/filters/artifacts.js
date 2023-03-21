"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sortByAssociationSequence = void 0;
function sortByAssociationSequence(data) {
    const sortedData = data.sort(function (a, b) {
        return a && b ? Number(a.associationSequence) - Number(b.associationSequence) : 1;
    });
    return sortedData;
}
exports.sortByAssociationSequence = sortByAssociationSequence;
