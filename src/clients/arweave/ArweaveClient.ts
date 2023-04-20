import Arweave from 'arweave';
import { defaultCacheOptions, LoggerFactory, WarpFactory } from 'warp-contracts';

LoggerFactory.INST.logLevel('fatal');

const GET_ENDPOINT = 'arweave-search.goldsky.com';
const POST_ENDPOINT = 'arweave.net';

const PORT = 443;
const PROTOCOL = 'https';
const TIMEOUT = 40000;
const LOGGING = false;

export default class ArweaveClient {
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

	warp = WarpFactory.forMainnet({ ...defaultCacheOptions, inMemory: true });
}
