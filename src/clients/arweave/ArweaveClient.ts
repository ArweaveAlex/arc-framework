// import Bundlr from '@bundlr-network/client';
import Arweave from 'arweave';
import { Buffer } from 'buffer';
import { defaultCacheOptions, LoggerFactory, WarpFactory } from 'warp-contracts';

// import { DeployPlugin } from 'warp-contracts-plugin-deploy';
import { getArtifactsByUser, getGQLData, getPools } from '../../gql';
import { TAGS } from '../../helpers/config';
import { ContributionResultType, ContributionType, GQLResponseType, PoolType } from '../../helpers/types';
import { getTagValue } from '../../helpers/utils';

LoggerFactory.INST.logLevel('fatal');

const GET_ENDPOINT = 'arweave-search.goldsky.com';
const POST_ENDPOINT = 'arweave.net';

const PORT = 443;
const PROTOCOL = 'https';
const TIMEOUT = 40000;
const LOGGING = false;

// const BUNDLR_NODE = 'https://node2.bundlr.network';
// const CURRENCY = 'arweave';

// TODO: Move alex functionality to ArcClient
// TODO: Language to site provider
export default class ArweaveClient {
	// public bundlr: any;
	
	// constructor(bundlrJwk?: any) {
	// 	let bundlr: any;
	// 	if (bundlrJwk) {
	// 		bundlr = new Bundlr(BUNDLR_NODE, CURRENCY, bundlrJwk);
	// 	}
	// 	this.bundlr = bundlr;
	// }

