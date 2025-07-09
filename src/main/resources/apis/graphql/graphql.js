const portalLib = require('/lib/xp/portal');
const graphQlLib = require('/lib/graphql');
const mustacheLib = require('/lib/mustache');
const staticLib = require('/lib/enonic/static');
const router = require('/lib/router')();
const graphQLSchema = require('./schema');

exports.all = function (req) {
    return router.dispatch(req);
};

router.get(`/_static/{path:.*}`, (request) => {
    return staticLib.requestHandler(
        request,
        {
            cacheControl: () => staticLib.RESPONSE_CACHE_CONTROL.SAFE,
            index: false,
            root: '/assets',
            relativePath: staticLib.mappedRelativePath('/_static/'),
        }
    );
});

router.get('/?', (req) => {
    const view = resolve('graphql.html');

    const apiUrl = portalLib.apiUrl({
        api: 'graphql'
    });

    const params = {
        handlerUrl: apiUrl,
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
    const operation = body.query || body.mutation || body.subscription;
    if (!operation) {
        throw new Error('`query` or `mutation` param is missing.');
    }

    const result = graphQlLib.execute(graphQLSchema, operation, body.variables);
    return {
        contentType: 'application/json',
        body: result,
    };
});

