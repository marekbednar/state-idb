import { Observable, Subject } from 'rxjs';

// Load worker using relative path
const worker = new Worker('./frontend/state-worker.js');

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
	operationId: number;
}

const stateSubject = new Subject<any>();

//TODO add id for every message to be able to distinguish between different messages
let operationId = 0;

worker.onmessage = (event: MessageEvent<Message>) => {
	if (event.data.action === 'stateUpdate') {
		stateSubject.next(event.data.state);
	} else if (event.data.action === 'queryRange') {
		stateSubject.next({ store: event.data.store, results: event.data.results });
	}
};

export interface IStoreObject {
	store: string,
	indexes: { name: string; keyPath: string }[],
	settings?: Object
}

export function initializeDatabase(stores: IStoreObject[]) {
	const postId = operationId++;
	worker.postMessage({ action: 'initializeDatabase', stores, operationId: postId });
}

export function setState(value: any[], store: string) {
	const postId = operationId++;
	worker.postMessage({ action: 'setState', value, store, operationId: postId });
}

export function getState(store: string): Promise<any> {
	const postId = operationId++;
	return new Promise<any>((resolve) => {
		const handler = (event: MessageEvent<Message>) => {
			if (event.data.operationId === postId && event.data.action === 'getState') {
				worker.removeEventListener('message', handler);
				resolve(event.data.state);
			}
		};
		worker.addEventListener('message', handler);
		worker.postMessage({ action: 'getState', store, operationId: postId });
	});
}

export function clearState(store: string) {
	const postId = operationId++;
	worker.postMessage({ action: 'clearState', store, operationId: postId });
}

export function queryState(query: (item: any) => boolean, store: string): Promise<any[]> {
	const postId = operationId++;
	return new Promise((resolve) => {
		const handler = (event: MessageEvent<Message>) => {
			if (event.data.operationId === postId && event.data.action === 'queryState') {
				worker.removeEventListener('message', handler);
				resolve(event.data.results);
			}
		};
		worker.addEventListener('message', handler);
		worker.postMessage({ action: 'queryState', query: query.toString(), store, operationId: postId });
	});
}

export function queryRange(store: string, index: string, rangeType: string, rangeParams: any[]): Promise<any[]> {
	const postId = operationId++;
	return new Promise<any[]>((resolve) => {
		const handler = (event: MessageEvent<Message>) => {
			if (event.data.operationId === postId && event.data.action === 'queryRange' && event.data.store === store) {
				worker.removeEventListener('message', handler);
				resolve(event.data.results);
			}
		};
		worker.addEventListener('message', handler);
		worker.postMessage({ action: 'queryRange', store, index, rangeType, rangeParams, operationId: postId });
	});
}


export function getRecordById(store: string, id: number | string): Promise<any> {
	const postId = operationId++;
	return new Promise((resolve) => {
		const handler = (event: MessageEvent<Message>) => {
			if (event.data.operationId === postId && event.data.action === 'getRecordById' && event.data.store === store && event.data.id === id) {
				worker.removeEventListener('message', handler);
				resolve(event.data.record);
			}
		};
		worker.addEventListener('message', handler);
		worker.postMessage({ action: 'getRecordById', store, id, operationId: postId });
	});
}

export function setRecordById(store: string, id: number | string, value: any): Promise<void> {
	const postId = operationId++;
	return new Promise((resolve, reject) => {
		const handler = (event: MessageEvent<Message>) => {
			if (event.data.operationId === postId && event.data.action === 'setRecordById' && event.data.store === store) {
				worker.removeEventListener('message', handler);
				if (event.data.error) {
					reject(event.data.error);
				} else {
					resolve(event.data.record);
				}
			}
		};
		worker.addEventListener('message', handler);
		worker.postMessage({ action: 'setRecordById', store, id, value, operationId: postId });
	});
}

export function subscribe(): Observable<any> {
	return stateSubject.asObservable();
}
