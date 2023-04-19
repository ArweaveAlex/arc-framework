import { ArweaveClient } from '../clients';
import { getTagValue } from '../helpers';
import { POOL_INDEX_CONTRACT_ID, TAGS } from '../helpers/config';
import { ArcGQLResponseType, GQLResponseType, PoolType } from '../helpers/types';

import { getGQLData } from '.';

export async function getPools(): Promise<PoolType[]> {
	const arClient = new ArweaveClient();
	const contract = arClient.warp.contract(POOL_INDEX_CONTRACT_ID).setEvaluationOptions({ allowBigInt: true, remoteStateSyncEnabled: true });
	return ((await contract.readState()) as any).cachedValue.state.pools;
}

export async function getPoolIds(): Promise<string[]> {
	const pools: ArcGQLResponseType = await getGQLData({
		ids: null,
		tagFilters: [
			{
				name: TAGS.keys.appType,
				values: [
					TAGS.values.poolVersions['1.2'],
					TAGS.values.poolVersions['1.4'],
					TAGS.values.poolVersions['1.5']
				]
			}
		],
		uploader: null,
		cursor: null,
		reduxCursor: null,
		cursorObject: null
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
