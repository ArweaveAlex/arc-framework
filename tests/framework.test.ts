import {
	getArtifactsByBookmarks,
	getArtifactsByIds,
	getArtifactsByPool,
	getArtifactsByUser,
	getIndexPools,
	getPools,
	getProfile,
} from '../src/gql';
import { ArtifactResponseType } from '../src/helpers';

async function testGetArtifactsByPoolGQL() {
	console.log(`Testing Artifacts By Pool GQL Request ...`);
	const gqlData: ArtifactResponseType = await getArtifactsByPool({
		ids: ['zoljIRyzG5hp-R4EZV2q8kFI49OAoy23_B9YJ_yEEws'],
		owner: null,
		uploaders: null,
		cursor: null,
		reduxCursor: 'poolAll',
	});

	console.log({
		contracts: gqlData.contracts.length,
		nextCursor: gqlData.nextCursor,
		previousCursor: gqlData.previousCursor,
	});
}

async function testGetArtifactsByUserGQL() {
	console.log(`Testing Artifacts By User GQL Request ...`);
	const gqlData: ArtifactResponseType = await getArtifactsByUser({
		ids: null,
		owner: 'uf_FqRvLqjnFMc8ZzGkF4qWKuNmUIQcYP0tPlCGORQk',
		uploaders: null,
		cursor: null,
		reduxCursor: 'accountAll',
	});

	console.log({
		contracts: gqlData.contracts.length,
		nextCursor: gqlData.nextCursor,
		previousCursor: gqlData.previousCursor,
	});
}

async function testGetArtifactsByIdsGQL() {
	console.log(`Testing Artifacts By Ids GQL Request ...`);
	const gqlData: ArtifactResponseType = await getArtifactsByIds({
		ids: [
			'lFO2qdhjBpMG13-Zamz3vW7E7FFbJT9NgPhgdgDUVQc',
			'6R2dVcktecT0dbezgHq8eHrmzRpnl8JrtaDXT-ZZ69s',
			'9hUxb7MCMmMJ61oWJAKbGMczUDVYvPjmLs_xSLsppF4',
			'FRRpmc0_e4--5c_Lsg9yNpqsu9aIQLg920GUKo6JjPo',
			'PsNTVxx6LauegIamlK4ju92-noWpFxc8fTTmtiEHuAU',
			'qERJuxaUy2Vs9VwjCZSu5Lt0Tk1ssox2o0hRlHb7WkY',
		],
		owner: null,
		uploaders: null,
		cursor: null,
		reduxCursor: null,
	});

	console.log({
		contracts: gqlData.contracts.length,
		nextCursor: gqlData.nextCursor,
		previousCursor: gqlData.previousCursor,
	});
}

async function testGetArtifactsByBookmarksGQL() {
	console.log(`Testing Artifacts By Ids GQL Request ...`);
	const gqlData: ArtifactResponseType = await getArtifactsByBookmarks({
		ids: ['8VUccSZEcXxnHh5o6L7VkzY__hNDyRM0Er8c3RmCMJc'],
		owner: null,
		uploaders: null,
		cursor: null,
		reduxCursor: null,
	});

	console.log({
		contracts: gqlData.contracts.length,
		nextCursor: gqlData.nextCursor,
		previousCursor: gqlData.previousCursor,
	});
}

async function testGetPoolsGQL() {
	console.log(`Testing Pools GQL Request ...`);
	const pools = await getPools();
	console.log(`Pool Count: ${pools.length}`);
}

async function testGetIndexPoolsGQL() {
	console.log(`Testing Pools by index GQL Request ...`);
	const pools = await getIndexPools();
	console.log(`Indexed Pool Count: ${pools.length}`);
}

async function testGetProfileGQL() {
	console.log(`Testing Profile GQL Request ...`);
	const profile = await getProfile('uf_FqRvLqjnFMc8ZzGkF4qWKuNmUIQcYP0tPlCGORQk');
	console.log(profile);
}

(async function () {
	switch (process.argv[2]) {
		case 'get-artifacts-by-pool':
			await testGetArtifactsByPoolGQL();
			return;
		case 'get-artifacts-by-user':
			await testGetArtifactsByUserGQL();
			return;
		case 'get-artifacts-by-ids':
			await testGetArtifactsByIdsGQL();
			return;
		case 'get-artifacts-by-bookmarks':
			await testGetArtifactsByBookmarksGQL();
			return;
		case 'get-pools':
			await testGetPoolsGQL();
			return;
		case 'get-index-pools':
			await testGetIndexPoolsGQL();
			return;
		case 'get-profile':
			await testGetProfileGQL();
			return;
		case 'full':
			await testGetArtifactsByPoolGQL();
			await testGetArtifactsByUserGQL();
			await testGetArtifactsByIdsGQL();
			await testGetArtifactsByBookmarksGQL();
			await testGetPoolsGQL();
			await testGetProfileGQL();
			return;
		default:
			return;
	}
})();
