import { ArweaveClient } from '../clients';
import { getTagValue, STORAGE } from '../helpers';
import { POOL_INDEX_CONTRACT_ID, TAGS } from '../helpers/config';
import { ArcGQLResponseType, GQLResponseType, PoolIndexType, PoolType } from '../helpers/types';

import { getGQLData } from '.';

export async function getPoolIds(owner?: string) {
	const pools: ArcGQLResponseType = await getGQLData({
		ids: null,
		tagFilters: [
			{
				name: TAGS.keys.appType,
				values: [TAGS.values.poolVersions['1.2'], TAGS.values.poolVersions['1.4'], TAGS.values.poolVersions['1.5']],
			},
		],
		uploader: owner ? owner : null,
		cursor: null,
		reduxCursor: null,
		cursorObject: null,
		useArweavePost: true,
	});

	return pools.data.map((pool: GQLResponseType) => {
		switch (getTagValue(pool.node.tags, TAGS.keys.appType)) {
			case 'Alex-Archiving-Pool-Thread-Testing-v1.0':
				return pool.node.id;
			case TAGS.values.poolVersions['1.2']:
				return pool.node.id;
			case TAGS.values.poolVersions['1.4']:
				return getTagValue(pool.node.tags, TAGS.keys.uploaderTxId);
			default:
				const uploaderTxId = getTagValue(pool.node.tags, TAGS.keys.uploaderTxId);
				return uploaderTxId === STORAGE.none ? pool.node.id : uploaderTxId;
		}
	});
}

export async function getPools(owner?: string): Promise<PoolType[]> {
	const arClient = new ArweaveClient();

	const pools: PoolType[] = [];
	const poolIds = owner ? await getPoolIds(owner) : await getPoolIds();

	for (let i = 0; i < poolIds.length; i++) {
		if (poolIds[i]) {
			try {
				const contract = arClient.warpDefault.contract(poolIds[i]).setEvaluationOptions({
					allowBigInt: true,
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
	const contract = arClient.warpDefault.contract(POOL_INDEX_CONTRACT_ID).setEvaluationOptions({
		allowBigInt: true,
		remoteStateSyncEnabled: true,
	});
	return ((await contract.readState()) as any).cachedValue.state.pools;
}

export async function getIndexPoolIds(): Promise<string[]> {
	return (await getIndexPools()).map((pool: PoolIndexType) => pool.id);
}

export async function getPoolsByOwner(owner: string): Promise<PoolType[]> {
	return await getPools(owner);
}

export async function checkExistingPool(poolName: string): Promise<boolean> {
	const existingPool: ArcGQLResponseType = await getGQLData({
		ids: null,
		tagFilters: [
			{
				name: TAGS.keys.poolName,
				values: [poolName],
			},
			{
				name: TAGS.keys.appType,
				values: [TAGS.values.poolVersions['1.2'], TAGS.values.poolVersions['1.4'], TAGS.values.poolVersions['1.5']],
			},
		],
		uploader: null,
		cursor: null,
		reduxCursor: null,
		cursorObject: null,
		useArweavePost: true,
	});

	return existingPool.data.length > 0;
}
