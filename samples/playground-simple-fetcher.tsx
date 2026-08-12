import * as React from 'react';
import {createRoot} from 'react-dom/client';
import {GraphiQL} from 'graphiql';
import {createGraphiQLFetcher} from '@graphiql/toolkit';

const container = document.getElementById('graphiql-container-wrapper');

if (!container) {
    throw new Error('Could not find the element #graphiql-container-wrapper');
}

const handlerUrl = container.dataset.configHandlerUrl;

if (!handlerUrl) {
    throw new Error('Missing the data-config-handler-url attribute');
}

const fetcher = createGraphiQLFetcher({
    url: handlerUrl,
});

createRoot(container).render(<GraphiQL fetcher={fetcher}/>);
