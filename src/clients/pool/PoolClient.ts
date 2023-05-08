import { Buffer } from 'buffer';

import { getArtifactsByUser, getGQLData, getPools } from '../../gql';
import { TAGS } from '../../helpers/config';
import { ContributionResultType, ContributionType, GQLResponseType, PoolType } from '../../helpers/types';
import { getTagValue } from '../../helpers/utils';
import { ArweaveClient } from '../arweave';

// TODO: Language to site provider
export default class PoolClient extends ArweaveClient {
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

			const warpContract = this.warp.contract(poolId).connect('use_wallet').setEvaluationOptions({
				waitForConfirmation: false,
				allowBigInt: true
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
