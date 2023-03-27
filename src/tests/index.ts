import { getArtifactsByPool, getPools, getProfile } from '../gql';
import { ArtifactResponseType } from '../helpers';

const POOL_ID = 'zoljIRyzG5hp-R4EZV2q8kFI49OAoy23_B9YJ_yEEws';
const OWNER = null;
const UPLOADER = null;
const CURSOR = null;
const REDUX_CURSOR = 'poolAll';

// const cursorObject = { key: CursorEnum.Search, value: 'poolAll' };

async function testArtifactsByPoolGQL() {
	console.log(`Testing Artifacts By Pool GQL Request ...`);
	const gqlData: ArtifactResponseType = await getArtifactsByPool({
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
	const pools = await getPools();

	console.log(`Pool Count: ${pools.length}`);
}

async function testProfileGQL() {
	console.log(`Testing Profile GQL Request ...`);
	const profile = await getProfile('uf_FqRvLqjnFMc8ZzGkF4qWKuNmUIQcYP0tPlCGORQk');

	console.log(profile);
}

(async function () {
	await testArtifactsByPoolGQL();
	await testPoolsGQL();
	await testProfileGQL();
})();
