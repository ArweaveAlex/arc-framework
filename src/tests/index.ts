import { getArtifactsByPool } from '../gql';
import { ArtifactResponseType, CursorEnum } from '../helpers';

const POOL_ID = 'zoljIRyzG5hp-R4EZV2q8kFI49OAoy23_B9YJ_yEEws';
const OWNER = null;
const UPLOADER = null;
const CURSOR = null;
const REDUX_CURSOR = 'poolAll';

// const cursorObject = { key: CursorEnum.Search, value: 'poolAll' };

async function testGQL() {
	console.log(`Testing GQL ...`);
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

(async function () {
	await testGQL();
})();
