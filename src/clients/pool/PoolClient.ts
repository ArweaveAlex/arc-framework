import { Buffer } from 'buffer';
import { Contract } from 'warp-contracts';

import { getGQLData } from '../../gql';
import { TAGS } from '../../helpers/config';
import { POOL_CONTRACT_SRC } from '../../helpers/contracts';
import {
	ANSTopicEnum,
	ContributionResultType,
	GQLResponseType,
	IPoolClient,
	PoolBalancesType,
	PoolConfigType,
} from '../../helpers/types';
import { ArweaveClient } from '../arweave';

// Class for working with existing pools
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
			.connect(this.poolConfig.walletKey)
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
			const bundlrBalance = (await this.arClient.bundlr.getBalance(this.poolConfig.state.owner.pubkey)).toNumber();

			const totalBalance = arweaveBalance + bundlrBalance;
			const contribPercent = contractState.contribPercent ? parseInt(contractState.contribPercent) : 0;
			const totalContributions = contractState.totalContributions ? parseInt(contractState.totalContributions) : 0;
			const fundsUsed = contractState.fundsUsed ? parseInt(contractState.fundsUsed) : 0;

			const userBalance =
				totalBalance -
				(totalContributions - totalContributions * (contribPercent / 100) - bundlrBalance - fundsUsed) -
				fundsUsed -
				bundlrBalance;
			const poolBalance = arweaveBalance - userBalance + bundlrBalance;

			return {
				totalBalance: totalBalance,
				arweaveBalance: arweaveBalance,
				bundlrBalance: bundlrBalance,
				fundsUsed: fundsUsed,
				userBalance: userBalance,
				poolBalance: poolBalance,
			};
		} catch (e: any) {
			console.error(e);
			return null;
		}
	}

	async fundBundlr(amount?: string) {
		if (!this.poolConfig || !this.poolConfig.walletKey) {
			throw new Error(`No wallet configured please set poolConfig.walletKey to the pools private key`);
		}

		let balance = await this.arClient.arweavePost.wallets.getBalance(this.poolConfig.state.owner.pubkey);

		try {
			const tx = await this.arClient.bundlr.fund(Math.floor(amount ? parseInt(amount) : balance / 2));
			console.log(tx);
		} catch (e: any) {
			throw new Error(`Error funding bundlr, check funds in arweave wallet ...\n ${e}`);
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

	async handlePoolContribute(args: { amount: number; availableBalance: number }): Promise<ContributionResultType> {
		if (!this.poolConfig || !this.poolConfig.contracts.pool.id) {
			return { status: false, message: `Please initialize your poolConfig to an existing pool` };
		}

		if (!this.poolConfig || !this.poolConfig.walletKey) {
			return {
				status: false,
				message: `No wallet configured please set poolConfig and poolConfig.walletKey to the pools private key`,
			};
		}

		if (!args.availableBalance) {
			return { status: false, message: `Wallet Not Connected` };
		}

		if (args.amount > args.availableBalance) {
			return {
				status: false,
				message: `Not Enough Funds`,
			};
		}
		try {
			const arweaveContract: GQLResponseType = (
				await getGQLData({
					ids: null,
					tagFilters: [{ name: TAGS.keys.uploaderTxId, values: [this.poolConfig.contracts.pool.id] }],
					uploader: null,
					cursor: null,
					reduxCursor: null,
					cursorObject: null,
				})
			).data[0];
			const fetchId = arweaveContract ? arweaveContract.node.id : this.poolConfig.contracts.pool.id;
			const { data: contractData }: { data: any } = await this.arClient.arweavePost.api.get(`/${fetchId}`);

			let owner = contractData.owner;
			if (arweaveContract) {
				owner = JSON.parse(Buffer.from(contractData.data, 'base64').toString('utf-8')).owner;
			}
			if (!owner) {
				return { status: false, message: `Pool Contribution Failed` };
			}

			const warpContract = this.arClient.warpDefault
				.contract(this.poolConfig.contracts.pool.id)
				.connect(this.poolConfig.walletKey)
				.setEvaluationOptions({
					waitForConfirmation: false,
					allowBigInt: true,
				});

			let contractState: any = (await warpContract.readState()).cachedValue.state;
			let contribToPool = args.amount;
			let contribToController = 0;
			if (contractState.controlPubkey && !(contractState.controlPubkey.length === 0)) {
				if (contractState.contribPercent && contractState.contribPercent > 0) {
					const percentDecimal = contractState.contribPercent / 100;
					contribToController = args.amount * percentDecimal;
					contribToPool = args.amount - contribToController;
					await warpContract.writeInteraction(
						{ function: 'contribute' },
						{
							disableBundling: true,
							transfer: {
								target: contractState.controlPubkey,
								winstonQty: this.arClient.arweavePost.ar.arToWinston(contribToController.toString()),
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
						winstonQty: this.arClient.arweavePost.ar.arToWinston(contribToPool.toString()),
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
