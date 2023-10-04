import { getArtifactsByUser, getPools } from '../../gql';
import { ContributionType, getTagValue, PoolType, TAGS } from '../../helpers';

// data/functions pertaining to individual users
export default class UserClient {
	userWalletAddress: string;

	constructor(args: { userWalletAddress: string }) {
		this.userWalletAddress = args.userWalletAddress;

		this.getUserContributions = this.getUserContributions.bind(this);
		this.calcARDonated = this.calcARDonated.bind(this);
		this.calcReceivingPercent = this.calcReceivingPercent.bind(this);
		this.calcLastContributions = this.calcLastContributions.bind(this);
		this.getReceivingPercent = this.getReceivingPercent.bind(this);
		this.calcContributions = this.calcContributions.bind(this);
	}

	async getUserContributions() {
		let pools: PoolType[] = await getPools();

		if (pools.length > 0) {
			return pools
				.filter((pool: any) => {
					if (pool.state.contributors.hasOwnProperty(this.userWalletAddress)) {
						return true;
					}
					return false;
				})
				.map((pool: any) => {
					let poolElement = pool;
					poolElement.totalContributed = this.calcARDonated(pool);
					poolElement.receivingPercent = this.calcReceivingPercent(pool);
					return poolElement;
				});
		} else {
			return pools;
		}
	}

	calcARDonated(pool: PoolType) {
		let calc = parseFloat(this.calcContributions(pool.state.contributors[this.userWalletAddress])) / 1000000000000;
		let tokens = calc.toFixed(calc.toString().length);
		return tokens;
	}

	calcReceivingPercent(pool: PoolType) {
		if (pool) {
			let calc =
				(parseFloat(this.calcContributions(pool.state.contributors[this.userWalletAddress])) /
					parseFloat(pool.state.totalContributions)) *
				100;
			let tokens = calc.toFixed(4);
			return tokens;
		} else {
			return 0;
		}
	}

	async calcLastContributions(pools: PoolType[]) {
		const artifacts = await getArtifactsByUser({
			ids: null,
			owner: this.userWalletAddress,
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
}
