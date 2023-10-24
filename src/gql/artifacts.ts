import { ArweaveClient } from '../clients/arweave';
import { ARTIFACT_CONTRACT, CURSORS, DRE_NODE, STORAGE, TAGS } from '../helpers/config';
import { getBalancesEndpoint, getTxEndpoint } from '../helpers/endpoints';
import {
	ArcGQLResponseType,
	ArtifactArgsType,
	ArtifactDetailType,
	ArtifactResponseType,
	AssociationDetailType,
	BalanceType,
	CursorEnum,
	GQLResponseType,
	NotificationResponseType,
	PoolType,
	SequenceType,
	TagFilterType,
	UserArtifactsArgsType,
	UserBalancesType,
} from '../helpers/types';
import { checkGqlCursor, getTagValue } from '../helpers/utils';

import { getPoolById } from './pool';
import { getGQLData } from '.';

export async function getArtifactsByPool(args: ArtifactArgsType): Promise<ArtifactResponseType> {
	let tagFilters: TagFilterType[] = [
		{
			name: TAGS.keys.poolId,
			values: args.ids!,
		},
	];

	if (args.owner) {
		tagFilters.push({
			name: TAGS.keys.initialOwner,
			values: [args.owner],
		});
	}

	const gqlResponse: ArcGQLResponseType = await getGQLData({
		ids: null,
		tagFilters: tagFilters,
		uploaders: args.uploaders,
		cursor: args.cursor,
		reduxCursor: args.reduxCursor,
		cursorObject: CursorEnum.GQL,
		useArweavePost: false,
	});

	return getArtifactsResponseObject(gqlResponse);
}

export async function getArtifactIdsByUser(args: UserArtifactsArgsType): Promise<string[]> {
	try {
		const result: any = await fetch(getBalancesEndpoint(args.walletAddress));
		if (result.status === 200) {
			const balances = ((await result.json()) as UserBalancesType).balances;

			const assetIds = balances
				.filter((balance: BalanceType) => {
					return balance.balance && parseInt(balance.balance) > 0;
				})
				.filter((balance: BalanceType) => {
					return balance.token_name && balance.token_name.includes('Artifact -');
				})
				.map((balance: BalanceType) => {
					return balance.contract_tx_id;
				});

			return assetIds;
		}
	} catch (e: any) {
		console.error(e);
	}
	return [];
}

export async function getArtifactsByUser(args: ArtifactArgsType): Promise<ArtifactResponseType> {
	const result: any = await fetch(getBalancesEndpoint(args.owner));
	if (result.status === 200) {
		const balances = ((await result.json()) as UserBalancesType).balances;

		const assetIds = balances
			.filter((balance: BalanceType) => {
				return balance.balance && parseInt(balance.balance) > 0;
			})
			.filter((balance: BalanceType) => {
				return balance.token_name && balance.token_name.includes('Artifact -');
			})
			.map((balance: BalanceType) => {
				return balance.contract_tx_id;
			});

		console.log(assetIds.length);
	}

	return {
		nextCursor: null,
		previousCursor: null,
		count: 0,
		contracts: [],
	};
}

export async function getArtifactsByIds(args: ArtifactArgsType): Promise<ArtifactResponseType> {
	let cursor: string | null = null;
	if (args.cursor && args.cursor !== CURSORS.p1 && args.cursor !== CURSORS.end && !checkGqlCursor(args.cursor)) {
		cursor = args.cursor;
	}

	const artifacts: ArcGQLResponseType = await getGQLData({
		ids: args.ids,
		tagFilters: null,
		uploaders: args.uploaders,
		cursor: cursor,
		reduxCursor: args.reduxCursor,
		cursorObject: CursorEnum.IdGQL,
		useArweavePost: true,
	});

	return getArtifactsResponseObject(artifacts);
}

