export declare namespace Storage {
    const VERSION = "0.2.0";
    const enum DataPersistenceDuration {
        Transient = 0,
        Session = 1,
        AcrossSessions = 2
    }
    interface ICacheExpirationDuration {
        indefinite?: boolean;
        expiryDate?: Date;
    }
    interface IExpiringCacheDuration extends ICacheExpirationDuration {
        indefinite?: boolean;
        expiryDate: Date;
    }
    interface IIndefiniteCacheDuration extends ICacheExpirationDuration {
        indefinite: boolean;
        expiryDate?: Date;
    }
    class ExpiringCacheDuration implements IExpiringCacheDuration {
        expiryDate: Date;
        indefinite: boolean;
        constructor(expiryDate: Date);
    }
    class IndefiniteCacheDuration implements IIndefiniteCacheDuration {
        indefinite: boolean;
        constructor();
    }
    const IS_SESSION_STORAGE_AVAILABLE: boolean;
    interface IKeyValueStorageProfile {
        dataPersistanceDurationCapabilities: DataPersistenceDuration[];
    }
    class ClientStorageProfile implements IKeyValueStorageProfile {
        dataPersistanceDurationCapabilities: DataPersistenceDuration[];
        constructor();
    }
    interface IKeyValueStorage {
        set: ((key: any, val: any) => void);
        get: ((key: any) => any);
    }
    class ClientStorage implements IKeyValueStorage {
        private errorOnFail;
        clientProfile: ClientStorageProfile;
        constructor(errorOnFail?: boolean);
        set(key: any, val: any, dataPersistenceDuration?: DataPersistenceDuration, cacheExpirationDuration?: ICacheExpirationDuration): void;
        get(key: any, dataPersistenceDuration?: DataPersistenceDuration): any | null | undefined;
        forceCacheExpiry(key: any): void;
    }
}
