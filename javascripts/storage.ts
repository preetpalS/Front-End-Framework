
// Relies on ./base.ts because this library should be able to take advantage of Turbolinks not reloading page.

namespace FrontEndFramework {
    export namespace Storage {
        export const VERSION = "0.2.0";
        export const enum DataPersistenceDuration { Transient, Session, AcrossSessions }
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
        let is_session_storage_available = true;
        try {
            sessionStorage.setItem("testa890a809", "val");
            sessionStorage.removeItem("testa890a809");
        } catch (_error) {
            is_session_storage_available = false;
        } finally {
            // Nothing to do...
        }
        export const IsSessionStorageAvailable = is_session_storage_available;

        export interface IKeyValueStorageProfile {
            DataPersistanceDurationCapabilities: DataPersistenceDuration[];
        }

        export class ClientStorageProfile implements IKeyValueStorageProfile {
            public DataPersistanceDurationCapabilities: DataPersistenceDuration[];
            constructor() {
                this.DataPersistanceDurationCapabilities = [DataPersistenceDuration.Transient];
                if (FrontEndFramework.TurbolinksAvailable || FrontEndFramework.Storage.IsSessionStorageAvailable) {
                    this.DataPersistanceDurationCapabilities.push(DataPersistenceDuration.Session);
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

            public get(key: any, dataPersistenceDuration?: DataPersistenceDuration): any|null|undefined {
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
                    }
                } catch (e) {
                    if (this.errorOnFail) { throw e; }
                }
                return null;
            }

            public forceCacheExpiry(key: any) { console.error(`Unimplemented Database#forceCacheExpiry: Failed to expire key: ${key}`); throw key; }
        }
    }
}
