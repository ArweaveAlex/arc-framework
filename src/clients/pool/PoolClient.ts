import Bundlr from '@bundlr-network/client';
import { Buffer } from 'buffer';
import { Contract } from 'warp-contracts';

import { getArtifactsByUser, getGQLData, getPools, getPoolById } from '../../gql';
import { BUNDLR_CURRENCY, BUNDLR_NODE, TAGS } from '../../helpers/config';
import {
	ANSTopicEnum,
	ContributionResultType,
	ContributionType,
	GQLResponseType,
	IPoolClient,
	PoolConfigType,
	PoolType,
} from '../../helpers/types';
import { getTagValue } from '../../helpers/utils';
import { ArweaveClient } from '../arweave';

import { POOL_CONTRACT_SRC } from './contracts';
import { initNewPoolConfig } from './PoolCreateClient';

// initialize a PoolConfigType from an existing pool contract
export async function initPoolConfigFromContract(poolId: string) {
	let poolConfig: PoolConfigType = initNewPoolConfig();

	let pool = await getPoolById(poolId);
	let poolData = await getGQLData({
		ids: null,
		tagFilters: [
			{name: TAGS.keys.poolName, values: [pool.state.title]}
		],
		uploader: null,
		cursor: null,
		reduxCursor: null,
		cursorObject: null
	});

	if(poolData.data.length < 1) return null;

	let artifactContractSrc: string;

	if(pool.state.artifactContractSrc) {
		artifactContractSrc = pool.state.artifactContractSrc;
	} else {
		let artifactData = await getGQLData({
			ids: null,
			tagFilters: [
				{name: TAGS.keys.poolName, values: [pool.state.title]}
			],
			uploader: null,
			cursor: null,
			reduxCursor: null,
			cursorObject: null
		}); 

		if(artifactData.data.length > 0) {
			artifactContractSrc = getTagValue(artifactData.data[0].node.tags, TAGS.keys.contractSrc);
		}
	}

	if(!artifactContractSrc) {
		throw new Error(`Could not locate artifact contract src id`);
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
	poolConfig.keywords = JSON.parse(getTagValue(poolData.data[0].node.tags, TAGS.keys.keywords)) as string[];
	poolConfig.topics = pool.state.topics;

	return poolConfig;
}

// TODO: Language to site provider
export default class PoolClient extends ArweaveClient implements IPoolClient {
	arClient = new ArweaveClient();

	poolConfig: PoolConfigType;
	walletKey: string | null;

	contract: Contract;

	signedPoolWallet: any;

	constructor(
		args: { 
			poolConfig?: PoolConfigType, 
			signedPoolWallet?: any
		}
	) {
		super();

		if(args.poolConfig) {
			this.poolConfig = args.poolConfig;

			this.bundlr = new Bundlr(BUNDLR_NODE, BUNDLR_CURRENCY, args.poolConfig.walletKey);
			this.contract = this.arClient.warpDefault.contract(args.poolConfig.contracts.pool.id).setEvaluationOptions({
				allowBigInt: true,
			});
			this.warpDefault = this.arClient.warpDefault;
	
			this.validatePoolConfigs = this.validatePoolConfigs.bind(this);
	
			this.signedPoolWallet = args.signedPoolWallet;
		}
	}

	async validatePoolConfigs() {
		console.log(`Checking Exisiting Pools ...`);
		const exisitingPools = await getPools();
		let poolConfig = this.poolConfig;
		exisitingPools.forEach(function (pool: PoolType) {
			if (poolConfig.state.title === pool.state.title) {
				throw new Error(`Pool Already Exists`);
			}
		});

		let validTopic = false;
		poolConfig.topics.map((topic: string) => {
			if (topic in ANSTopicEnum) {
				validTopic = true;
			}
		});

		let topics = Object.values(ANSTopicEnum).join(', ');
		if (!validTopic) {
			throw new Error(`Must configure at least 1 topic with one of the following values ${topics}`);
		}
	}

	async evolve() {
		if (!this.poolConfig.walletKey) {
			throw new Error(`No wallet configured please set poolConfig.walletKey to the pools private key`);
		}
		let poolSrc = POOL_CONTRACT_SRC;
		let poolWallet = this.signedPoolWallet;

		let contract = this.arClient.warpDefault
			.contract(this.poolConfig.contracts.pool.id)
			.connect(this.poolConfig.walletKey)
			.setEvaluationOptions({
				allowBigInt: true,
			});

		const newSource = await this.arClient.warpDefault.createSource({ src: poolSrc }, poolWallet);
		const newSrcId = await this.arClient.warpDefault.saveSource(newSource);
		await contract.evolve(newSrcId);
	}

	async fundBundlr() {
		if (!this.poolConfig.walletKey) {
			throw new Error(`No wallet configured please set poolConfig.walletKey to the pools private key`);
		}

		const arClient = new ArweaveClient(this.poolConfig.walletKey);
		let balance = await arClient.arweavePost.wallets.getBalance(this.poolConfig.state.owner.pubkey);

		try {
			await arClient.bundlr.fund(Math.floor(balance / 2));
		} catch (e: any) {
			throw new Error(`Error funding bundlr, check funds in arweave wallet ...\n ${e}`);
		}
	}

	async setTopics(topicValues: string[]) {
		if (!this.poolConfig.walletKey) {
			throw new Error(`No wallet configured please set poolConfig.walletKey to the pools private key`);
		}

		for (let i = 0; i < topicValues.length; i++) {
			let topicValue = topicValues[i].trim().toLowerCase();
			if (!Object.keys(ANSTopicEnum).some((key) => ANSTopicEnum[key].toLowerCase() === topicValue)) {
				throw new Error(
					`Invalid topic value: ${topicValue}, please only use values from this list - ${Object.values(
						ANSTopicEnum
					).join(', ')}`
				);
			}
		}

		topicValues = topicValues.map((val: string) => {
			let l = val.toLowerCase();
			return l.charAt(0).toUpperCase() + l.slice(1);
		});

		let contract = this.arClient.warpDefault
			.contract(this.poolConfig.contracts.pool.id)
			.connect(this.poolConfig.walletKey)
			.setEvaluationOptions({
				allowBigInt: true,
			});

		await contract.writeInteraction({
			function: 'setTopics',
			data: topicValues,
		});

		this.poolConfig.topics = topicValues;
	}

	async getUserContributions(userWallet: string) {
		let pools: PoolType[] = await getPools();

		if (pools.length > 0) {
			const lastContributions: any = await this.calcLastContributions(userWallet, pools);
			return pools
				.filter((pool: any) => {
					if (pool.state.contributors.hasOwnProperty(userWallet)) {
						return true;
					}
					return false;
				})
				.map((pool: any) => {
					let poolElement = pool;
					poolElement.totalContributed = this.calcARDonated(userWallet, pool);
					poolElement.lastContribution = lastContributions[pool.id];
					poolElement.receivingPercent = this.calcReceivingPercent(userWallet, pool);
					return poolElement;
				});
		} else {
			return pools;
		}
	}

	calcARDonated(userWallet: string, pool: PoolType) {
		let calc = parseFloat(this.calcContributions(pool.state.contributors[userWallet])) / 1000000000000;
		let tokens = calc.toFixed(calc.toString().length);
		return tokens;
	}

	calcReceivingPercent(userWallet: string, pool: PoolType) {
		if (pool) {
			let calc =
				(parseFloat(this.calcContributions(pool.state.contributors[userWallet])) /
					parseFloat(pool.state.totalContributions)) *
				100;
			let tokens = calc.toFixed(4);
			return tokens;
		} else {
			return 0;
		}
	}

	async calcLastContributions(userWallet: string, pools: PoolType[]) {
		const artifacts = await getArtifactsByUser({
			ids: null,
			owner: userWallet,
			uploader: null,
			cursor: null,
			reduxCursor: null,
		});
		let contributionMap: any = {};

		for (let i = 0; i < pools.length; i++) {
			let lastDate: number = 0;
			for (let j = 0; j < artifacts.contracts.length; j++) {
				const date = parseInt(getTagValue(artifacts.contracts[j].node.tags, TAGS.keys.dateCreated));
				if (date > lastDate) {
					lastDate = date;
					contributionMap[pools[i].id] = date;
				}
			}
		}

		return contributionMap;
	}

	getReceivingPercent(userWallet: string, contributors: any, totalContributions: string, activeAmount: number): string {
		if (userWallet && contributors && totalContributions) {
			if (isNaN(activeAmount)) {
				return '0';
			}
			let amount: number = 0;
			amount = activeAmount * 1e12;

			let origAmount: number = amount;

			if (contributors[userWallet]) {
				if (isNaN(contributors[userWallet])) {
					let contribs = contributors[userWallet];
					let total = 0;
					for (let i = 0; i < contribs.length; i++) {
						let c = contribs[i];
						total = total + parseInt(c.qty);
					}
					amount = total + amount;
				} else {
					amount = parseFloat(contributors[userWallet]) + amount;
				}
			}

			let calc: number = amount;
			if (parseFloat(totalContributions) > 0) {
				calc = (amount / (parseFloat(totalContributions) + origAmount)) * 100;
			}
			let tokens = calc.toFixed(4);
			if (isNaN(calc)) return '0';
			return calc >= 100 ? '100' : tokens;
		} else {
			return '0';
		}
	}

	calcContributions(contributions: string | ContributionType[]): string {
		let amount: number = 0;
		if (typeof contributions === 'object') {
			for (let i = 0; i < contributions.length; i++) {
				amount += Number(contributions[i].qty);
			}
		} else {
			amount = Number(contributions);
		}
		return amount.toString();
	}

	getARAmount(amount: string): number {
		return Math.floor(+this.arweavePost.ar.winstonToAr(amount) * 1e6) / 1e6;
	}

	async handlePoolContribute(
		poolId: string,
		amount: number,
		availableBalance: number
	): Promise<ContributionResultType> {
		if (!availableBalance) {
			return { status: false, message: `Wallet Not Connected` };
		}
		if (amount > availableBalance) {
			return {
				status: false,
				message: `Not Enough Funds`,
			};
		}
		try {
			const arweaveContract: GQLResponseType = (
				await getGQLData({
					ids: null,
					tagFilters: [{ name: TAGS.keys.uploaderTxId, values: [poolId] }],
					uploader: null,
					cursor: null,
					reduxCursor: null,
					cursorObject: null,
				})
			).data[0];
			const fetchId = arweaveContract ? arweaveContract.node.id : poolId;
			const { data: contractData }: { data: any } = await this.arweavePost.api.get(`/${fetchId}`);

			let owner = contractData.owner;
			if (arweaveContract) {
				owner = JSON.parse(Buffer.from(contractData.data, 'base64').toString('utf-8')).owner;
			}
			if (!owner) {
				return { status: false, message: `Pool Contribution Failed` };
			}

			const warpContract = this.warpDefault.contract(poolId).connect('use_wallet').setEvaluationOptions({
				waitForConfirmation: false,
				allowBigInt: true,
			});

			let contractState: any = (await warpContract.readState()).cachedValue.state;
			let contribToPool = amount;
			let contribToController = 0;
			if (contractState.controlPubkey && !(contractState.controlPubkey.length === 0)) {
				if (contractState.contribPercent && contractState.contribPercent > 0) {
					const percentDecimal = contractState.contribPercent / 100;
					contribToController = amount * percentDecimal;
					contribToPool = amount - contribToController;
					await warpContract.writeInteraction(
						{ function: 'contribute' },
						{
							disableBundling: true,
							transfer: {
								target: contractState.controlPubkey,
								winstonQty: this.arweavePost.ar.arToWinston(contribToController.toString()),
							},
						}
					);
				}
			}

			const result = await warpContract.writeInteraction(
				{ function: 'contribute' },
				{
					disableBundling: true,
					transfer: {
						target: owner,
						winstonQty: this.arweavePost.ar.arToWinston(contribToPool.toString()),
					},
				}
			);

			if (!result) {
				return { status: false, message: `Pool Contribution Failed` };
			}

			return { status: true, message: `Thank you for your contribution.` };
		} catch (error: any) {
			console.error(error);
			return { status: false, message: `Pool Contribution Failed` };
		}
	}
}