	// bundlr: any = new (Bundlr as any).default(BUNDLR_NODE, 'arweave', JSON.parse(Buffer.from('eyJrdHkiOiJSU0EiLCJlIjoiQVFBQiIsIm4iOiJ3TFVJV3RvYVB5ZWt1ZVNoTEJyeXg5SzVWMlltakltRFV1cDhnaks3dzBFLUVsdDU2OXZQbklmdkJUdzZEYVhObXNJVzBVSmkybG1iY3ZaUklfemdreDdQc2tpSVBVMXlCekx6LUFhVTA1WlBkOTlmSnAxdjRxV1d4QUdTaVVnZ0tZX1QwWWE3bmpTM1YxV0xOckRybktrTGdoZUV3MWZTQ0lkVmxjWFlqZTRzbEcwa1d4VWVvTE40OEo3bHQySWRPZXN0WmtzMzNMeVNiQ1duZUx6bWJlTU5nMXZ0RmxTLXFfaWRoWUgxWGJGVUoyaUdEeEZDYkplVWstMnhleFA0OThSNE5ES3h5Uk5ybW5lLXVFT0k2ekI0dTQyRGNKSkgxaWJ0YnRFdFRPdHBVTDEzWXJsLWpLS1E2ZGx5aWlxbWxpd2NtalJvd2lTcmZ6RHdGZ3pub1l4WDUxVE14cFBNOTJELVBrOUZFOTBwaXg4aEpTdUJfRy01cTAtVjNLVlBGS25fM1J0MDBxMHJSbDh3eUhkLUIyazBqZ0VmSzFxSmZNMlNMQTZjaFNaYlEtVUVONk1LWDQxbFQzWHo5c2ZlTXlIT2Zib0N5dXZ3MWcySG9zZng0VHZKUnZ2RTdGNWljaDA2Qnk1a0lKREpRcTB3VWNyT0dycGlUbWU1R0hMTldHalpOWnBlRUE5Z082QTl6TTBfSEw4VGhwZ3FuVks4cS0wbHhyU1Z5d3lGNTJVUHdLd0FhclFhdUFGT0pqWXF2aUpwLTV5UFFDclVRanFxNVpqemh4TmZrOVQ3eVVGVVBqdlZmR0VwVFZ3NVJFR0R3M2xxajNrY1YwMnBCRjNBU3ZYNWZlNXpDRFgwbjJ1N0R2bFQtMDRwTXBoSDNHbXBwZzkyaXBuRVpBVSIsImQiOiJNNTBKSk5RX3JXU2YwUTQwUU16aTg3UXo0ZjNCRzJrRlhHTGpnRGU0Wkg2SDhvQ19zZlZJc09NVG1MSmQxaVB2WXFEVFhhN0xMVEpNMlVpeHlOTEZENEowSElzaXVsQ1ExdTdGdTB0Xzl2X09Qd3Y3dnlyeHVhR2lOTk02X1R2dEtWU1ZaZ3dSR2ptQ1ZZamE1WVlUUlAxZDBMVWQ0UGdYa0NNM1FBc2lpamtkaFktSjZqOUkyYl9ZQjVKM2NsdDctblJMejVjYjJpcERpV1c0YWpVbF9vNk9vdjB2RGdrYW5KTFZGZG9ON3M4OC0tVVo2dFV6bGtRdkRrUGVnbG1DR0ZKdDQ0VWthdmVoblZpdkkwa3JWZHJBcTNNbW5qTF92SkxtaXdUSmZrMmJBbjRNaU11bjRtRDBNVDRGV0k0OTJnRHNsRHl2UmpodUduM3ZfLWZxN2JuRDhiUDRPM1R0QzNRTFUwUjE5NXNzUDg1anA4TzVZQWwybXhMTUhyak5ubXJabUZhdnRoUWNZRGo0Y0oyV2lneXNKcWtVclVMSTNqMzhmU1Y5TUJGTEZPTElEREIzNVdkWHM3ZFZQTGxQU3M5VlpPSGVGLThSNUFGUlNONW1kZ29OaXhjNUd5VW9hVV9IS2VsWWZWVjBvbWtyaGNJV0tpYm0xdXpBbFV5MkZ2bmFUTDgzUjUtbGlucjZ3MVFfZmdNT3BWTndTYkFOUnFrWXR6MFdMTWs4RXZCc2NNaDlBVGtsTXY0M3l6LXhGTUtoRGRpdjNqS3o5Uk1xOWVjZEVaV0NqQlI2cDBRR3lIZV95Mlc0WE01U0ZaWU5jSjBUVzQwcHcybXhxM2ZnbDZtQkRBWTVaazhJVmZqLUFoZW94ZVB5X3JSdTZxbzJKcVF1Tm10LU5pRSIsInAiOiI1OEo2T1VhVDMwM1NUSHJGTFExR3h1RUlvMmx6WHIwUnh3RWtzOVI1RHBSdjVUUXg2NHdyQ1ZORVNaS0Z5a1N4S1N4MVlJQ2hzVTFsaGtSU2x5NVRvUjFKY1owUE5XXzAwOUc3MkRMa0Q1NDQ0OTZUUHJPVi1fT0FodXBpeUU0WGJSQzlqVjV3aHF6VWVpUUU5VE81eTlrSUZnTU03Rk1aX21KY2lwXy16RmYyWS16VmFqcFBxRnFfbERsM0RHRkhycU1rdjRLRXM0VlB1MzBYRGI5cnd4WENtRUxPMFR5eUJkMTRIV0lxRHdpa25zeVZNdXZxUmd1SFFGZVNXQ1dUMHhuaEk4YjlCbWR2NDBreDN4ZGJPem9jcUlqdkt1bm1ENFEtVjFFYnlYZVBMT012S3k4ckZnV2hPakxpSHVPNTZ0SjBxbENnT051OHpTdkxsb2VRalEiLCJxIjoiMU56bHdfbVpKTUtUM0tpVl85TVVqRzdfakw3UzlaTUc0ZHBseGViS1dnSmQwc2dtcndwUnJxRXVOamdoeGhwS3dTaXp1cW1BRHN4eWF5Z1BNaDdZbnh6WEJ2dkZfWkNIMFRzWG1zUGJvR0FBeTdsSGxhMm9oRGFpbGpjZ2xxQ1dnYlRxOWVhd211bmRaYlUzYnpmcXhnU2laN2hjaTVWNFZ3LXZFclB4S04zWFIxWXdfXzhFQzhPeFJiMEt1eWJzN2sxSlc1Mlg5Qkdlc1lQUDE2VTF4aEJXRm9pa21oMXZMRXo0TTZfZ04zYUI4VkpJai1saTFoaG9nRV9XcUZNeW5LSWowckluaUgtdHA0eENmbVg1TlBxYkQyOFdJaFF6LUtYZkVmTlJTWW5GcUdEcDdCaGhRTXdpMnBnM2dUYU5MLTQwdWxQeVhNN2o5Y0ZTdWs1dldRIiwiZHAiOiJybzlLby0xRzM0Q3NEekxCWk1lRk1iSzVZT3ZDRy05b2ZtMmNDVjdWdDJlU1NCN2lJcm8yaUJXUmI2RE82S1NJazZ5SzFCN09xczdTMHlpTzFKUHVKWUg3bVhsa3hTa0lUS3JDUTN0QlQ0b3E2MmJ2bk9DQzdYeGdxRDNPSFhURUxEX1pwYXNtTWlubS1BQTlRN3FzREpfeGVUTGVfdmt3c092QkxDQ0tON3RoTjY1Z3FGdzNOMlR5dTFfMURQd1FrN2NKckwxUDJpOWstS0NsUnBPUlJTVVVwcjViTERuOUZISFZVTHhwVlYxN01LaURFQkdsS1JEeDFFS2hWWWNvS201cHB4cnY1V3p2VjFBQUlqcGpXdDdRU3hpb203Z0VzbGMyNVdtUDlsVDVJQ1FWbVA4MEFxaEc0YUVGczZKdW5ESGI4WlE4dWRhNEJBa2lsTVNTMlEiLCJkcSI6Ikh3SXE2bmlTeVpzYXhSczk5cTEtSWRNTm9TZ3ZQUnowOUxQR19hUllOX0otVG5WZnhVSUFraXJpdTMxRDFrTUFQdEU2RldnWndvNGY0T0pPREdRWDlGM1VLUzFHTTJENW1BNC1xd243RllyR3N1YkR1ZGM1WkVFOVFCcTV3WmVWTlVId3RHLXRySE9ERUF6dERXT2M3TW5DQ3NfOWswdnI0dXJpLXh1QmR3MlNEYzlOaGcxVlBvMThab2RhWjljTXpzNHRjSTR0azUxNWU2eVMtM3dTc0U2eTY4ZHVDeEZjbjV4Nno3VEFPZlFtaTh3THpBTVlwYzJhYzQ2dDI0bDdKdndyc2NiSUlZZFAtY2RoN0YzWWh0STNBbkdSVE5lYWxvODdScmNtVVVzam94cXpHUFNZUGtNLWxJOTJEbm11Nlp1T3pOSHJ6WDlLRUFQZ2xFbFd5USIsInFpIjoiSzN5QnRLUmNUWDZGVmhKV25ZX3hsRy1WNkFFcjNRSEU0dkxrby1OMk05YWFDMlkxUE9fbEhGRk91REtNQjNQcnVsR0RLYWdQYzA2amI2OU43YTNmX3g1QktPSFROM0ZOMHk1N2Q3bHRPRU5IN0QyU3JYNXhQaDZSWVRyVDQ2Y2R6Nk05cmE1bld3YmVfTnQtSkw1RzF6VDV3S2NtbGdJV0owZHczQUExVzRrTlNzZEpTc25uXzZJWXFYTnVNamNpX1BBYmladEVrN3UxcU1WcFZ1dmlzMjczTnhnVDRXQ0VoSjV5OGJKTThaNVdPTURDN3A1NURXVnpZVGpSTzh6ZjVBY3VodHZkZkdFRUcteHBmSER0WndZSS1KR0NkbG95UzhQbW1zZmlkclNCYi16UWJUeTRWQnlhcGFBZ3cycUU2RURhbVZ3NHV5XzQwd251UV84X29RIn0=', 'base64').toString('utf-8')));

