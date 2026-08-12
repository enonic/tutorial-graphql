import * as React from 'react';
import {createRoot} from 'react-dom/client';
import {GraphiQL} from 'graphiql';
import {createGraphiQLFetcher} from '@graphiql/toolkit';
import {createClient} from 'graphql-ws';
import 'graphiql/style.css';
import '../styles/playground.css';

const monacoGlobal = globalThis as unknown as {
    MonacoEnvironment: {getWorker(workerId: string, label: string): Worker};
};

monacoGlobal.MonacoEnvironment = {
    getWorker(_workerId: string, label: string): Worker {
        switch (label) {
        case 'json':
            return new Worker(new URL('./json.worker.mjs', import.meta.url), {type: 'module'});
        case 'graphql':
            return new Worker(new URL('./graphql.worker.mjs', import.meta.url), {type: 'module'});
        default:
            return new Worker(new URL('./editor.worker.mjs', import.meta.url), {type: 'module'});
        }
    },
};

const container = document.getElementById('graphiql-container-wrapper');

if (!container) {
    throw new Error('Could not find the element #graphiql-container-wrapper');
}

const handlerUrl = container.dataset.configHandlerUrl;
const eventsUrl = container.dataset.configEventsUrl;

if (!handlerUrl || !eventsUrl) {
    throw new Error('Missing data-config-handler-url or data-config-events-url');
}

const fetcher = createGraphiQLFetcher({
    url: handlerUrl,
    wsClient: createClient(
        {
            url: eventsUrl,
        }),
});

createRoot(container).render(<GraphiQL fetcher={fetcher}/>);
