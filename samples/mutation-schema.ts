import {
    GraphQLID,
    GraphQLString,
    list,
    newSchemaGenerator,
    nonNull,
    reference
} from '/lib/graphql';

const schemaGenerator = newSchemaGenerator();

interface Note {
    id: string;
    title: string;
    content: string;
    createdAt: string;
}

const storage: Record<string, Note> = {};

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
            resolve: (env) => storage[(env.args as {id: string}).id],
        },
        getNotes: {
            type: list(reference('Note')),
            resolve: () => Object.keys(storage).map((key) => storage[key])
        }
    },
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
                const note: Note = {
                    id: Math.random().toString(36).substring(2, 15),
                    title: args.title,
                    content: args.content,
                    createdAt: new Date().toISOString(),
                };
                storage[note.id] = note;
                return note;
            }
        },
        deleteNote: {
            type: reference('Note'),
            args: {
                id: nonNull(GraphQLID),
            },
            resolve: (env) => {
                const id = (env.args as {id: string}).id;
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

export default graphQLSchema;
