import { ArtifactEnum } from './types';

export const POOL_INDEX_CONTRACT_ID = 'D0OZN4o0aF6msGNAaKaKpuaR4_duptorZWfq2s-XINQ';

export const TAGS = {
	keys: {
		alexPoolId: 'Alex-Pool-Id',
		ansTitle: 'Title',
		ansDescription: 'Description',
		ansTopic: 'Topic',
		ansType: 'Type',
		ansImplements: 'Implements',
		application: 'Application',
		appName: 'App-Name',
		appType: 'App-Type',
		appVersion: 'App-Version',
		artifactName: 'Artifact-Name',
		artifactSeries: 'Artifact-Series',
		artifactType: 'Artifact-Type',
		associationId: 'Association-Id',
		associationSequence: 'Association-Sequence',
		childAssets: 'Child-Assets',
		bookmarkIds: 'Bookmark-Ids-Tag',
		bookmarkSearch: 'Alex-Bookmark-Search',
		dataProtocol: 'Data-Protocol',
		dateCreated: 'Date-Created',
		description: 'Description',
		fileType: `File-Type`,
		keywords: 'Keywords',
		implements: 'Implements',
		initialOwner: 'Initial-Owner',
		initState: 'Init-State',
		license: 'License',
		poolId: 'Pool-Id',
		poolName: 'Pool-Name',
		profileImage: 'Profile-Image',
		protocolName: 'Protocol-Name',
		uploaderTxId: 'Uploader-Tx-Id',
		contractSrc: 'Contract-Src',
		contentType: 'Content-Type',
		mediaIds: 'Media-Ids',
		tweetId: 'Tweet-ID',
		redditPostId: 'Reddit-Post-ID',
		nostrEventId: 'Nostr-Event-ID',
		timestamp: 'Timestamp',
		title: 'Title',
		topic: (topic: string) => `Topic:${topic}`,
		type: 'Type',
		collectionName: 'Collection-Name',
		collectionDescription: 'Collection-Description',
		renderWith: 'Render-With',
	},
	values: {
		ansTypes: {
			socialPost: 'social-post',
			webPage: 'web-page',
			image: 'image',
			video: 'video',
			music: 'music',
			document: 'document',
			file: 'file',
			collection: 'collection',
		},
		audioArtifactType: 'Alex-Audio',
		application: 'Alex.',
		appName: 'SmartWeaveContract',
		appVersion: '0.3.0',
		defaultArtifactType: 'Alex-Default',
		documentArtifactType: 'Alex-Document',
		ebookArtifactType: 'Alex-Ebook',
		imageArtifactType: 'Alex-Image',
		initState: {
			name: (name: string) => `Artifact - ${name}`,
			ticker: (assetId: string) => `ATOMIC-ASSET-${assetId}`,
			title: (name: string) => `Alex Artifact - ${name}`,
		},
		license: 'x5UYiin_eRB0XCpZAkpduL0JIaXAUe9Bi2-RXGloBQI',
		messagingArtifactType: 'Alex-Messaging',
		nostrEventArtifactType: 'Alex-Nostr-Event',
		redditThreadArtifactType: 'Alex-Reddit-Thread',
		webpageArtifactType: 'Alex-Webpage',
		videoArtifactType: 'Alex-Video',
		profileVersions: {
			'0.2': 'Account-0.2',
			'0.3': 'Account-0.3',
		},
		poolVersions: {
			'1.2': 'Alex-Archiving-Pool-v1.2',
			'1.4': 'Alex-Archiving-Pool-v1.4',
			'1.5': 'Alex-Archiving-Pool-v1.5',
		},
		searchIndex: 'Alex-Search-Index-v1.0',
		collectionAppType: 'Alex-Collection-v1.0',
		poolIndex: 'Alex-Pool-Index-v1.0',
		ansVersion: 'ANS-110',
		ansType: 'token',
	},
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

export const SEARCH = {
	cursorPrefix: 'searchCursor',
	idTerm: '`*',
	ownerTerm: '`%',
};

export const FALLBACK_IMAGE = '8HqSqy_nNRSTPv-q-j7_iHGTp6lEA5K77TP4BPuXGyA';

export const STORAGE = {
	none: 'N/A',
};

export const RENDER_WITH_VALUES = ['alex-renderers'];

export const DEFAULT_NOSTR_RELAYS = [
	{ socket: 'wss://relay.damus.io' },
	{ socket: 'wss://nos.lol' },
	{ socket: 'wss://nostr.relayer.se' },
	{ socket: 'wss://relay.current.fyi' },
	{ socket: 'wss://nostr.bitcoiner.social' },
	{ socket: 'wss://relay.nostr.info' },
	{ socket: 'wss://nostr.fmt.wiz.biz' },
];

export const DEFAULT_POOLS_JSON = {
	appType: TAGS.values.poolVersions['1.5'],
	contracts: {
		nft: {
			id: '',
			src: '',
		},
		pool: {
			id: '',
			src: '',
		},
	},
	state: {
		owner: {
			pubkey: '',
			info: '',
		},
		controller: {
			pubkey: '',
			contribPercent: 0,
		},
		title: 'Pool Title such as Russia Ukraine War',
		description: 'Paragraph/html markup for long pool description on site',
		briefDescription: 'Text for short pool description on site',
		image: '',
		timestamp: '',
		ownerMaintained: false,
	},
	walletPath: '',
	walletKey: null,
	keywords: ['keyword1'],
	twitterApiKeys: {
		consumer_key: '',
		consumer_secret: '',
		token: '',
		token_secret: '',
		bearer_token: '',
	},
	clarifaiApiKey: '',
	topics: ['History'],
	redditApiKeys: {
		username: '',
		password: '',
		appId: '',
		appSecret: '',
	},
	nostr: {
		relays: DEFAULT_NOSTR_RELAYS,
	},
};

export const TESTING_APP_TYPE = 'Alex-Archiving-Pool-Thread-Testing-v1.0';

export const CONTENT_TYPES = {
	arweaveManifest: 'application/x.arweave-manifest+json',
	json: 'application/json',
	octetStream: 'application/octet-stream',
	textHtml: 'text/html',
};

export const ARTIFACT_TYPES_BY_FILE: { [ext: string]: ArtifactEnum } = {
	// Images
	jpg: ArtifactEnum.Image,
	jpeg: ArtifactEnum.Image,
	png: ArtifactEnum.Image,
	gif: ArtifactEnum.Image,
	bmp: ArtifactEnum.Image,
	tiff: ArtifactEnum.Image,
	svg: ArtifactEnum.Image,
	webp: ArtifactEnum.Image,
	// Documents
	pdf: ArtifactEnum.Document,
	txt: ArtifactEnum.Document,
	csv: ArtifactEnum.Document,
	doc: ArtifactEnum.Document,
	docx: ArtifactEnum.Document,
	xls: ArtifactEnum.Document,
	xlsx: ArtifactEnum.Document,
	ppt: ArtifactEnum.Document,
	pptx: ArtifactEnum.Document,
	rtf: ArtifactEnum.Document,
	// Audio
	mp3: ArtifactEnum.Audio,
	m4a: ArtifactEnum.Audio,
	wav: ArtifactEnum.Audio,
	ogg: ArtifactEnum.Audio,
	flac: ArtifactEnum.Audio,
	// Video
	mp4: ArtifactEnum.Video,
	mpg: ArtifactEnum.Video,
	avi: ArtifactEnum.Video,
	wmv: ArtifactEnum.Video,
	mov: ArtifactEnum.Video,
	mkv: ArtifactEnum.Video,
	// Ebooks
	epub: ArtifactEnum.Ebook,
};

export const BUNDLR_NODE = 'https://node2.bundlr.network';
export const BUNDLR_CURRENCY = "arweave";
