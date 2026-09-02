import {listener} from '/lib/xp/event';
import {noteProcessor} from '/lib/events';

export function init(): void {
    listener({
        type: 'custom.note.*',
        callback: (event) => {
            noteProcessor.onNext(event);
        }
    });
}

init();
