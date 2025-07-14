const graphQlLib = require('/lib/graphql');

const schemaGenerator = graphQlLib.newSchemaGenerator();

const storage = {};

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
            type: graphQlLib.GraphQLString,
        },
        createdAt: {
            type: graphQlLib.nonNull(graphQlLib.GraphQLString)
        }
    }
});

const rootQueryType = schemaGenerator.createObjectType({
    name: 'Query',
    fields: {
        serverTime: {
            type: graphQlLib.GraphQLString,
            resolve: (env) => {
                return new Date().toISOString();
            }
        },
        getNote: {
            type: graphQlLib.reference('Note'),
            args: {
                id: graphQlLib.nonNull(graphQlLib.GraphQLID),
            },
            resolve: (env) => {
                return storage[env.args.id];
            },
        },
        getNotes: {
            type: graphQlLib.list(graphQlLib.reference('Note')),
            resolve: (env) => {
                const result = [];
                for (let key in storage) {
                    if (storage.hasOwnProperty(key)) {
                        result.push(storage[key]);
                    }
                }
                return result;
            }
        }
    },
});

const rootMutationType = schemaGenerator.createObjectType({
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
                    createdAt: new Date().toISOString(),
                };
                storage[note.id] = note;
                return note;
            }
        },
        deleteNote: {
            type: graphQlLib.reference('Note'),
            args: {
                id: graphQlLib.nonNull(graphQlLib.GraphQLID),
            },
            resolve: (env) => {
                const id = env.args.id;
                const note = storage[id];
                delete storage[id];
                return note;
            }
        }
    }
});

const graphQLSchema = schemaGenerator.createSchema({
    query: rootQueryType,
    mutation: rootMutationType,
    dictionary: [noteType]
});

module.exports = graphQLSchema;
