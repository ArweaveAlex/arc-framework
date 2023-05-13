import { ArweaveClient } from '../clients';
import { getTagValue } from '../helpers';
import { POOL_INDEX_CONTRACT_ID, TAGS } from '../helpers/config';
import { ArcGQLResponseType, GQLResponseType, PoolIndexType,PoolType } from '../helpers/types';

import { getGQLData } from '.';

export async function getPoolIds() {
	const pools: ArcGQLResponseType = await getGQLData({
		ids: null,
		tagFilters: [
			{
				name: TAGS.keys.appType,
				values: [
					TAGS.values.poolVersions['1.2'], 
					TAGS.values.poolVersions['1.4'], 
					TAGS.values.poolVersions['1.5']
				],
			},
		],
		uploader: null,
		cursor: null,
		reduxCursor: null,
		cursorObject: null,
	});

	return pools.data.map((pool: GQLResponseType) => {
		switch (getTagValue(pool.node.tags, TAGS.keys.appType)) {
			case TAGS.values.poolVersions['1.2']:
				return pool.node.id;
			case TAGS.values.poolVersions['1.4']:
				return getTagValue(pool.node.tags, TAGS.keys.uploaderTxId);
			default:
				return getTagValue(pool.node.tags, TAGS.keys.uploaderTxId);
		}
	});
}

export async function getPools(): Promise<PoolType[]> {
	const arClient = new ArweaveClient();

	const pools: PoolType[] = [];
	const poolIds = await getPoolIds();

	for (let i = 0; i < poolIds.length; i++) {
		if (poolIds[i]) {
			try {
				const contract = arClient.warp.contract(poolIds[i]).setEvaluationOptions({ 
					allowBigInt: true
				});
				try {
					pools.push({ id: poolIds[i], state: ((await contract.readState()) as any).cachedValue.state });
				} catch (error: any) {
					console.error(error);
				}
			} catch (error: any) {
				console.error(error);
			}
		}
	}

	return pools;
}

export async function getIndexPools(): Promise<PoolIndexType[]> {
	const arClient = new ArweaveClient();
	const contract = arClient.warp.contract(POOL_INDEX_CONTRACT_ID).setEvaluationOptions({
		allowBigInt: true,
		remoteStateSyncEnabled: true,
	});
	return ((await contract.readState()) as any).cachedValue.state.pools;
}

export async function getIndexPoolIds(): Promise<string[]> {
	return (await getIndexPools()).map((pool: PoolIndexType) => pool.id);
}