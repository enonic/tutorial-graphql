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

export declare function newCache<T>(params: {size: number; expire: number}): Cache<T>;
