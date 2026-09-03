import {
    GraphQLID,
    GraphQLString,
    Json,
    list,
    newSchemaGenerator,
    nonNull,
    reference
} from '/lib/graphql';
import {send} from '/lib/xp/event';
import * as notes from '/lib/notes';
import {noteProcessor} from '/lib/events';

const schemaGenerator = newSchemaGenerator();

const noteType = schemaGenerator.createObjectType({
    name: 'Note',
    fields: {
        id: {
            type: nonNull(GraphQLID),
        },
        title: {
            type: nonNull(GraphQLString),
        },
        content: {
            type: GraphQLString,
        },
        createdAt: {
            type: nonNull(GraphQLString)
        }
    }
});

const rootQueryType = schemaGenerator.createObjectType({
    name: 'Query',
    fields: {
        serverTime: {
            type: GraphQLString,
            resolve: () => new Date().toISOString()
        },
        getNote: {
            type: reference('Note'),
            args: {
                id: nonNull(GraphQLID),
            },
            resolve: (env) => notes.get((env.args as {id: string}).id),
        },
        getNotes: {
            type: list(reference('Note')),
            resolve: () => notes.list()
        }
    },
});

const rootSubscriptionType = schemaGenerator.createObjectType({
    name: 'Subscription',
    fields: {
        event: {
            type: Json,
            resolve: () => noteProcessor,
        }
    }
});

const rootMutationType = schemaGenerator.createObjectType({
    name: 'Mutation',
    fields: {
        createNote: {
            type: reference('Note'),
            args: {
                title: nonNull(GraphQLString),
                content: nonNull(GraphQLString),
            },
            resolve: (env) => {
                const args = env.args as {title: string; content: string};
                const note = notes.create(args.title, args.content);

                send({
                    type: 'note.created',
                    distributed: true,
                    data: {
                        note: note,
                    }
                });

                return note;
            }
        },
        deleteNote: {
            type: reference('Note'),
            args: {
                id: nonNull(GraphQLID),
            },
            resolve: (env) => {
                const note = notes.remove((env.args as {id: string}).id);

                if (note) {
                    send({
                        type: 'note.deleted',
                        distributed: true,
                        data: {
                            note: note,
                        }
                    });
                }

                return note;
            }
        }
    }
});

const graphQLSchema = schemaGenerator.createSchema({
    query: rootQueryType,
    mutation: rootMutationType,
    subscription: rootSubscriptionType,
    dictionary: [noteType]
});

export default graphQLSchema;
