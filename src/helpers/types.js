"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CursorEnum = exports.ArtifactEnum = void 0;
var ArtifactEnum;
(function (ArtifactEnum) {
    ArtifactEnum["Messaging"] = "Alex-Messaging";
    ArtifactEnum["Webpage"] = "Alex-Webpage";
    ArtifactEnum["Reddit"] = "Alex-Reddit-Thread";
    ArtifactEnum["Nostr"] = "Alex-Nostr-Event";
})(ArtifactEnum = exports.ArtifactEnum || (exports.ArtifactEnum = {}));
var CursorEnum;
(function (CursorEnum) {
    CursorEnum["GQL"] = "gql";
    CursorEnum["Search"] = "search";
})(CursorEnum = exports.CursorEnum || (exports.CursorEnum = {}));