export async function getArtifactsByBookmarks(args: ArtifactArgsType): Promise<ArtifactResponseType> {
	const artifacts: ArcGQLResponseType = await getGQLData({
		ids: args.ids,
		tagFilters: null,
		uploaders: null,
		cursor: args.cursor,
		reduxCursor: args.reduxCursor,
		cursorObject: CursorEnum.GQL,
	});

	return getArtifactsResponseObject(artifacts);
}

export async function getArtifactsByAssociation(
	associationId: string,
	sequence: SequenceType
): Promise<AssociationDetailType | null> {
	const artifacts: ArtifactDetailType[] = [];
	const range = Array.from({ length: sequence.end - sequence.start + 1 }, (_, i) => (i + sequence.start).toString());

	if (associationId) {
		const fullThread: ArcGQLResponseType = await getGQLData({
			ids: null,
			tagFilters: [
				{
					name: TAGS.keys.associationId,
					values: [associationId],
				},
			],
			uploaders: null,
			cursor: null,
			reduxCursor: null,
			cursorObject: null,
		});

		const gqlArtifacts: ArcGQLResponseType = await getGQLData({
			ids: null,
			tagFilters: [
				{
					name: TAGS.keys.associationId,
					values: [associationId],
				},
				{
					name: TAGS.keys.associationSequence,
					values: range,
				},
			],
			uploaders: null,
			cursor: null,
			reduxCursor: null,
			cursorObject: null,
		});

		const filteredArtifacts: any[] = [];
		for (let i = 0; i < gqlArtifacts.data.length; i++) {
			const associationSequence = getTagValue(gqlArtifacts.data[i].node.tags, TAGS.keys.associationSequence);
			if (!filteredArtifacts.includes(associationSequence)) {
				filteredArtifacts.push(gqlArtifacts.data[i]);
			}
			if (filteredArtifacts.length === range.length) {
				break;
			}
		}

		for (let i = 0; i < filteredArtifacts.length; i++) {
			const artifact = await getArtifact(gqlArtifacts.data[i]);
			if (artifact) {
				artifacts.push(artifact);
			}
		}

		return {
			artifacts: artifacts,
			length: fullThread.data.length,
		};
	} else {
		return null;
	}
}

export async function getArtifactById(artifactId: string): Promise<ArtifactDetailType | null> {
	const artifact: ArcGQLResponseType = await getGQLData({
		ids: [artifactId],
		tagFilters: null,
		uploaders: null,
		cursor: null,
		reduxCursor: null,
		cursorObject: null,
		useArweavePost: true,
	});

	if (artifact && artifact.data) {
		return await getArtifact(artifact.data[0]);
	} else {
		return null;
	}
}

