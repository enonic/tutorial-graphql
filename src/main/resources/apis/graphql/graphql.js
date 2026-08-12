const portalLib = require('/lib/xp/portal');
const graphQlLib = require('/lib/graphql');
const mustacheLib = require('/lib/mustache');
const staticLib = require('/lib/enonic/static');
const router = require('/lib/router')();
const graphQLSchema = require('./schema');
const webSocketLib = require('/lib/xp/websocket');
const graphQlRxLib = require('/lib/graphql-rx');

exports.all = function (req) {
    return router.dispatch(req);
};

router.get(`/_static/{path:.*}`, (req) => {
    return staticLib.requestHandler(
        req,
        {
            cacheControl: () => staticLib.RESPONSE_CACHE_CONTROL.SAFE,
            index: false,
            root: '/assets',
            relativePath: staticLib.mappedRelativePath('/_static/'),
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

router.get('/?', (req) => {
    const view = resolve('graphql.html');

    const apiUrl = portalLib.apiUrl({
        api: 'graphql'
    });

    const eventsUrl = portalLib.apiUrl({
        api: 'graphql',
        type: 'websocket'
    });

    const params = {
        handlerUrl: apiUrl,
        eventsUrl: `${eventsUrl}/events`,
        playgroundCss: `${apiUrl}/_static/styles/playground.css`,
        playgroundScript: `${apiUrl}/_static/js/playground.js`,
    };

    return {
        status: 200,
        contentType: 'text/html',
        body: mustacheLib.render(view, params)
    };
});

router.post('/?', (req) => {
    const body = JSON.parse(req.body);

    if (!body.query) {
        return {
            status: 400,
            contentType: 'application/json',
            body: {
                errors: [{message: 'Missing `query` in request body.'}]
            },
        };
    }

    const result = graphQlLib.execute(graphQLSchema, body.query, body.variables);
    return {
        contentType: 'application/json',
        body: result,
    };
});

exports.webSocketEvent = function (socketEvent) {
    if (!socketEvent) {
        return;
    }

    if (socketEvent.type === 'close') {
        cancelSessionSubscriptions(socketEvent.session.id);
        return;
    }

    if (socketEvent.type === 'message') {
        const message = JSON.parse(socketEvent.message);
        const sessionId = socketEvent.session.id;
        if (message.type === 'connection_init') {
            webSocketLib.send(sessionId, JSON.stringify({
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
};

const graphQlSubscribers = {};

function subscriberKey(sessionId, operationId) {
    return `${sessionId}|${operationId}`;
}

function handleSubscribeMessage(sessionId, message) {
    const payload = message.payload;

    const result = graphQlLib.execute(graphQLSchema, payload.query, payload.variables);

    if (result.data && typeof result.data.subscribe === 'function') {
        cancelSubscription(sessionId, message.id);

        const subscriber = graphQlRxLib.createSubscriber({
            onNext: (payload) => {
                webSocketLib.send(sessionId, JSON.stringify({
                    type: 'next',
                    id: message.id,
                    payload: payload,
                }));
            }
        });
        graphQlSubscribers[subscriberKey(sessionId, message.id)] = subscriber;
        result.data.subscribe(subscriber);
    }
}

function cancelSubscription(sessionId, operationId) {
    const key = subscriberKey(sessionId, operationId);
    const subscriber = graphQlSubscribers[key];
    if (subscriber) {
        delete graphQlSubscribers[key];
        subscriber.cancelSubscription();
    }
}

function cancelSessionSubscriptions(sessionId) {
    const prefix = `${sessionId}|`;
    Object.keys(graphQlSubscribers)
        .filter((key) => key.indexOf(prefix) === 0)
        .forEach((key) => {
            const subscriber = graphQlSubscribers[key];
            delete graphQlSubscribers[key];
            subscriber.cancelSubscription();
        });
}
