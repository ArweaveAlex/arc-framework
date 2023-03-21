"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const gql_1 = require("../gql");
const POOL_ID = 'zoljIRyzG5hp-R4EZV2q8kFI49OAoy23_B9YJ_yEEws';
const OWNER = null;
const UPLOADER = null;
const CURSOR = null;
const REDUX_CURSOR = 'poolAll';
// const cursorObject = { key: CursorEnum.Search, value: 'poolAll' };
async function testArtifactsByPoolGQL() {
    console.log(`Testing Artifacts By Pool GQL Request ...`);
    const gqlData = await (0, gql_1.getArtifactsByPool)({
        ids: [POOL_ID],
        owner: OWNER,
        uploader: UPLOADER,
        cursor: CURSOR,
        reduxCursor: REDUX_CURSOR,
    });
    console.log({
        contracts: gqlData.contracts.length,
        nextCursor: gqlData.nextCursor,
        previousCursor: gqlData.previousCursor,
    });
}
async function testPoolsGQL() {
    console.log(`Testing Pools GQL Request ...`);
    const pools = await (0, gql_1.getPools)();
    console.log(`Pool Count: ${pools.length}`);
}
(async function () {
    await testArtifactsByPoolGQL();
    await testPoolsGQL();
})();
