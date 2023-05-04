import Arweave from 'arweave';
import { defaultCacheOptions, LoggerFactory, WarpFactory } from 'warp-contracts';

LoggerFactory.INST.logLevel('fatal');

const GET_ENDPOINT = 'arweave-search.goldsky.com';
const POST_ENDPOINT = 'arweave.net';

const PORT = 443;
const PROTOCOL = 'https';
const TIMEOUT = 40000;
const LOGGING = true;

export default class ArweaveClient {
	arweaveGet: any;
	arweavePost: any;
	warp: any;

	constructor() {
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

		this.arweaveGet.request = this.wrapRequestForLogging(this.arweaveGet.request);
		this.arweavePost.request = this.wrapRequestForLogging(this.arweavePost.request);

		this.warp = WarpFactory.forMainnet({ ...defaultCacheOptions, inMemory: true });
	}

	wrapRequestForLogging(originalRequest) {
		return async (method, url, headers, body, ...args) => {
			console.log(`Arweave request: ${method} ${url}`);
			console.log('Request headers:', headers);
			console.log('Request body:', body);

			const response = await originalRequest.call(this.arweaveGet, method, url, headers, body, ...args);

			console.log('Response status:', response.status);
			console.log('Response headers:', response.headers);

			return response;
		};
	}
}
