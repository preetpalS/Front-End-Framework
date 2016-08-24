/// <reference path="./base.js.ts"/>

// Relies on ./base.js.ts because this library should be able to take advantage of Turbolinks not reloading page.

namespace FrontEndFramework {
    export namespace Storage {
        export const VERSION = '0.0.1';
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
            constructor() { }
        }

        // This is needed for browsers that say that they have SessionStorage but in reality throw an Error as soon
        // as you try to do something.
        let is_session_storage_available = true;
        try {
            sessionStorage.setItem('testa890a809', 'val');
            sessionStorage.removeItem('testa890a809');
        } catch (_error) {
            is_session_storage_available = false;
        } finally {
            // Nothing to do...
        }
        export const IsSessionStorageAvailable = is_session_storage_available;

        export class ClientProfile {
            public DataPersistanceDurationCapabilities: Array<DataPersistenceDuration>;
            constructor() {
                this.DataPersistanceDurationCapabilities = [DataPersistenceDuration.Transient];
                if (FrontEndFramework.TurbolinksAvailable || FrontEndFramework.Storage.IsSessionStorageAvailable)
                    this.DataPersistanceDurationCapabilities.push(DataPersistenceDuration.Session);
            }
        }

        export class Database {
            public clientProfile = new ClientProfile();
            constructor(
                private errorOnFail = false
            ) { }

            public set(key: any,
                       val: any,
                       dataPersistenceDuration = DataPersistenceDuration.Session,
                       cacheExpirationDuration?: ICacheExpirationDuration) {
                try {
                    switch(dataPersistenceDuration) {
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
                    if (this.errorOnFail) throw e;
                }
            }

            public get(key: any, dataPersistenceDuration?: DataPersistenceDuration) : string {
                try {
                    if (dataPersistenceDuration != null) {
                        switch(dataPersistenceDuration) {
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
                    if (this.errorOnFail) throw e;
                }
            }

            public forceCacheExpiry(key: any) { }
        }
    }
}
