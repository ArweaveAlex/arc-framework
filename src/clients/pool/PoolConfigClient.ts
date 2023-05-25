import { getGQLData, getPoolById, getPools } from '../../gql';
import {
	ANSTopicEnum,
	DEFAULT_POOLS_JSON,
	getTagValue,
	PoolConfigType,
	PoolType,
	TAGS,
	TESTING_APP_TYPE,
} from '../../helpers';

// Class for generating PoolConfigType instances
export default class PoolConfigClient {
	testMode: boolean;

	constructor(args?: { testMode?: boolean }) {
		if (args && args.testMode) {
			this.testMode = args.testMode;
		}
	}

	initNew() {
		let r = DEFAULT_POOLS_JSON;
		if (this.testMode) {
			r.appType = TESTING_APP_TYPE;
		}
		return r;
	}

	async validateNewPoolConfig(args: { poolConfig: PoolConfigType }) {
		console.log(`Checking Exisiting Pools ...`);
		const exisitingPools = await getPools();

		exisitingPools.forEach(function (pool: PoolType) {
			if (args.poolConfig.state.title === pool.state.title) {
				throw new Error(`Pool Already Exists`);
			}
		});

		let validTopic = false;
		args.poolConfig.topics.map((topic: string) => {
			if (topic in ANSTopicEnum) {
				validTopic = true;
			}
		});

		let topics = Object.values(ANSTopicEnum).join(', ');
		if (!validTopic) {
			throw new Error(`Must configure at least 1 topic with one of the following values ${topics}`);
		}
	}

	async initFromContract(args: { poolId: string }) {
		let poolConfig: PoolConfigType = this.initNew();

		let pool = await getPoolById(args.poolId);
		let poolData = await getGQLData({
			ids: null,
			tagFilters: [{ name: TAGS.keys.poolName, values: [pool.state.title] }],
			uploader: null,
			cursor: null,
			reduxCursor: null,
			cursorObject: null,
		});

		if (poolData.data.length < 1) return null;

		let artifactContractSrc: string;
		let keywords: string[];

		let artifactData = await getGQLData({
			ids: null,
			tagFilters: [{ name: TAGS.keys.poolId, values: [pool.id] }],
			uploader: null,
			cursor: null,
			reduxCursor: null,
			cursorObject: null,
		});

		if (pool.state.artifactContractSrc) {
			artifactContractSrc = pool.state.artifactContractSrc;
		} else {
			if (artifactData.data.length > 0) {
				artifactContractSrc = getTagValue(artifactData.data[0].node.tags, TAGS.keys.contractSrc);
			}
		}

		if (pool.state.keywords) {
			keywords = pool.state.keywords;
		} else {
			if (artifactData.data.length > 0) {
				keywords = JSON.parse(getTagValue(artifactData.data[0].node.tags, TAGS.keys.keywords)) as string[];
			}
		}

		if (!artifactContractSrc) {
			throw new Error(`Could not locate artifact contract src id`);
		}

		if (!keywords) {
			throw new Error(`Could not locate keywords`);
		}

		poolConfig.appType = getTagValue(poolData.data[0].node.tags, TAGS.keys.appType);
		poolConfig.contracts.pool.id = pool.id;
		poolConfig.contracts.pool.src = getTagValue(poolData.data[0].node.tags, TAGS.keys.contractSrc);
		poolConfig.contracts.nft.src = artifactContractSrc;
		poolConfig.state.owner.pubkey = pool.state.owner;
		poolConfig.state.owner.info = pool.state.ownerInfo;
		poolConfig.state.controller.pubkey = pool.state.controlPubkey;
		poolConfig.state.controller.contribPercent = parseFloat(pool.state.contribPercent);
		poolConfig.state.title = pool.state.title;
		poolConfig.state.description = pool.state.description;
		poolConfig.state.briefDescription = pool.state.briefDescription;
		poolConfig.state.image = pool.state.image;
		poolConfig.state.timestamp = pool.state.timestamp;
		poolConfig.state.ownerMaintained = pool.state.ownerMaintained;
		poolConfig.keywords = keywords;
		poolConfig.topics = pool.state.topics;

		return poolConfig;
	}
}
