const graphQlLib = require('/lib/graphql');

const schemaGenerator = graphQlLib.newSchemaGenerator();

const storage = [];

const noteType = schemaGenerator.createObjectType({
    name: 'Note',
    fields: {
        id: {
            type: graphQlLib.nonNull(graphQlLib.GraphQLID),
        },
        title: {
            type: graphQlLib.nonNull(graphQlLib.GraphQLString),
        },
        content: {
            type: graphQlLib.nonNull(graphQlLib.GraphQLString),
        }
    }
});

const graphQLSchema = schemaGenerator.createSchema({
    query: schemaGenerator.createObjectType({
        name: 'Query',
        fields: {
            serverTime: {
                type: graphQlLib.GraphQLString,
                resolve: (env) => {
                    return new Date().toISOString();
                }
            },
            sayHi: {
                type: graphQlLib.GraphQLString,
                args: {
                    name: graphQlLib.nonNull(graphQlLib.GraphQLString),
                },
                resolve: (env) => {
                    return `Hello, ${env.args.name}!`;
                }
            },
            getNote: {
                type: graphQlLib.reference('Note'),
                args: {
                    id: graphQlLib.nonNull(graphQlLib.GraphQLID),
                },
                resolve: (env) => {
                    let result = null;
                    for (let i = 0; i < storage.length; i++) {
                        if (storage[i].id === env.args.id) {
                            result = storage[i];
                            break;
                        }
                    }
                    return result;
                },
            },
            getNodes: {
                type: graphQlLib.list(graphQlLib.reference('Note')),
                resolve: (env) => {
                    return storage;
                }
            }
        },
    }),
    mutation: schemaGenerator.createObjectType({
        name: 'Mutation',
        fields: {
            createNote: {
                type: graphQlLib.reference('Note'),
                args: {
                    title: graphQlLib.nonNull(graphQlLib.GraphQLString),
                    content: graphQlLib.nonNull(graphQlLib.GraphQLString),
                },
                resolve: (env) => {
                    const note = {
                        id: Math.random().toString(36).substring(2, 15),
                        title: env.args.title,
                        content: env.args.content,
                    };
                    storage.push(note);
                    return note;
                }
            }
        }
    }),
    dictionary: [noteType]
});

exports.post = (req) => {
    log.info(`REQ: ${JSON.stringify(req, null, 2)}`);
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
};

