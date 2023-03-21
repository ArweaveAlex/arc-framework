"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sortByMostContributed = exports.sortByNewest = exports.sortByAll = void 0;
function sortByAll(pools, amount) {
    if (amount) {
        return pools.length <= amount ? pools : pools.slice(0, amount);
    }
    else {
        return pools;
    }
}
exports.sortByAll = sortByAll;
function sortByNewest(pools, amount) {
    const sortedPools = pools
        .sort(function (a, b) {
        return parseFloat(a.state.timestamp) - parseFloat(b.state.timestamp);
    })
        .reverse();
    if (amount) {
        return sortedPools.length <= amount ? sortedPools : sortedPools.slice(0, amount);
    }
    else {
        return sortedPools;
    }
}
exports.sortByNewest = sortByNewest;
function sortByMostContributed(pools, amount) {
    const sortedPools = pools
        .sort(function (a, b) {
        return parseFloat(a.state.totalContributions) - parseFloat(b.state.totalContributions);
    })
        .reverse();
    if (amount) {
        return sortedPools.length <= amount ? sortedPools : sortedPools.slice(0, amount);
    }
    else {
        return sortedPools;
    }
}
exports.sortByMostContributed = sortByMostContributed;
