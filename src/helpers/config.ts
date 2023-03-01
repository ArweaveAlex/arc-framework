import { PoolType } from './types';
import * as filters from '../filters';
import { LANGUAGE } from './language';

export const TAGS = {
	keys: {
		alexPoolId: 'Alex-Pool-Id',
		ansTitle: 'Title',
		ansDescription: 'Description',
		ansTopic: 'Topic',
		ansType: 'Type',
		ansImplements: 'Implements',
		appType: 'App-Type',
		artifactName: 'Artifact-Name',
		artifactType: 'Artifact-Type',
		associationId: 'Association-Id',
		associationSequence: 'Association-Sequence',
		childAssets: 'Child-Assets',
		bookmarkIds: 'Bookmark-Ids-Tag',
		bookmarkSearch: 'Alex-Bookmark-Search',
		dateCreated: 'Date-Created',
		keywords: 'Keywords',
		initialOwner: 'Initial-Owner',
		poolId: 'Pool-Id',
		profileImage: 'Profile-Image',
		uploaderTxId: 'Uploader-Tx-Id',
		contractSrc: 'Contract-Src',
		mediaIds: 'Media-Ids',
		timestamp: 'Timestamp',
		collectionName: 'Collection-Name',
		collectionDescription: 'Collection-Description',
	},
	values: {
		defaultArtifactType: 'Alex-Default',
		messagingArtifactType: 'Alex-Messaging',
		nostrEventArtifactType: 'Alex-Nostr-Event',
		redditThreadArtifactType: 'Alex-Reddit-Thread',
		webpageArtifactType: 'Alex-Webpage',
		poolVersions: {
			'1.2': 'Alex-Archiving-Pool-v1.2',
			'1.4': 'Alex-Archiving-Pool-v1.4',
		},
		searchIndex: 'Alex-Search-Index-v0',
		collectionAppType: 'Alex-Collection-v0',
		ansVersion: 'ANS-110',
		ansType: 'token',
	},
};

export const STORAGE = {
	none: 'N/A',
};

export const PAGINATOR = 100;

export const CURSORS = {
	p1: 'P1',
	end: 'END',
};

export const MEDIA_TYPES = {
	mp4: 'mp4',
	jpg: 'jpg',
	jpeg: 'jpeg',
	png: 'png',
};

export const POOL_FILTERS = [
	{
		title: LANGUAGE.pools.gridTitles.mostContributed,
		fn: (data: PoolType[]) => filters.sortByMostContributed(data, null),
	},
	{
		title: LANGUAGE.pools.gridTitles.newest,
		fn: (data: PoolType[]) => filters.sortByNewest(data, null),
	},
	{
		title: LANGUAGE.pools.gridTitles.all,
		fn: (data: PoolType[]) => filters.sortByAll(data, null),
	},
];

export const FALLBACK_IMAGE = '8HqSqy_nNRSTPv-q-j7_iHGTp6lEA5K77TP4BPuXGyA';

export const SEARCH = {
	cursorPrefix: 'searchCursor',
	idTerm: '`*',
	ownerTerm: '`%',
};

export const POOL_INDEX_CONTRACT_ID = 'uafMNNCOG7YyoBQn4cs3ZmE-gU30OQX5d4H3p06hAd8';

export const OPERATOR_LINK = 'https://alex-operator-guide.arweave.dev/';
