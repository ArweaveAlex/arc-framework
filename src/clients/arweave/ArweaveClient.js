"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const gql_1 = require("../../gql");
const config_1 = require("../../helpers/config");
const utils_1 = require("../../helpers/utils");
const arweave_1 = __importDefault(require("arweave"));
// TODO: warp-contracts for both web / node environments // @ts-ignore
const Warp = __importStar(require("warp-contracts"));
Warp.LoggerFactory.INST.logLevel('fatal');
const GET_ENDPOINT = 'arweave-search.goldsky.com';
const POST_ENDPOINT = 'arweave.net';
const PORT = 443;
const PROTOCOL = 'https';
const TIMEOUT = 40000;
const LOGGING = false;
class ArweaveClient {
    constructor() {
        this.arweaveGet = arweave_1.default.init({
            host: GET_ENDPOINT,
            port: PORT,
            protocol: PROTOCOL,
            timeout: TIMEOUT,
            logging: LOGGING,
        });
        this.arweavePost = arweave_1.default.init({
            host: POST_ENDPOINT,
            port: PORT,
            protocol: PROTOCOL,
            timeout: TIMEOUT,
            logging: LOGGING,
        });
        this.warp = Warp.WarpFactory.forMainnet({ ...Warp.defaultCacheOptions, inMemory: true });
    }
    async getUserContributions(userWallet) {
        let pools = await (0, gql_1.getPools)();
        if (pools.length > 0) {
            const lastContributions = await this.calcLastContributions(userWallet, pools);
            return pools
                .filter((pool) => {
                if (pool.state.contributors.hasOwnProperty(userWallet)) {
                    return true;
                }
                return false;
            })
                .map((pool) => {
                let poolElement = pool;
                poolElement.totalContributed = this.calcARDonated(userWallet, pool);
                poolElement.lastContribution = lastContributions[pool.id];
                poolElement.receivingPercent = this.calcReceivingPercent(userWallet, pool);
                return poolElement;
            });
        }
        else {
            return pools;
        }
    }
    calcARDonated(userWallet, pool) {
        let calc = parseFloat(this.calcContributions(pool.state.contributors[userWallet])) / 1000000000000;
        let tokens = calc.toFixed(calc.toString().length);
        return tokens;
    }
    calcReceivingPercent(userWallet, pool) {
        if (pool) {
            let calc = (parseFloat(this.calcContributions(pool.state.contributors[userWallet])) /
                parseFloat(pool.state.totalContributions)) *
                100;
            let tokens = calc.toFixed(4);
            return tokens;
        }
        else {
            return 0;
        }
    }
    async calcLastContributions(userWallet, pools) {
        const artifacts = await (0, gql_1.getArtifactsByUser)({
            ids: null,
            owner: userWallet,
            uploader: null,
            cursor: null,
            reduxCursor: null,
        });
        let contributionMap = {};
        for (let i = 0; i < pools.length; i++) {
            let lastDate = 0;
            for (let j = 0; j < artifacts.contracts.length; j++) {
                const date = parseInt((0, utils_1.getTagValue)(artifacts.contracts[j].node.tags, config_1.TAGS.keys.dateCreated));
                if (date > lastDate) {
                    lastDate = date;
                    contributionMap[pools[i].id] = date;
                }
            }
        }
        return contributionMap;
    }
    getReceivingPercent(userWallet, contributors, totalContributions, activeAmount) {
        if (userWallet && contributors && totalContributions) {
            let amount = 0;
            if (!isNaN(activeAmount)) {
                amount = activeAmount * 1e6;
            }
            if (contributors[userWallet]) {
                amount = parseFloat(contributors[userWallet] + (!isNaN(activeAmount) ? activeAmount : 0));
            }
            let calc = amount;
            if (parseFloat(totalContributions) > 0) {
                calc = (amount / parseFloat(totalContributions)) * 100;
            }
            let tokens = calc.toFixed(4);
            if (isNaN(calc))
                return '0';
            return calc >= 100 ? '100' : tokens;
        }
        else {
            return '0';
        }
    }
    calcContributions(contributions) {
        let amount = 0;
        if (typeof contributions === 'object') {
            for (let i = 0; i < contributions.length; i++) {
                amount += Number(contributions[i].qty);
            }
        }
        else {
            amount = Number(contributions);
        }
        return amount.toString();
    }
    getARAmount(amount) {
        return Math.floor(+this.arweavePost.ar.winstonToAr(amount) * 1e6) / 1e6;
    }
    async handlePoolContribute(poolId, amount, availableBalance) {
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
            const arweaveContract = (await (0, gql_1.getGQLData)({
                ids: null,
                tagFilters: [{ name: config_1.TAGS.keys.uploaderTxId, values: [poolId] }],
                uploader: null,
                cursor: null,
                reduxCursor: null,
                cursorObject: null,
            })).data[0];
            const fetchId = arweaveContract ? arweaveContract.node.id : poolId;
            const { data: contractData } = await this.arweavePost.api.get(`/${fetchId}`);
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
            const result = await warpContract.writeInteraction({ function: 'contribute' }, {
                disableBundling: true,
                transfer: {
                    target: owner,
                    winstonQty: this.arweavePost.ar.arToWinston(amount.toString()),
                },
            });
            if (!result) {
                return { status: false, message: `Pool Contribution Failed` };
            }
            return { status: true, message: `Pool Contribution Failed` };
        }
        catch (error) {
            console.error(error);
            return { status: false, message: `Pool Contribution Failed` };
        }
    }
}
exports.default = ArweaveClient;
