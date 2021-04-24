"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Relies on ./base.ts because this library should be able to take advantage of Turbolinks not reloading page.
var base_1 = require("./base");
var Storage;
(function (Storage) {
    var DataPersistenceDuration;
    (function (DataPersistenceDuration) {
        DataPersistenceDuration[DataPersistenceDuration["Transient"] = 0] = "Transient";
        DataPersistenceDuration[DataPersistenceDuration["Session"] = 1] = "Session";
        DataPersistenceDuration[DataPersistenceDuration["AcrossSessions"] = 2] = "AcrossSessions";
    })(DataPersistenceDuration = Storage.DataPersistenceDuration || (Storage.DataPersistenceDuration = {}));
    var ExpiringCacheDuration = /** @class */ (function () {
        function ExpiringCacheDuration(expiryDate) {
            this.expiryDate = expiryDate;
            this.indefinite = false;
        }
        return ExpiringCacheDuration;
    }());
    Storage.ExpiringCacheDuration = ExpiringCacheDuration;
    var IndefiniteCacheDuration = /** @class */ (function () {
        // tslint:disable-next-line:no-empty
        function IndefiniteCacheDuration() {
            this.indefinite = true;
        }
        return IndefiniteCacheDuration;
    }());
    Storage.IndefiniteCacheDuration = IndefiniteCacheDuration;
    // This is needed for browsers that say that they have SessionStorage but in reality throw an Error as soon
    // as you try to do something.
    var isSessionStorageAvailable = true;
    try {
        sessionStorage.setItem("testa890a809", "val");
        sessionStorage.removeItem("testa890a809");
    }
    catch (_error) {
        isSessionStorageAvailable = false;
    }
    finally {
        // Nothing to do...
    }
    Storage.IS_SESSION_STORAGE_AVAILABLE = isSessionStorageAvailable;
    var ClientStorageProfile = /** @class */ (function () {
        function ClientStorageProfile() {
            this.dataPersistanceDurationCapabilities = [DataPersistenceDuration.Transient];
            if (base_1.default.getInstance().TURBOLINKS_AVAILABLE || Storage.IS_SESSION_STORAGE_AVAILABLE) {
                this.dataPersistanceDurationCapabilities.push(DataPersistenceDuration.Session);
            }
        }
        return ClientStorageProfile;
    }());
    Storage.ClientStorageProfile = ClientStorageProfile;
    /*
    export class TransientStorage implements IKeyValueStorage {
        constructor() {
        }

        set(key:any, val:any) : void => {
        }

        get(key:any) : any => {
        }
    }
    */
    var ClientStorage = /** @class */ (function () {
        function ClientStorage(errorOnFail) {
            if (errorOnFail === void 0) { errorOnFail = false; }
            this.errorOnFail = errorOnFail;
            this.clientProfile = new ClientStorageProfile();
        }
        ClientStorage.prototype.set = function (key, val, dataPersistenceDuration, cacheExpirationDuration) {
            if (dataPersistenceDuration === void 0) { dataPersistenceDuration = DataPersistenceDuration.Session; }
            try {
                // TODO: Remove upon adding support for DataPersistenceDuration.AcrossSessions
                if (cacheExpirationDuration != null) {
                    console.error("cacheExpirationDuration ignored in Database#set.");
                }
                switch (dataPersistenceDuration) {
                    case DataPersistenceDuration.Transient:
                        break;
                    case DataPersistenceDuration.Session:
                        sessionStorage.setItem(key, val);
                        break;
                    case DataPersistenceDuration.AcrossSessions:
                        break;
                    default:
                        break;
                }
            }
            catch (e) {
                if (this.errorOnFail) {
                    throw e;
                }
            }
        };
        ClientStorage.prototype.get = function (key, dataPersistenceDuration) {
            try {
                if (dataPersistenceDuration != null) {
                    switch (dataPersistenceDuration) {
                        case DataPersistenceDuration.Transient:
                            break;
                        case DataPersistenceDuration.Session:
                            return sessionStorage.getItem(key);
                        case DataPersistenceDuration.AcrossSessions:
                            break;
                        default:
                            break;
                    }
                }
                else {
                    // TODO: Review this code
                }
            }
            catch (e) {
                if (this.errorOnFail) {
                    throw e;
                }
            }
            return null;
        };
        ClientStorage.prototype.forceCacheExpiry = function (key) { console.error("Unimplemented Database#forceCacheExpiry: Failed to expire key: " + key); throw key; };
        return ClientStorage;
    }());
    Storage.ClientStorage = ClientStorage;
})(Storage = exports.Storage || (exports.Storage = {}));
//# sourceMappingURL=storage.js.map