	arweaveGet: any = Arweave.init({
		host: GET_ENDPOINT,
		port: PORT,
		protocol: PROTOCOL,
		timeout: TIMEOUT,
		logging: LOGGING,
	});

	arweavePost: any = Arweave.init({
		host: POST_ENDPOINT,
		port: PORT,
		protocol: PROTOCOL,
		timeout: TIMEOUT,
		logging: LOGGING,
	});

	// bundlr = new (Bundlr as any).default(BUNDLR_NODE, 'arweave', 'TEMP');
	// warp = WarpFactory.forMainnet({ ...defaultCacheOptions, inMemory: true }).use(new DeployPlugin());
	warp = WarpFactory.forMainnet({ ...defaultCacheOptions, inMemory: true });

	// async getBundlr(jwk: any) {
	// 	return new (Bundlr as any).default(BUNDLR_NODE, 'arweave', jwk);
	// }

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
			let amount: number = 0;
			if (!isNaN(activeAmount)) {
				amount = activeAmount * 1e6;
			}

			if (contributors[userWallet]) {
				amount = parseFloat(contributors[userWallet] + (!isNaN(activeAmount) ? activeAmount : 0));
			}

			let calc: number = amount;
			if (parseFloat(totalContributions) > 0) {
				calc = (amount / parseFloat(totalContributions)) * 100;
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
			});
			const result = await warpContract.writeInteraction(
				{ function: 'contribute' },
				{
					disableBundling: true,
					transfer: {
						target: owner,
						winstonQty: this.arweavePost.ar.arToWinston(amount.toString()),
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
