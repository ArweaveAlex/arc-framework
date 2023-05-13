import { ArweaveClient } from '../clients';
import { POOL_INDEX_CONTRACT_ID } from '../helpers/config';
import { PoolType } from '../helpers/types';

export async function getPools(): Promise<PoolType[]> {
	const arClient = new ArweaveClient();
	const contract = arClient.warp.contract(POOL_INDEX_CONTRACT_ID).setEvaluationOptions({
		allowBigInt: true,
		remoteStateSyncEnabled: true,
	});
	return ((await contract.readState()) as any).cachedValue.state.pools;
}

export async function getPoolIds(): Promise<string[]> {
	return (await getPools()).map((pool: PoolType) => pool.id);
}