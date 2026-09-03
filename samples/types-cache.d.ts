declare global {
    interface XpLibraries {
        '/lib/cache': typeof import('./cache');
    }
}

export interface Cache<T> {
    get(key: string, fetcher: () => T): T;
    getIfPresent(key: string): T | null;
    put(key: string, value: T): void;
    remove(key: string): void;
    removePattern(keyRegex: string): void;
    clear(): void;
    getSize(): number;
}

export interface CacheParams {
    /** Names the cache, making it application-wide and shared by every script context. */
    name?: string;
    size?: number;
    expire?: number;
}

export declare function newCache<T>(params: CacheParams): Cache<T>;
