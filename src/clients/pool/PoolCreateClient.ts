import {
	ANSTopicEnum,
	DEFAULT_POOLS_JSON,
	FALLBACK_IMAGE,
	logJsonUpdate,
	PoolConfigType,
	PoolStateType,
	TAGS,
	TESTING_APP_TYPE,
} from '../../helpers';

import { NFT_CONTRACT_SRC, NFT_INIT_STATE, POOL_CONTRACT_SRC } from './contracts';
import PoolClient from './PoolClient';

export function initNewPoolConfig(args?: { testMode?: boolean }) {
	let r = DEFAULT_POOLS_JSON;
	if (args && args.testMode) {
		r.appType = TESTING_APP_TYPE;
	}
	return r;
}

export default class PoolCreateClient {
	poolClient: PoolClient;
	poolConfig: PoolConfigType;
	controlWalletJwk: any;
	poolWalletPath: string | null;
	img: Buffer;
	imgFileType: string;
	signedControlWallet: any;
	controlWalletAddress: string;

	constructor(args: {
		poolConfig: PoolConfigType;
		controlWalletJwk: any;
		poolWalletPath?: string;
		img?: Buffer;
		imgFileType?: string;
		signedControlWallet: any;
		controlWalletAddress: string;
	}) {
		this.poolClient = new PoolClient({
			poolConfig: args.poolConfig,
		});
		this.poolConfig = args.poolConfig;
		this.controlWalletJwk = args.controlWalletJwk;
		this.poolWalletPath = args.poolWalletPath;
		this.img = args.img;
		this.imgFileType = args.imgFileType;
		this.signedControlWallet = args.signedControlWallet;
		this.controlWalletAddress = args.controlWalletAddress;

		this.createPool = this.createPool.bind(this);
		this.checkControlWalletBalance = this.checkControlWalletBalance.bind(this);
		this.uploadBackgroundImage = this.uploadBackgroundImage.bind(this);
		this.deploytNftSrc = this.deploytNftSrc.bind(this);
		this.deployPoolSrc = this.deployPoolSrc.bind(this);
		this.initializeState = this.initializeState.bind(this);
		this.createTags = this.createTags.bind(this);
	}

	async checkControlWalletBalance() {
		let controlWalletBalance = await this.poolClient.arClient.arweavePost.wallets.getBalance(this.controlWalletAddress);

		if (controlWalletBalance == 0) {
			throw new Error(`Control wallet is empty`);
		}
	}

	async uploadBackgroundImage(): Promise<string> {
		try {
			let img = '';
			if (this.img) {
				const tx = await this.poolClient.arClient.arweavePost.createTransaction({
					data: this.img,
				});
				tx.addTag(TAGS.keys.contentType, this.imgFileType);
				await this.poolClient.arClient.arweavePost.transactions.sign(tx, this.controlWalletJwk);
				await this.poolClient.arClient.arweavePost.transactions.post(tx);
				img = tx.id;
			} else {
				img = FALLBACK_IMAGE;
			}
			return img;
		} catch (e: any) {
			throw new Error(`Failed to upload background image`);
		}
	}

	async deploytNftSrc() {
		let nftSrc: string = NFT_CONTRACT_SRC;
		let nftInitState: any = NFT_INIT_STATE;
		let nftDeployment: any;
		try {
			nftDeployment = await this.poolClient.arClient.warpDefault.createContract.deploy({
				src: nftSrc,
				initState: JSON.stringify(nftInitState),
				wallet: this.signedControlWallet,
			});
			return nftDeployment;
		} catch (e: any) {
			console.error(e);
			throw new Error(`Failed deploying nftContractSrc to warp`);
		}
	}

	async deployPoolSrc() {
		try {
			let poolSrc: string = POOL_CONTRACT_SRC;
			return await this.poolClient.arClient.warpDefault.createContract.deploy({
				src: poolSrc,
				initState: JSON.stringify({}),
				wallet: this.signedControlWallet,
			});
		} catch (e: any) {
			console.error(e);
			throw new Error(`Failed deploying nftContractSrc to warp`);
		}
	}

