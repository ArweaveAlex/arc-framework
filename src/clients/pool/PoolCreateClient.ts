


import { 
    ANSTopicEnum, 
    DEFAULT_POOLS_JSON, 
    TESTING_APP_TYPE,
    FALLBACK_IMAGE, 
    PoolConfigType, 
    PoolStateType, 
    TAGS, 
    logJsonUpdate
} from "../../helpers";

import PoolClient from './PoolClient';
import { NFT_CONTRACT_SRC, NFT_INIT_STATE, POOL_CONTRACT_SRC } from "./contracts";

export function initNewPoolConfig(args?: { testMode?: boolean }) {
    let r = DEFAULT_POOLS_JSON;
    if(args.testMode) {
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

    constructor(
        args: {
            poolConfig: PoolConfigType, 
            controlWalletJwk: any, 
            poolWalletPath?: string,
            img?: Buffer, 
            imgFileType?: string,
            signedControlWallet: any,
        }
    ) {
        this.poolClient = new PoolClient({ 
            poolConfig: args.poolConfig
        });
        this.poolConfig = args.poolConfig;
        this.controlWalletJwk = args.controlWalletJwk;
        this.poolWalletPath = args.poolWalletPath;
        this.img = args.img;
        this.imgFileType = args.imgFileType;
        this.createPool = this.createPool.bind(this);
        this.signedControlWallet = args.signedControlWallet;
    }

    async createPool() {
        let nftSrc: string = NFT_CONTRACT_SRC;
        let nftInitState: any = NFT_INIT_STATE;
        let poolSrc: string = POOL_CONTRACT_SRC;
        let nftDeployment: any;
        let controlWalletAddress: string;
        let img: string;

        try {
            controlWalletAddress = await this.poolClient.arweavePost.wallets.jwkToAddress(this.controlWalletJwk);
            let controlWalletBalance  = await this.poolClient.arweavePost.wallets.getBalance(controlWalletAddress);
            
            if(controlWalletBalance == 0) {
                throw new Error(`Control wallet is empty`);
            }

            if (this.img) {
                const tx = await this.poolClient.arweavePost.createTransaction({
                    data: this.img
                });
                tx.addTag(TAGS.keys.contentType, this.imgFileType);
                await this.poolClient.arweavePost.transactions.sign(tx, this.controlWalletJwk);
                await this.poolClient.arweavePost.transactions.post(tx);
                img = tx.id;
            } 
            else {
                img = FALLBACK_IMAGE;
            }
        } catch (e: any) {
            throw new Error(`Failed to upload background image`);
        }

        try {
            nftDeployment = await this.poolClient.warpDefault.createContract.deploy({
                src: nftSrc,
                initState: JSON.stringify(nftInitState),
                wallet: this.signedControlWallet
            });
        } catch (e: any) {
            console.log(e);
            throw new Error(`Failed deploying nftContractSrc to warp`);
        }

        try {
            console.log(`Deploying Pool Contract Source ...`);
            const poolSrcDeployment = await this.poolClient.warpDefault.createContract.deploy({
                src: poolSrc,
                initState: JSON.stringify({}),
                wallet: this.signedControlWallet
            });
            
            const timestamp = Date.now().toString();

            const poolInitJson: PoolStateType = {
                title: this.poolConfig.state.title,
                image: img,
                briefDescription: this.poolConfig.state.briefDescription,
                description: this.poolConfig.state.description,
                owner: this.poolConfig.state.owner.pubkey,
                ownerInfo: this.poolConfig.state.owner.info,
                timestamp: timestamp,
                contributors: {},
                tokens: {},
                totalContributions: "0",
                totalSupply: "10000000",
                balance: "0",
                canEvolve: true,
                controlPubkey: controlWalletAddress,
                contribPercent: this.poolConfig.state.controller.contribPercent.toString(),
                topics: []
            };

            const tags = [
                { "name": TAGS.keys.appType, "value": this.poolConfig.appType },
                { "name": TAGS.keys.poolName, "value": this.poolConfig.state.title },
                // ANS 110 tags
                { "name": TAGS.keys.title, "value": this.poolConfig.state.title },
                { "name": TAGS.keys.type, "value": TAGS.values.ansTypes.collection },
                { "name": TAGS.keys.description, "value": this.poolConfig.state.briefDescription }
            ];

            this.poolConfig.topics.map((topic: string) => {
                if(topic in ANSTopicEnum){
                    tags.push(
                        { "name": TAGS.keys.topic(topic), "value": topic},
                    );
                    poolInitJson.topics.push(topic);
                } else {
                    console.log(`Invalid ANS topic skipping ${topic}`);
                }
            });

            console.log(`Deploying Pool from Source Tx ...`);
            const poolInitState = JSON.stringify(poolInitJson, null, 2);
            const poolDeployment = await this.poolClient.warpDefault.createContract.deployFromSourceTx({
                wallet: this.signedControlWallet,
                initState: poolInitState,
                srcTxId: poolSrcDeployment.srcTxId,
                tags: tags
            });

            this.poolConfig.walletPath = this.poolWalletPath;
            this.poolConfig.state.controller.pubkey = controlWalletAddress;
            this.poolConfig.state.image = img;
            this.poolConfig.contracts.pool.src = poolSrcDeployment.srcTxId;
            this.poolConfig.state.timestamp = timestamp;
            this.poolConfig.contracts.nft.id = nftDeployment.contractTxId;
            this.poolConfig.contracts.nft.src = nftDeployment.srcTxId;
            this.poolConfig.contracts.pool.id = poolDeployment.contractTxId;

            logJsonUpdate(this.poolConfig.state.title, `contracts.nft.id`, nftDeployment.contractTxId);
            logJsonUpdate(this.poolConfig.state.title, `contracts.nft.src`, nftDeployment.srcTxId);
            logJsonUpdate(this.poolConfig.state.title, `state.timestamp`, timestamp);
            logJsonUpdate(this.poolConfig.state.title, `contracts.pool.src`, poolSrcDeployment.contractTxId);
            logJsonUpdate(this.poolConfig.state.title, `state.owner.pubkey`, this.poolConfig.state.owner.pubkey);
            logJsonUpdate(this.poolConfig.state.title, `walletPath`, this.poolWalletPath);
            logJsonUpdate(this.poolConfig.state.title, `contracts.pool.id`, poolDeployment.contractTxId);
        } catch (e: any) {
            console.log(e);
            throw new Error(`Failed to create pool with error ${e}`);
        }
    }
}