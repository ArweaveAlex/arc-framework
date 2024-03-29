import { ArweaveClient } from '../clients/arweave';
import { CURSORS, PAGINATOR, SEARCH } from '../helpers/config';
import { CursorEnum, CursorObjectKeyType, GQLResponseType, TagFilterType } from '../helpers/types';
import { checkGqlCursor, unquoteJsonKeys } from '../helpers/utils';

export async function getGQLData(args: {
	ids: string[] | null;
	tagFilters: TagFilterType[] | null;
	uploaders: string[] | null;
	cursor: string | null;
	reduxCursor: string | null;
	cursorObject: CursorObjectKeyType;
	useArweavePost?: boolean;
}): Promise<{ data: GQLResponseType[]; count: number; nextCursor: string | null }> {
	// const startTime = new Date();

	const arClient = new ArweaveClient();
	let nextCursor: string | null = null;
	let count: number = 0;
	const data: GQLResponseType[] = [];

	if (args.ids && args.ids.length <= 0) {
		return { data: data, count: count, nextCursor: nextCursor };
	}

	let ids = args.ids ? JSON.stringify(args.ids) : null;
	let tags = args.tagFilters ? unquoteJsonKeys(args.tagFilters) : null;
	let owners = args.uploaders ? JSON.stringify(args.uploaders) : null;

	let cursor = args.cursor ? `"${args.cursor}"` : null;

	if (args.reduxCursor && args.cursorObject && args.cursorObject === CursorEnum.IdGQL) {
		let i: number;
		if (args.cursor && args.cursor !== CURSORS.p1 && args.cursor !== CURSORS.end && !checkGqlCursor(args.cursor)) {
			i = Number(args.cursor.slice(-1));
			cursor = args.cursor;
		} else {
			i = 0;
			cursor = `${SEARCH.cursorPrefix}-${i}`;
		}
	}

	let countQuery: string = '';
	if (!args.useArweavePost && !args.cursor) countQuery = 'count';

	const query = {
		query: `
			query {
				transactions(
					ids: ${ids},
					tags: ${tags},
					owners: ${owners},
					first: ${PAGINATOR}, 
					after: ${cursor}
				){
					${countQuery}
					edges {
						cursor
						node {
							id
							tags {
								name 
								value 
							}
							data {
								size
								type
							}
					}
				}
			}
		}
        `
			.replace(/\s+/g, ' ')
			.trim(),
	};

	const response = args.useArweavePost
		? await arClient.arweavePost.api.post('/graphql', query)
		: await arClient.arweaveGet.api.post('/graphql', query);
	if (response.data.data) {
		const responseData = response.data.data.transactions.edges;

		if (response.data.data.transactions.count) {
			count = response.data.data.transactions.count;
		}

		if (responseData.length > 0) {
			data.push(...responseData);
			if (args.cursorObject && args.cursorObject === CursorEnum.GQL) {
				if (responseData.length < PAGINATOR) {
					nextCursor = CURSORS.end;
				} else {
					nextCursor = responseData[responseData.length - 1].cursor;
				}
			}
		}
	}

	// const endTime = new Date();
	// const responseTime = (endTime.getTime() - startTime.getTime()) / 1000;
	// console.log(`Response Time: ${responseTime}s`);

	return { data: data, count: count, nextCursor: nextCursor };
}

export * from './artifacts';
export * from './pool';
export * from './pools';
export * from './profile';
