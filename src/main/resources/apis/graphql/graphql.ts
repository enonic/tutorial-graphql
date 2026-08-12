import type {Request, Response} from '@enonic-types/core';
import {apiUrl} from '/lib/xp/portal';
import {execute} from '/lib/graphql';
import {createSubscriber} from '/lib/graphql-rx';
import type {Subscriber} from '/lib/graphql-rx';
import {render} from '/lib/mustache';
import {mappedRelativePath, requestHandler, RESPONSE_CACHE_CONTROL} from '/lib/enonic/static';
import {send as webSocketSend} from '/lib/xp/websocket';
import newRouter from '/lib/router';
import graphQLSchema from './schema';

const router = newRouter();

export function all(req: Request): Response {
    return router.dispatch(req);
}

router.get('/_static/{path:.*}', (req) => {
    return requestHandler(
        req,
        {
            cacheControl: () => RESPONSE_CACHE_CONTROL.SAFE,
            index: false,
            root: '/static',
            relativePath: mappedRelativePath('/_static/'),
        }
    );
});

router.get('/events', (req) => {
    if (!req.webSocket) {
        return {
            status: 404
        };
    }
    return {
        webSocket: {
            subProtocols: ['graphql-transport-ws']
        }
    };
});

router.get('/?', () => {
    const view = resolve('graphql.html');

    const handlerUrl = apiUrl({
        api: 'graphql'
    });

    const eventsUrl = apiUrl({
        api: 'graphql',
        type: 'websocket'
    });

    const params = {
        handlerUrl: handlerUrl,
        eventsUrl: `${eventsUrl}/events`,
        playgroundCss: `${handlerUrl}/_static/style.css`,
        playgroundScript: `${handlerUrl}/_static/js/playground.mjs`,
    };

    return {
        status: 200,
        contentType: 'text/html',
        body: render(view, params)
    };
});

router.post('/?', (req) => {
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
});

interface WebSocketEvent {
    type: string;
    message?: string;
    session: {id: string};
}

interface SubscribeMessage {
    type: string;
    id: string;
    payload: {query: string; variables?: unknown};
}

const graphQlSubscribers: Record<string, Subscriber> = {};

function subscriberKey(sessionId: string, operationId: string): string {
    return `${sessionId}|${operationId}`;
}

function handleSubscribeMessage(sessionId: string, message: SubscribeMessage): void {
    const payload = message.payload;

    const result = execute(graphQLSchema, payload.query, payload.variables);
    const data = result.data as {subscribe?: (subscriber: Subscriber) => void} | undefined;

    if (data && typeof data.subscribe === 'function') {
        cancelSubscription(sessionId, message.id);

        const subscriber = createSubscriber({
            onNext: (event) => {
                webSocketSend(sessionId, JSON.stringify({
                    type: 'next',
                    id: message.id,
                    payload: event,
                }));
            }
        });
        graphQlSubscribers[subscriberKey(sessionId, message.id)] = subscriber;
        data.subscribe(subscriber);
    }
}

function cancelSubscription(sessionId: string, operationId: string): void {
    const key = subscriberKey(sessionId, operationId);
    const subscriber = graphQlSubscribers[key];
    if (subscriber) {
        delete graphQlSubscribers[key];
        subscriber.cancelSubscription();
    }
}

function cancelSessionSubscriptions(sessionId: string): void {
    const prefix = `${sessionId}|`;
    Object.keys(graphQlSubscribers)
        .filter((key) => key.indexOf(prefix) === 0)
        .forEach((key) => {
            const subscriber = graphQlSubscribers[key];
            delete graphQlSubscribers[key];
            subscriber.cancelSubscription();
        });
}

export function webSocketEvent(socketEvent: WebSocketEvent): void {
    if (!socketEvent) {
        return;
    }

    if (socketEvent.type === 'close') {
        cancelSessionSubscriptions(socketEvent.session.id);
        return;
    }

    if (socketEvent.type === 'message') {
        const message = JSON.parse(socketEvent.message as string) as SubscribeMessage;
        const sessionId = socketEvent.session.id;
        if (message.type === 'connection_init') {
            webSocketSend(sessionId, JSON.stringify({
                type: 'connection_ack'
            }));
        } else if (message.type === 'subscribe') {
            handleSubscribeMessage(sessionId, message);
        } else if (message.type === 'complete') {
            cancelSubscription(sessionId, message.id);
        } else {
            log.debug(`Unknown message type ${message.type}`);
        }
    }
}