export async function getArtifact(artifact: GQLResponseType): Promise<ArtifactDetailType | null> {
	if (artifact) {
		const arClient = new ArweaveClient();
		const pool: PoolType | null = await getPoolById(getTagValue(artifact.node.tags, TAGS.keys.poolId));
		const artifactContractSrc = getTagValue(artifact.node.tags, TAGS.keys.contractSrc);

		try {
			const response = await fetch(getTxEndpoint(artifact.node.id));
			const contract = arClient.warpDefault.contract(artifact.node.id);

			let contractOptions: any = {
				allowBigInt: true,
				internalWrites: true,
				unsafeClient: 'skip',
			};
			if (artifactContractSrc === ARTIFACT_CONTRACT.srcTradeable) {
				contractOptions.remoteStateSyncEnabled = true;
				contractOptions.remoteStateSyncSource = DRE_NODE;
			}
			const contractState = (await contract.setEvaluationOptions(contractOptions).readState()).cachedValue.state;
			let artifactOwner: string = getTagValue(artifact.node.tags, TAGS.keys.initialOwner);
			if (contractState && contractState.balances) {
				const balanceOwner = Object.keys(contractState.balances).filter((key) => contractState.balances[key] !== 0)[0];
				if (balanceOwner) artifactOwner = balanceOwner;
			}

			if (response.status === 200 && artifact) {
				try {
					let artifactDetail: ArtifactDetailType = {
						artifactId: artifact.node.id,
						artifactName: getTagValue(artifact.node.tags, TAGS.keys.artifactName),
						artifactType: getTagValue(artifact.node.tags, TAGS.keys.artifactType) as any,
						associationId: getTagValue(artifact.node.tags, TAGS.keys.associationId),
						artifactContractSrc: artifactContractSrc,
						associationSequence: getTagValue(artifact.node.tags, TAGS.keys.associationSequence),
						profileImagePath: getTagValue(artifact.node.tags, TAGS.keys.profileImage),
						owner: artifactOwner,
						ansTitle: getTagValue(artifact.node.tags, TAGS.keys.ansTitle),
						minted: getTagValue(artifact.node.tags, TAGS.keys.dateCreated),
						keywords: getTagValue(artifact.node.tags, TAGS.keys.keywords),
						mediaIds: getTagValue(artifact.node.tags, TAGS.keys.mediaIds),
						childAssets: getTagValue(artifact.node.tags, TAGS.keys.childAssets),
						fileType: getTagValue(artifact.node.tags, TAGS.keys.fileType),
						renderWith: getTagValue(artifact.node.tags, TAGS.keys.renderWith),
						poolName: pool ? pool.state.title : null,
						poolId: pool ? pool.id : null,
						dataUrl: response.url,
						dataSize: artifact ? artifact.node.data.size : null,
						rawData: await response.text(),
					};

					if (contractState && contractState.claimable) {
						artifactDetail.claimable = contractState.claimable;
					}

					return artifactDetail;
				} catch (error: any) {
					console.error(error);
					return null;
				}
			} else {
				return null;
			}
		} catch (error: any) {
			console.error(error);
			return null;
		}
	} else {
		return null;
	}
}

export async function getBookmarkIds(owner: string): Promise<string[]> {
	const gqlData: ArcGQLResponseType = await getGQLData({
		ids: null,
		tagFilters: [{ name: TAGS.keys.bookmarkSearch, values: [owner] }],
		uploaders: null,
		cursor: null,
		reduxCursor: null,
		cursorObject: null,
	});

	if (gqlData.data.length > 0) {
		let recentDate = Number(getTagValue(gqlData.data[0].node.tags, TAGS.keys.dateCreated)!);

		for (let i = 0; i < gqlData.data.length; i++) {
			const date = Number(getTagValue(gqlData.data[i].node.tags, TAGS.keys.dateCreated)!);
			recentDate = Math.max(recentDate, date);
		}

		for (let i = 0; i < gqlData.data.length; i++) {
			if (recentDate === Number(getTagValue(gqlData.data[i].node.tags, TAGS.keys.dateCreated)!)) {
				return JSON.parse(getTagValue(gqlData.data[i].node.tags, TAGS.keys.bookmarkIds)!);
			}
		}

		return [];
	} else {
		return [];
	}
}

export async function setBookmarkIds(owner: string, ids: string[]): Promise<NotificationResponseType> {
	const arClient = new ArweaveClient();
	let txRes = await arClient.arweavePost.createTransaction({ data: JSON.stringify(ids) }, 'use_wallet');

	txRes.addTag(TAGS.keys.bookmarkSearch, owner);
	txRes.addTag(TAGS.keys.dateCreated, Date.now().toString());
	txRes.addTag(TAGS.keys.bookmarkIds, JSON.stringify(ids));

	// @ts-ignore
	const response = await global.window.arweaveWallet.dispatch(txRes);

	return {
		status: response.id ? true : false,
		message: response.id ? `Bookmarks Updated` : `Error Occurred`,
	};
}

function getArtifactsResponseObject(gqlResponse: ArcGQLResponseType): ArtifactResponseType {
	const contracts = gqlResponse.data.filter((element: GQLResponseType) => {
		return getTagValue(element.node.tags, TAGS.keys.uploaderTxId) === STORAGE.none;
	});

	return {
		nextCursor: gqlResponse.nextCursor,
		previousCursor: null,
		count: gqlResponse.count,
		contracts: contracts,
	};
}
