import {newCache} from '/lib/cache';

export interface Note {
    id: string;
    title: string;
    content: string;
    createdAt: string;
}

const NOTES = 'notes';

const cache = newCache<Record<string, Note>>({size: 10});

function notes(): Record<string, Note> {
    return cache.get(NOTES, () => ({}));
}

export function list(): Note[] {
    const all = notes();
    return Object.keys(all).map((key) => all[key]);
}

export function get(id: string): Note | undefined {
    return notes()[id];
}

export function create(title: string, content: string): Note {
    const note: Note = {
        id: Math.random().toString(36).substring(2, 15),
        title: title,
        content: content,
        createdAt: new Date().toISOString(),
    };

    const all = notes();
    all[note.id] = note;
    cache.put(NOTES, all);

    return note;
}

export function remove(id: string): Note | undefined {
    const all = notes();
    const note = all[id];

    if (note) {
        delete all[id];
        cache.put(NOTES, all);
    }

    return note;
}