	async initializeState(img: string, nftDeployment: any) {
		const timestamp = Date.now().toString();

		const poolInitJson: PoolStateType = {
			title: this.poolConfig.state.title,
			image: img,
			briefDescription: this.poolConfig.state.briefDescription,
			description: this.poolConfig.state.description,
			owner: this.poolConfig.state.owner.pubkey,
			ownerInfo: this.poolConfig.state.owner.info,
			ownerMaintained: this.poolConfig.state.ownerMaintained,
			timestamp: timestamp,
			contributors: {},
			tokens: {},
			totalContributions: '0',
			totalSupply: '10000000',
			balance: '0',
			canEvolve: true,
			controlPubkey: this.controlWalletAddress,
			contribPercent: this.poolConfig.state.controller.contribPercent.toString(),
			topics: [],
			artifactContractSrc: nftDeployment.srcTxId,
			keywords: this.poolConfig.keywords,
		};

		return poolInitJson;
	}

	createTags(poolState: PoolStateType) {
		const tags = [
			{ name: TAGS.keys.appType, value: this.poolConfig.appType },
			{ name: TAGS.keys.poolName, value: this.poolConfig.state.title },
			// ANS 110 tags
			{ name: TAGS.keys.title, value: this.poolConfig.state.title },
			{ name: TAGS.keys.type, value: TAGS.values.ansTypes.collection },
			{ name: TAGS.keys.description, value: this.poolConfig.state.briefDescription },
		];

		this.poolConfig.topics.map((topic: string) => {
			if (topic in ANSTopicEnum) {
				tags.push({ name: TAGS.keys.topic(topic), value: topic });
				poolState.topics.push(topic);
			} else {
				console.log(`Invalid ANS topic skipping ${topic}`);
			}
		});

		return tags;
	}

	async deployPoolContract(poolState: PoolStateType, poolSrcDeployment: any, tags: any[]) {
		try {
			console.log(`Deploying Pool from Source Tx ...`);
			const poolInitState = JSON.stringify(poolState, null, 2);
			const poolDeployment = await this.poolClient.arClient.warpDefault.createContract.deployFromSourceTx({
				wallet: this.signedControlWallet,
				initState: poolInitState,
				srcTxId: poolSrcDeployment.srcTxId,
				tags: tags,
			});
			return poolDeployment;
		} catch (e: any) {
			console.error(e);
			throw new Error(`Failed deploying nftContractSrc to warp`);
		}
	}

	async createPool() {
		await this.checkControlWalletBalance();
		let img = await this.uploadBackgroundImage();
		let nftDeployment = await this.deploytNftSrc();
		const poolSrcDeployment = await this.deployPoolSrc();
		let poolInitObj = await this.initializeState(img, nftDeployment);
		let tags = this.createTags(poolInitObj);
		const poolDeployment = await this.deployPoolContract(poolInitObj, poolSrcDeployment, tags);

		this.poolConfig.walletPath = this.poolWalletPath;
		this.poolConfig.state.controller.pubkey = this.controlWalletAddress;
		this.poolConfig.state.image = img;
		this.poolConfig.contracts.pool.src = poolSrcDeployment.srcTxId;
		this.poolConfig.state.timestamp = poolInitObj.timestamp;
		this.poolConfig.contracts.nft.id = nftDeployment.contractTxId;
		this.poolConfig.contracts.nft.src = nftDeployment.srcTxId;
		this.poolConfig.contracts.pool.id = poolDeployment.contractTxId;

		logJsonUpdate(this.poolConfig.state.title, `contracts.nft.id`, nftDeployment.contractTxId);
		logJsonUpdate(this.poolConfig.state.title, `contracts.nft.src`, nftDeployment.srcTxId);
		logJsonUpdate(this.poolConfig.state.title, `state.timestamp`, poolInitObj.timestamp);
		logJsonUpdate(this.poolConfig.state.title, `contracts.pool.src`, poolSrcDeployment.contractTxId);
		logJsonUpdate(this.poolConfig.state.title, `state.owner.pubkey`, this.poolConfig.state.owner.pubkey);
		logJsonUpdate(this.poolConfig.state.title, `walletPath`, this.poolWalletPath);
		logJsonUpdate(this.poolConfig.state.title, `contracts.pool.id`, poolDeployment.contractTxId);
	}
}
