import { Buffer } from 'buffer';

import { Contract } from 'warp-contracts';

import { getGQLData } from '../../gql';
import { TAGS } from '../../helpers/config';
import { POOL_CONTRACT_SRC } from '../../helpers/contracts';
import {
	ANSTopicEnum,
	GQLResponseType,
	IPoolClient,
	NotificationResponseType,
	PoolBalancesType,
	PoolConfigType,
} from '../../helpers/types';
import { ArweaveClient } from '../arweave';

export default class PoolClient implements IPoolClient {
	arClient: ArweaveClient;
	poolConfig: PoolConfigType;
	walletKey: string | null;

	contract: Contract;

	signedPoolWallet: any;

	constructor(args?: { poolConfig?: PoolConfigType; signedPoolWallet?: any }) {
		if (args && args.poolConfig) {
			this.arClient = new ArweaveClient(args.poolConfig.walletKey);

			this.poolConfig = args.poolConfig;

			this.contract = this.arClient.warpDefault.contract(args.poolConfig.contracts.pool.id).setEvaluationOptions({
				allowBigInt: true,
			});

			this.signedPoolWallet = args.signedPoolWallet;
		} else {
			this.arClient = new ArweaveClient();
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
			.connect(poolWallet)
			.setEvaluationOptions({
				allowBigInt: true,
			});

		const newSource = await this.arClient.warpDefault.createSource({ src: poolSrc }, poolWallet);
		const newSrcId = await this.arClient.warpDefault.saveSource(newSource);
		await contract.evolve(newSrcId);
	}

	async balances(): Promise<PoolBalancesType | null> {
		if (!this.poolConfig || !this.poolConfig.contracts.pool.id) {
			throw new Error(`Please provide a pool config with a pool id in it`);
		}
		try {
			const contractState: any = (await this.contract.readState()).cachedValue.state;

			const arweaveBalance = parseInt(
				await this.arClient.arweavePost.wallets.getBalance(this.poolConfig.state.owner.pubkey)
			);

			const bundlrBalance = 0;

			const totalBalance = arweaveBalance + bundlrBalance;
			const contribPercent = contractState.contribPercent ? parseInt(contractState.contribPercent) : 0;
			const totalContributions = contractState.totalContributions ? parseInt(contractState.totalContributions) : 0;
			const usedFunds = contractState.usedFunds ? parseInt(contractState.usedFunds) : 0;

			const userBalance =
				totalBalance -
				(totalContributions - totalContributions * (contribPercent / 100) - bundlrBalance - usedFunds) -
				usedFunds -
				bundlrBalance;
			const poolBalance = Math.abs(arweaveBalance - userBalance - (usedFunds + bundlrBalance) + bundlrBalance);
			const transferBalance = poolBalance - usedFunds + bundlrBalance;

			return {
				totalBalance: totalBalance,
				arweaveBalance: arweaveBalance,
				bundlrBalance: totalContributions > 0 ? bundlrBalance : 0,
				usedFunds: usedFunds,
				userBalance: userBalance,
				poolBalance: totalContributions > 0 ? poolBalance : 0,
				transferBalance: transferBalance,
			};
		} catch (e: any) {
			console.error(e);
			return null;
		}
	}

	async setTopics(args: { topicValues: string[] }) {
		if (!this.poolConfig || !this.poolConfig.walletKey) {
			throw new Error(`No wallet configured please set poolConfig.walletKey to the pools private key`);
		}

		for (let i = 0; i < args.topicValues.length; i++) {
			let topicValue = args.topicValues[i].trim().toLowerCase();
			if (!Object.keys(ANSTopicEnum).some((key) => ANSTopicEnum[key].toLowerCase() === topicValue)) {
				throw new Error(
					`Invalid topic value: ${topicValue}, please only use values from this list - ${Object.values(
						ANSTopicEnum
					).join(', ')}`
				);
			}
		}

		args.topicValues = args.topicValues.map((val: string) => {
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
			data: args.topicValues,
		});

		this.poolConfig.topics = args.topicValues;
	}

	getARAmount(amount: string): number {
		return Math.floor(+this.arClient.arweavePost.ar.winstonToAr(amount) * 1e6) / 1e6;
	}

	async handlePoolContribute(args: { wincAmount: number }): Promise<NotificationResponseType> {
		if (!this.poolConfig || !this.poolConfig.contracts.pool.id) {
			return { status: false, message: `Please initialize your poolConfig to an existing pool` };
		}

		if (!this.poolConfig || !this.poolConfig.walletKey) {
			return {
				status: false,
				message: `No wallet configured set poolConfig and poolConfig.walletKey to the pools key`,
			};
		}

		try {
			const transaction: GQLResponseType = (
				await getGQLData({
					ids: null,
					tagFilters: [{ name: TAGS.keys.uploaderTxId, values: [this.poolConfig.contracts.pool.id] }],
					uploaders: null,
					cursor: null,
					reduxCursor: null,
					cursorObject: null,
				})
			).data[0];
			const fetchId = transaction ? transaction.node.id : this.poolConfig.contracts.pool.id;
			const { data: contractData }: { data: any } = await this.arClient.arweavePost.api.get(`/${fetchId}`);

			let owner = contractData.owner;
			if (transaction) {
				owner = JSON.parse(Buffer.from(contractData.data, 'base64').toString('utf-8')).owner;
			}
			if (!owner) {
				return { status: false, message: `Owner not found, contribution failed` };
			}

			const warpContract = this.arClient.warpDefault
				.contract(this.poolConfig.contracts.pool.id)
				.connect(this.poolConfig.walletKey)
				.setEvaluationOptions({
					waitForConfirmation: false,
					allowBigInt: true,
				});

			await warpContract.writeInteraction(
				{ function: 'contribute' },
				{
					disableBundling: true,
					transfer: {
						target: owner,
						winstonQty: args.wincAmount.toString(),
					},
				}
			);

			return { status: true, message: `Thank you for your contribution.` };
		} catch (e: any) {
			console.error(e);
			return { status: false, message: e.message };
		}
	}
}
