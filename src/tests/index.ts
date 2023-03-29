import { getArtifactsByIds, getArtifactsByPool, getPools, getProfile } from '../gql';
import { ArtifactResponseType } from '../helpers';

async function testGetArtifactsByPoolGQL() {
	console.log(`Testing Artifacts By Pool GQL Request ...`);
	const gqlData: ArtifactResponseType = await getArtifactsByPool({
		ids: ['zoljIRyzG5hp-R4EZV2q8kFI49OAoy23_B9YJ_yEEws'],
		owner: null,
		uploader: null,
		cursor: null,
		reduxCursor: 'poolAll',
	});

	console.log({
		contracts: gqlData.contracts.length,
		nextCursor: gqlData.nextCursor,
		previousCursor: gqlData.previousCursor,
	});
}

async function testGetArtifactsByIds() {
	console.log(`Testing Artifacts By Ids GQL Request ...`);
	const gqlData: ArtifactResponseType = await getArtifactsByIds({
		ids: [
			'lFO2qdhjBpMG13-Zamz3vW7E7FFbJT9NgPhgdgDUVQc',
			'6R2dVcktecT0dbezgHq8eHrmzRpnl8JrtaDXT-ZZ69s',
			'9hUxb7MCMmMJ61oWJAKbGMczUDVYvPjmLs_xSLsppF4',
			'FRRpmc0_e4--5c_Lsg9yNpqsu9aIQLg920GUKo6JjPo',
			'PsNTVxx6LauegIamlK4ju92-noWpFxc8fTTmtiEHuAU',
			'qERJuxaUy2Vs9VwjCZSu5Lt0Tk1ssox2o0hRlHb7WkY'
		],
		owner: null,
		uploader: null,
		cursor: null,
		reduxCursor: null
	})

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

async function testGetProfileGQL() {
	console.log(`Testing Profile GQL Request ...`);
	const profile = await getProfile('uf_FqRvLqjnFMc8ZzGkF4qWKuNmUIQcYP0tPlCGORQk');

	console.log(profile);
}

(async function () {
	// await testGetArtifactsByPoolGQL();
	// await testGetPoolsGQL();
	// await testGetProfileGQL();
	await testGetArtifactsByIds();
})();
