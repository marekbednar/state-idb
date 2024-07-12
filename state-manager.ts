import { Observable, Subject } from 'rxjs';

// Load worker using relative path
const worker = new Worker('./state-worker.js');

interface Message {
	action: string;
	value?: any;
	state?: any;
	id?: number;
	results?: any;
	store?: string;
	indexes?: { name: string; keyPath: string }[];
	index?: string;
	rangeType?: string;
	rangeParams?: any[];
	query?: string;
	record?: any;
	error?: any;
}

const stateSubject = new Subject<any>();

worker.onmessage = (event: MessageEvent<Message>) => {
	if (event.data.action === 'stateUpdate') {
		stateSubject.next(event.data.state);
	} else if (event.data.action === 'queryRange') {
		stateSubject.next({ store: event.data.store, results: event.data.results });
	}
};

export function initializeDatabase(store: string, indexes: { name: string; keyPath: string }[]) {
	worker.postMessage({ action: 'initializeDatabase', store, indexes });
}

export function setState(value: any[], store: string) {
	worker.postMessage({ action: 'setState', value, store });
}

export function getState(store: string): Promise<any> {
	return new Promise<any>((resolve) => {
		const handler = (event: MessageEvent<Message>) => {
			if (event.data.action === 'getState') {
				worker.removeEventListener('message', handler);
				resolve(event.data.state);
			}
		};
		worker.addEventListener('message', handler);
		worker.postMessage({ action: 'getState', store });
	});
}

export function queryState(query: (item: any) => boolean, store: string): Promise<any[]> {
	return new Promise<any[]>((resolve) => {
		const handler = (event: MessageEvent<Message>) => {
			if (event.data.action === 'queryState') {
				worker.removeEventListener('message', handler);
				resolve(event.data.results);
			}
		};
		worker.addEventListener('message', handler);
		worker.postMessage({ action: 'queryState', query: query.toString(), store });
	});
}

export function queryRange(store: string, index: string, rangeType: string, rangeParams: any[]): Promise<any[]> {
	return new Promise<any[]>((resolve) => {
		const handler = (event: MessageEvent<Message>) => {
			if (event.data.action === 'queryRange' && event.data.store === store) {
				worker.removeEventListener('message', handler);
				resolve(event.data.results);
			}
		};
		worker.addEventListener('message', handler);
		worker.postMessage({ action: 'queryRange', store, index, rangeType, rangeParams });
	});
}


export function getRecordById(store: string, id: number): Promise<any> {
	return new Promise((resolve) => {
		const handler = (event: MessageEvent<Message>) => {
			if (event.data.action === 'getRecordById' && event.data.store === store) {
				worker.removeEventListener('message', handler);
				resolve(event.data.record);
			}
		};
		worker.addEventListener('message', handler);
		worker.postMessage({ action: 'getRecordById', store, id });
	});
}

export function setRecordById(store: string, id: number, value: any): Promise<void> {
	return new Promise((resolve, reject) => {
		const handler = (event: MessageEvent<Message>) => {
			if (event.data.action === 'setRecordById' && event.data.store === store) {
				worker.removeEventListener('message', handler);
				if (event.data.error) {
					reject(event.data.error);
				} else {
					resolve();
				}
			}
		};
		worker.addEventListener('message', handler);
		worker.postMessage({ action: 'setRecordById', store, id, value });
	});
}

export function subscribe(): Observable<any> {
	return stateSubject.asObservable();
}
