
// Relies on ./base.ts because this library should be able to take advantage of Turbolinks not reloading page.
import Base from "./base";

export namespace Storage {
    export enum DataPersistenceDuration {
        Transient = 0,
        Session = 1,
        AcrossSessions = 2
    }
    export interface ICacheExpirationDuration {
        indefinite?: boolean;
        expiryDate?: Date;
    }

    export interface IExpiringCacheDuration extends ICacheExpirationDuration {
        indefinite?: boolean; // MUST BE `false`
        expiryDate: Date;
    }

    export interface IIndefiniteCacheDuration extends ICacheExpirationDuration {
        indefinite: boolean; // MUST BE `true`
        expiryDate?: Date; //  IGNORED
    }

    export class ExpiringCacheDuration implements IExpiringCacheDuration {
        public indefinite = false;
        constructor(public expiryDate: Date) { }
    }

    export class IndefiniteCacheDuration implements IIndefiniteCacheDuration {
        public indefinite = true;
        // tslint:disable-next-line:no-empty
        constructor() { }
    }

    // This is needed for browsers that say that they have SessionStorage but in reality throw an Error as soon
    // as you try to do something.
    let isSessionStorageAvailable = true;
    try {
        sessionStorage.setItem("testa890a809", "val");
        sessionStorage.removeItem("testa890a809");
    } catch (_error) {
        isSessionStorageAvailable = false;
    } finally {
        // Nothing to do...
    }
    export const IS_SESSION_STORAGE_AVAILABLE = isSessionStorageAvailable;

    export interface IKeyValueStorageProfile {
        dataPersistanceDurationCapabilities: DataPersistenceDuration[];
    }

    export class ClientStorageProfile implements IKeyValueStorageProfile {
        public dataPersistanceDurationCapabilities: DataPersistenceDuration[];
        constructor() {
            this.dataPersistanceDurationCapabilities = [DataPersistenceDuration.Transient];
            if (Base.getInstance().TURBOLINKS_AVAILABLE || Storage.IS_SESSION_STORAGE_AVAILABLE) {
                this.dataPersistanceDurationCapabilities.push(DataPersistenceDuration.Session);
            }
        }
    }

    export interface IKeyValueStorage {
        set: ((key: any, val: any) => void);
        get: ((key: any) => any);
    }
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
    export class ClientStorage implements IKeyValueStorage {
        public clientProfile = new ClientStorageProfile();
        constructor(
            private errorOnFail = false
        ) { }

        public set(key: any,
                   val: any,
                   dataPersistenceDuration = DataPersistenceDuration.Session,
                   cacheExpirationDuration?: ICacheExpirationDuration) {
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
            } catch (e) {
                if (this.errorOnFail) { throw e; }
            }
        }

        public get(key: any, dataPersistenceDuration?: DataPersistenceDuration): any | null | undefined {
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
                } else {
                    // TODO: Review this code
                }
            } catch (e) {
                if (this.errorOnFail) { throw e; }
            }
            return null;
        }

        public forceCacheExpiry(key: any) { console.error(`Unimplemented Database#forceCacheExpiry: Failed to expire key: ${key}`); throw key; }
    }
}
