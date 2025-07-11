import * as React from 'react';
import {createRoot} from 'react-dom/client';
import {GraphiQL} from 'graphiql';
import {createGraphiQLFetcher} from '@graphiql/toolkit';
import {createClient} from 'graphql-ws';

const container = document.getElementById('graphiql-container-wrapper');

const fetcher = createGraphiQLFetcher({
    url: container.dataset.configHandlerUrl,
    wsClient: createClient(
        {
            url: container.dataset.configEventsUrl,
        }),
});

createRoot(container).render(<GraphiQL fetcher={fetcher}/>);
