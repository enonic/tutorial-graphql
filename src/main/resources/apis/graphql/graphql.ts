import type {Request, Response, SseEvent} from '@enonic-types/core';
import {execute} from '/lib/graphql';
import {createSubscriber} from '/lib/graphql-rx';
import type {Publisher, Subscriber} from '/lib/graphql-rx';
import {send} from '/lib/xp/sse';
import graphQLSchema from './schema';

// Objects and numbers survive the trip into `sse.attributes`, but an
// `undefined` value fails at runtime with a NullPointerException — so omit
// the key rather than passing it through when there are no variables.
interface StreamAttributes {
    query: string;
    variables?: unknown;
}

// A subscription resolves to a publisher rather than to data, so it cannot be
// answered with a JSON body. Detecting it up front lets the same endpoint
// answer queries and mutations with JSON and subscriptions with a stream.
const SUBSCRIPTION = /^\s*subscription\b/;

function badRequest(message: string): Response {
    return {
        status: 400,
        contentType: 'application/json',
        body: {
            errors: [{message: message}]
        },
    };
}

export function POST(req: Request): Response {
    const body = JSON.parse(req.body as string) as {query?: string; variables?: unknown};

    if (!body.query) {
        return badRequest('Missing `query` in request body.');
    }

    if (SUBSCRIPTION.test(body.query)) {
        return {
            sse: {
                attributes: body.variables === undefined
                    ? {query: body.query}
                    : {query: body.query, variables: body.variables},
                retry: 5000,
            }
        };
    }

    const result = execute(graphQLSchema, body.query, body.variables);

    if (isPublisher(result.data)) {
        return badRequest('Send a single subscription operation to stream it.');
    }

    return {
        contentType: 'application/json',
        body: result,
    };
}

const subscribers: Record<string, Subscriber> = {};

export function sseEvent(event: SseEvent<StreamAttributes>): void {
    if (event.type === 'open') {
        openSubscription(event.clientId, event.attributes as StreamAttributes);
        return;
    }

    if (event.type === 'close') {
        cancelSubscription(event.clientId);
    }
}

function isPublisher(data: unknown): data is Publisher {
    return !!data && typeof (data as Publisher).subscribe === 'function';
}

function openSubscription(clientId: string, attributes: StreamAttributes): void {
    const result = execute(graphQLSchema, attributes.query, attributes.variables);

    if (!isPublisher(result.data)) {
        send({
            clientId: clientId,
            message: {
                event: 'error',
                data: JSON.stringify({errors: result.errors ?? [{message: 'The document is not a subscription.'}]})
            }
        });
        return;
    }

    const subscriber = createSubscriber({
        onNext: (executionResult) => {
            send({
                clientId: clientId,
                message: {event: 'next', data: JSON.stringify(executionResult)}
            });
        }
    });

    subscribers[clientId] = subscriber;
    result.data.subscribe(subscriber);
}

function cancelSubscription(clientId: string): void {
    const subscriber = subscribers[clientId];
    if (subscriber) {
        delete subscribers[clientId];
        subscriber.cancelSubscription();
    }
}
