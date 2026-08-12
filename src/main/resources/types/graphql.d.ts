/**
 * Type definitions for the parts of lib-graphql used by this application.
 *
 * The library does not publish an @enonic-types package, so these are
 * maintained here. See https://developer.enonic.com/docs/graphql-library
 */
declare global {
    interface XpLibraries {
        '/lib/graphql': typeof import('./graphql');
    }
}

export type GraphQLType = unknown;
export type GraphQLSchema = unknown;

export declare const GraphQLInt: GraphQLType;
export declare const GraphQLFloat: GraphQLType;
export declare const GraphQLString: GraphQLType;
export declare const GraphQLBoolean: GraphQLType;
export declare const GraphQLID: GraphQLType;
export declare const Json: GraphQLType;
export declare const Date: GraphQLType;
export declare const Time: GraphQLType;
export declare const DateTime: GraphQLType;
export declare const LocalDateTime: GraphQLType;
export declare const LocalTime: GraphQLType;

export interface ResolverEnvironment<Source = unknown, Args = Record<string, unknown>> {
    source: Source;
    args: Args;
    context: unknown;
}

export interface OutputField {
    type: GraphQLType;
    args?: Record<string, GraphQLType>;
    resolve?: (env: ResolverEnvironment) => unknown;
}

export interface ObjectTypeParams {
    name: string;
    fields: Record<string, OutputField>;
    interfaces?: GraphQLType[];
    description?: string;
}

export interface SchemaParams {
    query: GraphQLType;
    mutation?: GraphQLType;
    subscription?: GraphQLType;
    dictionary?: GraphQLType[];
}

export interface GraphQLError {
    errorType: string;
    message: string;
}

export interface ExecutionResult {
    data?: unknown;
    errors?: GraphQLError[];
}

export interface SchemaGenerator {
    createSchema(params: SchemaParams): GraphQLSchema;
    createObjectType(params: ObjectTypeParams): GraphQLType;
    createInputObjectType(params: {name: string; fields: Record<string, {type: GraphQLType}>; description?: string}): GraphQLType;
    createInterfaceType(params: ObjectTypeParams & {typeResolver: (source: unknown) => GraphQLType}): GraphQLType;
    createUnionType(params: {name: string; types: GraphQLType[]; typeResolver: (source: unknown) => GraphQLType; description?: string}): GraphQLType;
    createEnumType(params: {name: string; values: string[] | Record<string, unknown>; description?: string}): GraphQLType;
    createPageInfoObjectType(params: ObjectTypeParams): GraphQLType;
}

export declare function newSchemaGenerator(): SchemaGenerator;
export declare function list(type: GraphQLType): GraphQLType;
export declare function nonNull(type: GraphQLType): GraphQLType;
export declare function reference(typeKey: string): GraphQLType;
export declare function execute(schema: GraphQLSchema, query: string, variables?: unknown, context?: unknown): ExecutionResult;
