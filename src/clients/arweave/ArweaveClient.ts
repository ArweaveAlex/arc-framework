import Arweave from 'arweave';
import { defaultCacheOptions, LoggerFactory, WarpFactory } from 'warp-contracts';
import { ArweaveSigner, DeployPlugin, InjectedArweaveSigner } from 'warp-contracts-plugin-deploy';

import { getGQLData } from '../../gql';
import { API_CONFIG, GATEWAYS, GQLResponseType, TAGS } from '../../helpers';

LoggerFactory.INST.logLevel('fatal');

export default class ArweaveClient {
	bundlr: any;
	arweaveGet: any;
	arweavePost: any;
	warpArweaveGateway: any;
	warpDefault: any;
	arweaveUtils: any;

	constructor(_jwk?: any) {
		this.arweaveGet = Arweave.init({
			host: GATEWAYS.goldsky,
			protocol: API_CONFIG.protocol,
			port: API_CONFIG.port,
			timeout: API_CONFIG.timeout,
			logging: API_CONFIG.logging,
		});

		this.arweavePost = Arweave.init({
			host: GATEWAYS.arweave,
			protocol: API_CONFIG.protocol,
			port: API_CONFIG.port,
			timeout: API_CONFIG.timeout,
			logging: API_CONFIG.logging,
		});

		this.arweaveUtils = Arweave.utils;

		this.warpArweaveGateway = WarpFactory.forMainnet(defaultCacheOptions, true);

		this.warpDefault = WarpFactory.forMainnet({
			...defaultCacheOptions,
			inMemory: true,
		}).use(new DeployPlugin());

		this.warpPluginArweaveSigner = this.warpPluginArweaveSigner.bind(this);
		this.warpPluginInjectedArweaveSigner = this.warpPluginInjectedArweaveSigner.bind(this);
	}

	warpPluginArweaveSigner(wallet: any) {
		return new ArweaveSigner(wallet);
	}

	warpPluginInjectedArweaveSigner(wallet: any) {
		return new InjectedArweaveSigner(wallet);
	}

	async isDuplicate(args: { artifactName: string; poolId: string }) {
		const artifacts: { data: GQLResponseType[]; nextCursor: string | null } = await getGQLData({
			ids: null,
			tagFilters: [
				{
					name: TAGS.keys.artifactName,
					values: [args.artifactName],
				},
				{
					name: TAGS.keys.poolId,
					values: [args.poolId],
				},
			],
			uploaders: null,
			cursor: null,
			reduxCursor: null,
			cursorObject: null,
			useArweavePost: true,
		});
		return artifacts.data.length > 0;
	}
}
