import { ArweaveClient } from '../clients';
import { STORAGE, TAGS } from '../helpers/config';
import { getRedstoneSrcTxEndpoint } from '../helpers/endpoints';
import { ArcGQLResponseType, PoolSearchIndexType, PoolType } from '../helpers/types';
import { getTagValue } from '../helpers/utils';

import { getGQLData } from '.';

export async function getPoolById(poolId: string): Promise<PoolType | null> {
	const arClient = new ArweaveClient();

	try {
		const contract = arClient.warp.contract(poolId).setEvaluationOptions({ 
			allowBigInt: true
		});
		return {
			id: poolId,
			state: ((await contract.readState()) as any).cachedValue.state,
		};
	} catch (error: any) {
		console.error(error);
		return null;
	}
}

export async function getLatestPoolSearchIndexTxId(poolId: string) {
	const poolSearchIndeces: ArcGQLResponseType = await getGQLData({
		ids: null,
		tagFilters: [
			{
				name: TAGS.keys.appType,
				values: [TAGS.values.searchIndex],
			},
			{
				name: TAGS.keys.alexPoolId,
				values: [poolId],
			},
		],
		uploader: null,
		cursor: null,
		reduxCursor: null,
		cursorObject: null,
	});

	if (poolSearchIndeces.data.length === 0) return null;

	if (poolSearchIndeces.data.length === 1) return poolSearchIndeces.data[0];

	let latestIndex = poolSearchIndeces.data[0];

	for (let i = 1; i < poolSearchIndeces.data.length; i++) {
		let thisIndex = poolSearchIndeces.data[i];
		let thisIndexDateTag = getTagValue(thisIndex.node.tags, TAGS.keys.timestamp);
		let latestIndexDateTag = getTagValue(latestIndex.node.tags, TAGS.keys.timestamp);
		let thisIndexDate = thisIndexDateTag && thisIndexDateTag !== STORAGE.none ? parseInt(thisIndexDateTag) : 0;
		let latestIndexDate = latestIndexDateTag && latestIndexDateTag !== STORAGE.none ? parseInt(latestIndexDateTag) : 0;
		if (thisIndexDate > latestIndexDate) {
			latestIndex = thisIndex;
		}
	}

	return latestIndex;
}

export async function getPoolSearchIndexById(poolSearchIndexId: string): Promise<PoolSearchIndexType | null> {
	const arClient = new ArweaveClient();

	try {
		const contract = arClient.warp.contract(poolSearchIndexId).setEvaluationOptions({ 
			allowBigInt: true
		});
		return {
			id: poolSearchIndexId,
			state: ((await contract.readState()) as any).cachedValue.state,
		};
	} catch (error: any) {
		console.error(error);
		return null;
	}
}

export async function getPoolCount(nftContractSrc: string): Promise<number> {
	let redstoneContracts = await fetch(getRedstoneSrcTxEndpoint(nftContractSrc, 1));
	let redstoneJson = await redstoneContracts.json();
	return parseInt(redstoneJson.paging.total) - 1;
}
