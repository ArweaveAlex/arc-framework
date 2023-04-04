import Bundlr from '@bundlr-network/client';
import Arweave from 'arweave';
import { defaultCacheOptions, LoggerFactory, WarpFactory } from 'warp-contracts';
import { DeployPlugin, ArweaveSigner } from 'warp-contracts-plugin-deploy';

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
	public bundlr: any;
	
	constructor(bundlrJwk?: any) {
		let bundlr: any;
		if (bundlrJwk) {
			bundlr = new Bundlr(BUNDLR_NODE, CURRENCY, bundlrJwk);
		}
		this.bundlr = bundlr;
	}

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
	
	warp = WarpFactory.forMainnet({ ...defaultCacheOptions, inMemory: true }).use(new DeployPlugin());
	// warp = WarpFactory.forMainnet({ ...defaultCacheOptions, inMemory: true });

	getNodeSigner = function(jwk: any) : ArweaveSigner {
		return new ArweaveSigner(jwk);
	}
}
