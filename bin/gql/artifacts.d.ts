import {
	ArtifactArgsType,
	ArtifactDetailType,
	ArtifactResponseType,
	AssociationDetailType,
	GQLResponseType,
	NotificationResponseType,
	SequenceType,
} from '../helpers/types';
export declare function getArtifactsByPool(args: ArtifactArgsType): Promise<ArtifactResponseType>;
export declare function getArtifactsByUser(args: ArtifactArgsType): Promise<ArtifactResponseType>;
export declare function getArtifactsByIds(args: ArtifactArgsType): Promise<ArtifactResponseType>;
export declare function getArtifactsByBookmarks(args: ArtifactArgsType): Promise<ArtifactResponseType>;
export declare function getArtifactsByAssociation(
	associationId: string,
	sequence: SequenceType
): Promise<AssociationDetailType | null>;
export declare function getArtifactById(artifactId: string): Promise<ArtifactDetailType | null>;
export declare function getArtifact(artifact: GQLResponseType): Promise<ArtifactDetailType | null>;
export declare function getBookmarkIds(owner: string): Promise<string[]>;
export declare function setBookmarkIds(owner: string, ids: string[]): Promise<NotificationResponseType>;
