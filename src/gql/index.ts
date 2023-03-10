import { ArweaveClient } from '../clients/arweave';

import { GQLResponseType, TagFilterType, CursorEnum, CursorObjectKeyType } from '../helpers/types';
import { CURSORS, SEARCH, PAGINATOR } from '../helpers/config';
import { unquoteJsonKeys, checkGqlCursor } from '../helpers/utils';

export async function getArcGQLData(args: {
	ids: string[] | null;
	tagFilters: TagFilterType[] | null;
	uploader: string | null;
	cursor: string | null;
	reduxCursor: string | null;
	cursorObject: CursorObjectKeyType;
}): Promise<{ data: GQLResponseType[]; nextCursor: string | null }> {
	const arClient = new ArweaveClient();
	let nextCursor: string | null = null;
	const data: GQLResponseType[] = [];

	if (args.ids && args.ids.length <= 0) {
		return { data: data, nextCursor: nextCursor };
	}

	let ids = args.ids ? JSON.stringify(args.ids) : null;
	let tags = args.tagFilters ? unquoteJsonKeys(args.tagFilters) : null;
	let owners = args.uploader ? JSON.stringify([args.uploader]) : null;

	let cursor = args.cursor ? `"${args.cursor}"` : null;

	if (args.reduxCursor && args.cursorObject && args.cursorObject === CursorEnum.Search) {
		let i: number;
		if (args.cursor && args.cursor !== CURSORS.p1 && args.cursor !== CURSORS.end && !checkGqlCursor(args.cursor)) {
			i = Number(args.cursor.slice(-1));
			cursor = args.cursor;
		} else {
			i = 0;
			cursor = `${SEARCH.cursorPrefix}-${i}`;
		}

		// TODO: reimplement
		// if (store.getState().searchIdsReducer[args.reduxCursor][i]) {
		// 	ids = JSON.stringify(store.getState().searchIdsReducer[args.reduxCursor][i][cursor]);
		// 	nextCursor = JSON.parse(ids).length < PAGINATOR ? CURSORS.end : `${SEARCH.cursorPrefix}-${++i}`;
		// }
	}

	const operation = {
		query: `
                query {
                    transactions(
                        ids: ${ids},
                        tags: ${tags},
                        owners: ${owners},
                        first: ${PAGINATOR}, 
                        after: ${cursor}
                    ){
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
        `,
	};

	const response = await arClient.arweaveGet.api.post('/graphql', operation);
	if (response.data.data) {
		const responseData = response.data.data.transactions.edges;
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

	return { data: data, nextCursor: nextCursor };
}

export * from './artifacts';
export * from './pools';
