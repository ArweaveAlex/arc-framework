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
}

export enum CursorEnum {
	GQL = 'gql',
	Search = 'search',
}

export enum ANSTopicEnum {
	History = 'History',
	Philosophy = 'Philosophy',
	International = 'International',
	Culture = 'Culture',
	Art = 'Art',
	Music = 'Music',
	Faith = 'Faith',
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
	};
};

export type ArcGQLResponseType = { data: GQLResponseType[]; nextCursor: string | null };

export interface ArtifactDetailType {
	artifactId: string | null;
	artifactName: string | null;
	artifactType: ArtifactEnum;
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
}

export interface AssociationDetailType {
	artifacts: ArtifactDetailType[];
	length: number;
}

export type ArtifactArgsType = {
	ids: string[] | null;
	owner: string | null;
	uploader: string | null;
	cursor: string | null;
	reduxCursor: string | null;
};

export type ArtifactResponseType = {
	nextCursor: string | null;
	previousCursor: string | null;
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
	link: string;
	owner: string;
	ownerInfo: string;
	timestamp: string;
	contributors: { [key: string]: string };
	tokens: { [key: string]: string };
	totalContributions: string;
	totalSupply: string;
	balance: string;
	ownerMaintained?: boolean;
	contribPercent?: string;
	topics?: string[];
}

export type PoolIndexType = {
	id: string;
	state: {
		image: string;
		ownerMaintained?: boolean;
		timestamp: string;
		title: string;
		topics?: string[];
		totalContributions: string;
	}
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

export type ContributionResultType = {
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

export type NotificationResponseType = {
	status: number | null;
	message: string | null;
};

export type TableIdType = {
	value: string;
	type: 'poolId' | 'ownerId';
};

export type TagFilterType = { name: string; values: string[] };
export type ContributionType = { timestamp: string; qty: string };
export type PoolFilterType = { title: string; fn: (data: any) => any };
export type CursorObjectKeyType = CursorEnum.GQL | CursorEnum.Search | null;
export type CursorObjectType = { key: CursorObjectKeyType; value: string };
export type SequenceType = { start: number; end: number };

export type ProfileType = {
	handle: string | null;
	avatar: string | null;
	twitter: string | null;
	discord: string | null;
};
