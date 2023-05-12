import Bundlr from '@bundlr-network/client';
import Arweave from 'arweave';
import { defaultCacheOptions, LoggerFactory, WarpFactory } from 'warp-contracts';
import { DeployPlugin, ArweaveSigner } from 'warp-contracts-plugin-deploy';
import { GQLResponseType, TAGS } from '../../helpers';
import { getGQLData } from '../../gql';

LoggerFactory.INST.logLevel('fatal');

const GET_ENDPOINT = 'arweave-search.goldsky.com';
const POST_ENDPOINT = 'arweave.net';

const PORT = 443;
const PROTOCOL = 'https';
const TIMEOUT = 40000;
const LOGGING = true;

const BUNDLR_NODE = 'https://node2.bundlr.network';
const CURRENCY = 'arweave';

export default class ArweaveClient {
	public bundlr: any;
	arweaveGet: any;
	arweavePost: any;
	arweaveSigner: any;
	warp: any;

	constructor(bundlrJwk?: any) {
		let bundlr: any;
		if (bundlrJwk) {
			bundlr = new Bundlr(BUNDLR_NODE, CURRENCY, bundlrJwk);
		}
		this.bundlr = bundlr;

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

		this.arweaveSigner = ArweaveSigner;

		this.warp = WarpFactory.forMainnet({
			...defaultCacheOptions,
			inMemory: true,
		}).use(new DeployPlugin());
	}

	async isDuplicate(args: {
        artifactName: string,
        poolId: string,
    }) {
        const artifacts: { data: GQLResponseType[]; nextCursor: string | null } = await getGQLData({
            ids: null,
            tagFilters: [
                {
                    name: TAGS.keys.artifactName,
                    values: [args.artifactName]
                },
                {
                    name: TAGS.keys.poolId,
                    values: [args.poolId]
                }
            ],
            uploader: null,
            cursor: null,
			reduxCursor: null,
			cursorObject: null
        });
        return artifacts.data.length > 0;
    }
}
