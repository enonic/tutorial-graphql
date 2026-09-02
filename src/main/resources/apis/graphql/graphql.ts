import type {Request, Response, SseEvent} from '@enonic-types/core';
import {execute} from '/lib/graphql';
import {createSubscriber} from '/lib/graphql-rx';
import type {Publisher, Subscriber} from '/lib/graphql-rx';
import {send} from '/lib/xp/sse';
import graphQLSchema from './schema';

// Attributes cross into the Java layer, so keep them flat strings: an
// `undefined` or a nested object here fails with a NullPointerException.
interface StreamAttributes {
    query: string;
    variables: string;
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
                attributes: {query: body.query, variables: JSON.stringify(body.variables ?? null)},
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
    const variables = JSON.parse(attributes.variables) as unknown;
    const result = execute(graphQLSchema, attributes.query, variables);

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
