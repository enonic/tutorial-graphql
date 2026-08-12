/**
 * Type definitions for the parts of lib-mustache used by this application.
 * See https://market.enonic.com/vendors/enonic/mustache-lib
 */
declare global {
    interface XpLibraries {
        '/lib/mustache': typeof import('./mustache');
    }
}

import type {ResourceKey} from '@enonic-types/core';

export declare function render(view: ResourceKey, params?: Record<string, unknown>): string;
