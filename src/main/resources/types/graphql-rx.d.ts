/**
 * Type definitions for the parts of lib-graphql-rx used by this application.
 * See https://developer.enonic.com/docs/graphql-library
 */
declare global {
    interface XpLibraries {
        '/lib/graphql-rx': typeof import('./graphql-rx');
    }
}

export interface Subscriber {
    cancelSubscription(): void;
}

export interface Publisher {
    subscribe(subscriber: Subscriber): void;
    filter(predicate: (value: unknown) => boolean): Publisher;
}

export interface PublishProcessor extends Publisher {
    onNext(value: unknown): void;
    onError(error: unknown): void;
    onComplete(): void;
}

export declare function createPublishProcessor(): PublishProcessor;
export declare function createSubscriber(params: {onNext?: (event: unknown) => void}): Subscriber;
