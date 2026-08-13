import type {Request, Response, SseEvent} from '@enonic-types/core';
import {execute} from '/lib/graphql';
import {createSubscriber} from '/lib/graphql-rx';
import type {Publisher, Subscriber} from '/lib/graphql-rx';
import {send} from '/lib/xp/sse';
import graphQLSchema from './schema';

interface StreamAttributes {
    query: string;
}

export function POST(req: Request): Response {
    const body = JSON.parse(req.body as string) as {query?: string; variables?: unknown};

    if (!body.query) {
        return {
            status: 400,
            contentType: 'application/json',
            body: {
                errors: [{message: 'Missing `query` in request body.'}]
            },
        };
    }

    const result = execute(graphQLSchema, body.query, body.variables);

    return {
        contentType: 'application/json',
        body: result,
    };
}

export function GET(req: Request): Response {
    const query = req.params.query;

    if (!query) {
        return {
            status: 400,
            contentType: 'application/json',
            body: {
                errors: [{message: 'Missing `query` parameter.'}]
            },
        };
    }

    return {
        sse: {
            attributes: {query: query},
            retry: 5000,
        }
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

function openSubscription(clientId: string, attributes: StreamAttributes): void {
    const result = execute(graphQLSchema, attributes.query);
    const publisher = result.data as Publisher | undefined;

    if (!publisher || typeof publisher.subscribe !== 'function') {
        send({
            clientId: clientId,
            message: {event: 'error', data: JSON.stringify(result)}
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
    publisher.subscribe(subscriber);
}

function cancelSubscription(clientId: string): void {
    const subscriber = subscribers[clientId];
    if (subscriber) {
        delete subscribers[clientId];
        subscriber.cancelSubscription();
    }
}
