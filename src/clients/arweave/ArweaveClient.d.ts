import { ContributionResultType, ContributionType, PoolType } from '../../helpers/types';
import * as Warp from 'warp-contracts';
export default class ArweaveClient {
    arweaveGet: any;
    arweavePost: any;
    warp: Warp.Warp;
    getUserContributions(userWallet: string): Promise<any[]>;
    calcARDonated(userWallet: string, pool: PoolType): string;
    calcReceivingPercent(userWallet: string, pool: PoolType): string | 0;
    calcLastContributions(userWallet: string, pools: PoolType[]): Promise<any>;
    getReceivingPercent(userWallet: string, contributors: any, totalContributions: string, activeAmount: number): string;
    calcContributions(contributions: string | ContributionType[]): string;
    getARAmount(amount: string): number;
    handlePoolContribute(poolId: string, amount: number, availableBalance: number): Promise<ContributionResultType>;
}
