import Bundlr from '@bundlr-network/client';
import Arweave from 'arweave';
import { defaultCacheOptions, LoggerFactory, WarpFactory } from 'warp-contracts';
import { ArweaveSigner, DeployPlugin } from 'warp-contracts-plugin-deploy';

LoggerFactory.INST.logLevel('fatal');

const GET_ENDPOINT = 'arweave-search.goldsky.com';
const POST_ENDPOINT = 'arweave.net';

const PORT = 443;
const PROTOCOL = 'https';
const TIMEOUT = 40000;
const LOGGING = false;

const BUNDLR_NODE = 'https://node2.bundlr.network';
const CURRENCY = 'arweave';

export default class ArweaveClient {
	bundlr: any;
	arweaveGet: any;
	arweavePost: any;
	warpArweaveGateway: any;
	warpDefault: any;
	warpPluginArweaveSigner: any;

	constructor(bundlrJwk?: any) {
		if (bundlrJwk) {
			this.bundlr = new Bundlr(BUNDLR_NODE, CURRENCY, bundlrJwk);
		}

		this.arweaveGet = Arweave.init({
			host: GET_ENDPOINT,
			port: PORT,
			protocol: PROTOCOL,
			timeout: TIMEOUT,
			logging: LOGGING,
		});

		this.arweavePost = Arweave.init({
			host: POST_ENDPOINT,
			port: PORT,
			protocol: PROTOCOL,
			timeout: TIMEOUT,
			logging: LOGGING,
		});

		this.warpArweaveGateway = WarpFactory.forMainnet(defaultCacheOptions, true);

		this.warpDefault = WarpFactory.forMainnet({
			...defaultCacheOptions,
			inMemory: true,
		}).use(new DeployPlugin());

		this.warpPluginArweaveSigner = ArweaveSigner;
	}
}
