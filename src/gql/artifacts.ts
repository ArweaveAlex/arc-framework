import { getArcGQLData } from '.';
import { getPoolIds, getPoolById } from './pools';
import { ArweaveClient } from '../clients/arweave';
import { getTagValue, checkGqlCursor } from '../helpers/utils';
import {
	ArcGQLResponseType,
	GQLResponseType,
	ArtifactArgsType,
	ArtifactResponseType,
	NotificationResponseType,
	TagFilterType,
	CursorEnum,
	SequenceType,
	AssociationDetailType,
	ArtifactDetailType,
	PoolType,
} from '../helpers/types';
import { LANGUAGE } from '../helpers/language';
import { getTxEndpoint } from '../helpers/endpoints';
import { TAGS, STORAGE, CURSORS } from '../helpers/config';

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

	const artifacts: ArcGQLResponseType = await getArcGQLData({
		ids: null,
		tagFilters: tagFilters,
		uploader: args.uploader,
		cursor: args.cursor,
		reduxCursor: args.reduxCursor,
		cursorObject: CursorEnum.GQL,
	});

	return getArtifactsResponseObject(artifacts, CursorEnum.GQL, args.reduxCursor);
}

export async function getArtifactsByUser(args: ArtifactArgsType): Promise<ArtifactResponseType> {
	const poolIds = await getPoolIds();

	const artifacts = await getArtifactsByPool({
		ids: poolIds,
		owner: args.owner,
		uploader: null,
		cursor: args.cursor,
		reduxCursor: args.reduxCursor,
	});
	return artifacts;
}

export async function getArtifactsByIds(args: ArtifactArgsType): Promise<ArtifactResponseType> {
	let cursor: string | null = null;
	if (args.cursor && args.cursor !== CURSORS.p1 && args.cursor !== CURSORS.end && !checkGqlCursor(args.cursor)) {
		cursor = args.cursor;
	}

	const artifacts: ArcGQLResponseType = await getArcGQLData({
		ids: args.ids,
		tagFilters: null,
		uploader: args.uploader,
		cursor: cursor,
		reduxCursor: args.reduxCursor,
		cursorObject: CursorEnum.Search,
	});

	return getArtifactsResponseObject(artifacts, CursorEnum.Search, args.reduxCursor);
}

export async function getArtifactsByBookmarks(args: ArtifactArgsType): Promise<ArtifactResponseType> {
	let bookmarkIds: string[];

	// TODO: reimplement
	// const bookmarksReducer = store.getState().bookmarksReducer;

	// if (bookmarksReducer.owner === args.owner) {
	// 	bookmarkIds = bookmarksReducer.ids;
	// } else {
	// 	if (args.owner) {
	// 		bookmarkIds = await getBookmarkIds(args.owner);
	// 	} else {
	// 		bookmarkIds = [];
	// 	}
	// }

	if (args.owner) {
		bookmarkIds = await getBookmarkIds(args.owner);
	} else {
		bookmarkIds = [];
	}

	const artifacts: ArcGQLResponseType = await getArcGQLData({
		ids: bookmarkIds,
		tagFilters: null,
		uploader: null,
		cursor: args.cursor,
		reduxCursor: args.reduxCursor,
		cursorObject: CursorEnum.GQL,
	});

	return getArtifactsResponseObject(artifacts, CursorEnum.GQL, args.reduxCursor);
}

