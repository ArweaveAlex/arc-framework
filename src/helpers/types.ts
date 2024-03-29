import { Contract } from 'warp-contracts';

import { ArweaveClient } from '../clients';

export enum ArtifactEnum {
	Image = 'Alex-Image',
	Messaging = 'Alex-Messaging',
	Nostr = 'Alex-Nostr-Event',
	Reddit = 'Alex-Reddit-Thread',
	Webpage = 'Alex-Webpage',
	Document = 'Alex-Document',
	Audio = 'Alex-Audio',
	Video = 'Alex-Video',
	Ebook = 'Alex-Ebook',
	File = 'Alex-File',
	NewsArticle = 'Alex-News-Article',
}

export enum CursorEnum {
	GQL = 'gql',
	IdGQL = 'idGql',
}

export enum ANSTopicEnum {
	History = 'History',
	Philosophy = 'Philosophy',
	International = 'International',
	Culture = 'Culture',
	Art = 'Art',
	Music = 'Music',
	News = 'News',
	Faith = 'Faith',
	Science = 'Science',
	Spirituality = 'Spirituality',
	Sports = 'Sports',
	Business = 'Business',
	Technology = 'Technology',
	Politics = 'Politics',
	Other = 'Other',
}

export type GQLResponseType = {
	cursor: string | null;
	node: {
		id: string;
		tags: { [key: string]: any }[];
		data: {
			size: string;
			type: string;
		};
		owner?: {
			address: string;
		};
	};
};

export type ArcGQLResponseType = { data: GQLResponseType[]; count: number; nextCursor: string | null };

export interface ArtifactDetailType {
	artifactId: string | null;
	artifactName: string | null;
	artifactType: ArtifactEnum;
	artifactContractSrc: string | null;
	associationId: string | null;
	associationSequence: string | null;
	profileImagePath: string | null;
	owner: string | null;
	ansTitle: string | null;
	minted: string | null;
	keywords: string | null;
	poolName: string | null;
	mediaIds: string | null;
	childAssets: string | null;
	fileType: string | null;
	renderWith: string | null;
	poolId: string | null;
	dataUrl: string | null;
	dataSize: string | null;
	rawData: string | null;
	claimable?: any[];
	originalUrl: string | null;
}

export interface AssociationDetailType {
	artifacts: ArtifactDetailType[];
	length: number;
}

export type ArtifactArgsType = {
	ids: string[] | null;
	owner: string | null;
	uploaders: string[] | null;
	cursor: string | null;
	reduxCursor: string | null;
};

export type ArtifactResponseType = {
	nextCursor: string | null;
	previousCursor: string | null;
	count: number;
	contracts: GQLResponseType[];
};

export interface PoolType {
	id: string;
	state: PoolStateType;
}

export interface PoolStateType {
	title: string;
	image: string;
	briefDescription: string;
	description: string;
	owner: string;
	ownerInfo: string;
	timestamp: string;
	contributors: { [key: string]: string };
	tokens: { [key: string]: string };
	totalContributions: string;
	totalSupply: string;
	balance: string;
	ownerMaintained?: boolean;
	artifactContractSrc?: string;
	controlPubkey?: string;
	contribPercent?: string;
	canEvolve?: boolean;
	topics?: string[];
	keywords?: string[];
	usedFunds?: string;
	tradeable?: boolean;
}

export type PoolBalancesType = {
	totalBalance: number;
	arweaveBalance: number;
	bundlrBalance: number;
	usedFunds: number;
	userBalance: number;
	poolBalance: number;
	transferBalance: number;
};

export type PoolAdditionalPropsType = PoolType & {
	totalContributed?: string;
	lastContribution?: number;
	receivingPercent?: string;
};

export type PoolIndexType = {
	id: string;
	state: {
		image: string;
		ownerMaintained?: boolean;
		timestamp: string;
		title: string;
		topics?: string[];
		totalContributions: string;
	};
};

export interface CollectionType {
	id: string;
	state: CollectionStateType;
}

export interface CollectionStateType {
	ids: string[];
	title: string;
	topic: string;
	name: string;
	ticker: string;
	balances: any;
	maxSupply: number;
	transferable: boolean;
	owner: string;
	phase: string;
	description: string;
	timestamp: string;
	lockTime: number;
	lastTransferTimestamp: string;
}

export interface PoolSearchIndexType {
	id: string;
	state: PoolSearchIndexStateType;
}

export interface PoolSearchIndexStateType {
	canEvolve: boolean;
	owner: string;
	searchIndeces: string[];
}

export type NotificationResponseType = {
	status: boolean;
	message: string | null;
};

export type DateType = 'iso' | 'epoch';

export type CursorType = {
	next: string | null;
	previous: string | null;
};

export type ValidationType = {
	status: boolean;
	message: string | null;
};

export type TableIdType = {
	value: string;
	type: 'poolId' | 'ownerId';
};

export type TagFilterType = { name: string; values: string[] };
export type ContributionType = { timestamp: string; qty: string };
export type PoolFilterType = { title: string; fn: (data: any) => any };
export type CursorObjectKeyType = CursorEnum.GQL | CursorEnum.IdGQL | null;
export type CursorObjectType = { key: CursorObjectKeyType; value: string };
export type SequenceType = { start: number; end: number };

export type ProfileType = {
	handle: string | null;
	avatar: string | null;
	twitter: string | null;
	discord: string | null;
	walletAddress?: string;
};

export type PoolConfigType = {
	appType: string;
	tradeable: boolean;
	contracts: {
		pool: {
			id: NStringType;
			src: NStringType;
		};
	};
	state: {
		owner: {
			pubkey: string;
			info: string;
		};
		controller: {
			pubkey: NStringType;
			contribPercent: number | null;
		};
		title: string;
		description: string;
		briefDescription: string;
		image: NStringType;
		timestamp: NStringType;
		ownerMaintained?: boolean;
		keywords?: string[];
	};
	walletPath?: string;
	walletKey: any;
	keywords: string[];
	topics: string[];
	twitterApiKeys: any;
	clarifaiApiKey: string;
	newsApiKey: string;
	gNewsApiKey: string;
	redditApiKeys: any;
	nostr: {
		relays: NostrRelayType[];
	};
};

export type NostrRelayType = { socket: string };

type NStringType = string | null;
export type KeyValueType = { [key: string]: string };

export interface PoolType {
	id: string;
	state: PoolStateType;
}

export interface IPoolClient {
	arClient: ArweaveClient;
	poolConfig: PoolConfigType;
	walletKey: string | null;
	contract: Contract;
}

export type PagingType = {
	limit: number;
	items: number;
	page: number;
};

export type BalanceType = {
	contract_tx_id: string;
	token_ticker: string;
	token_name: string;
	balance: string;
	sort_key: string;
};

export type UserBalancesType = {
	paging: PagingType;
	balances: BalanceType[];
};

export type UserArtifactsArgsType = {
	walletAddress: string;
	fetchType: 'all' | 'bookmarks';
};