export async function getArtifactsByAssociation(
	associationId: string,
	sequence: SequenceType
): Promise<AssociationDetailType | null> {
	const artifacts: ArtifactDetailType[] = [];
	const range = Array.from({ length: sequence.end - sequence.start + 1 }, (_, i) => (i + sequence.start).toString());

	if (associationId) {
		const fullThread: ArcGQLResponseType = await getArcGQLData({
			ids: null,
			tagFilters: [
				{
					name: TAGS.keys.associationId,
					values: [associationId],
				},
			],
			uploader: null,
			cursor: null,
			reduxCursor: null,
			cursorObject: null,
		});

		const gqlArtifacts: ArcGQLResponseType = await getArcGQLData({
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
			uploader: null,
			cursor: null,
			reduxCursor: null,
			cursorObject: null,
		});

		// TODO: get type
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
	const artifact: ArcGQLResponseType = await getArcGQLData({
		ids: [artifactId],
		tagFilters: null,
		uploader: null,
		cursor: null,
		reduxCursor: null,
		cursorObject: null,
	});

	if (artifact && artifact.data) {
		return await getArtifact(artifact.data[0]);
	} else {
		return null;
	}
}

export async function getArtifact(artifact: GQLResponseType): Promise<ArtifactDetailType | null> {
	let pool: PoolType | null = await getPoolById(getTagValue(artifact.node.tags, TAGS.keys.poolId));

	try {
		const response = await fetch(getTxEndpoint(artifact.node.id));
		if (response.status === 200 && artifact) {
			try {
				return {
					artifactId: artifact.node.id,
					artifactName: getTagValue(artifact.node.tags, TAGS.keys.artifactName),
					artifactType: getTagValue(artifact.node.tags, TAGS.keys.artifactType) as any,
					associationId: getTagValue(artifact.node.tags, TAGS.keys.associationId),
					associationSequence: getTagValue(artifact.node.tags, TAGS.keys.associationSequence),
					profileImagePath: getTagValue(artifact.node.tags, TAGS.keys.profileImage),
					owner: getTagValue(artifact.node.tags, TAGS.keys.initialOwner),
					ansTitle: getTagValue(artifact.node.tags, TAGS.keys.ansTitle),
					minted: getTagValue(artifact.node.tags, TAGS.keys.dateCreated),
					keywords: getTagValue(artifact.node.tags, TAGS.keys.keywords),
					mediaIds: getTagValue(artifact.node.tags, TAGS.keys.mediaIds),
					childAssets: getTagValue(artifact.node.tags, TAGS.keys.childAssets),
					poolName: pool ? pool.state.title : null,
					poolId: pool ? pool.id : null,
					dataUrl: response.url,
					dataSize: artifact ? artifact.node.data.size : null,
					rawData: await response.text(),
				};
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
}

export async function getBookmarkIds(owner: string): Promise<string[]> {
	const gqlData: ArcGQLResponseType = await getArcGQLData({
		ids: null,
		tagFilters: [{ name: TAGS.keys.bookmarkSearch, values: [owner] }],
		uploader: null,
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

	const response = await global.window.arweaveWallet.dispatch(txRes);

	// TODO: reimplement
	// if (response.id) {
	//     store.dispatch(
	//         artifactActions.setBookmark({
	//             owner: owner,
	//             ids: ids,
	//         })
	//     );
	// }

	return {
		status: response.id ? 200 : 500,
		message: response.id ? LANGUAGE.bookmarksUpdated : LANGUAGE.errorOccurred,
	};
}

function getArtifactsResponseObject(
	artifacts: ArcGQLResponseType,
	cursorObject: CursorEnum.GQL | CursorEnum.Search,
	reduxCursor: string | null
) {
	// TODO: reimplement
	// let cursorState: any;
	// if (reduxCursor) {
	// 	cursorState = store.getState().cursorsReducer.search[reduxCursor];
	// }

	// let nextCursor: string | null = cursorState ? cursorState.next : null;
	// let previousCursor: string | null = cursorState ? cursorState.previous : null;

	console.log(cursorObject);
	console.log(reduxCursor);

	const contracts = artifacts.data.filter((element: GQLResponseType) => {
		return getTagValue(element.node.tags, TAGS.keys.uploaderTxId) === STORAGE.none;
	});

	return {
		nextCursor: null,
		previousCursor: null,
		contracts: contracts,
	};
}
