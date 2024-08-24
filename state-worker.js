var dbVersion = 17;


self.onmessage = async function (event) {
	const { stores, action, value, store, id, index, rangeType, rangeParams, query, operationId } = event.data;
	switch (action) {
		case 'initializeDatabase':
			await initializeDatabase(stores);
			break;
		case 'setState':
			await setState(value, store, operationId);
			break;
		case 'getState':
			await getState(store, operationId);
			break;
		case 'queryState':
			await queryState(eval(query), store, operationId);
			break;
		case 'queryRange':
			await queryRange(store, index, rangeType, rangeParams, operationId);
			break;
		case 'getRecordById':
			await getRecordById(store, id, operationId);
			break;
		case 'setRecordById':
			await setRecordById(store, id, value, operationId);
			break;
		case 'clearState':
			await clearState(store, operationId);
			break;
	}
};

const dbName = 'nis-idb';

async function initializeDatabase(stores) {
	console.log('Initializing database:', dbName, stores, dbVersion);

	// Open or create the IndexedDB database
	return await new Promise((resolve, reject) => {
		const request = indexedDB.open(dbName, dbVersion);

		request.onupgradeneeded = function (event) {
			const db = event.target.result;

			// Create object store if it doesn't exist
			stores.forEach(({store, indexes, settings}) => {
				if (settings === undefined || settings === null || Object.keys(settings).length === 0) {
					settings = {keyPath: 'id', autoIncrement: true};
				}
				console.log('Creating object store:', store, indexes);
				if (!db.objectStoreNames.contains(store)) {
					console.log('Missing store', store);
					const objectStore = db.createObjectStore(store, settings);

					// Create indexes
					indexes.forEach(({name, keyPath}) => {
						objectStore.createIndex(name, keyPath, {unique: false, multiEntry: true});
					});
				}

			});
		};

		request.onsuccess = function (event) {
			console.log("Database initialized:", event.target);
			resolve(event.target.result);
		};

		request.onerror = function (event) {
			console.error("Database not initialized:", event.target);
			reject(event.target.error);
		};
	});
}

async function openDB() {
	const request = indexedDB.open(dbName, dbVersion);

	return new Promise((resolve, reject) => {
		request.onsuccess = function(event) {
			console.log('Opening IndexedDB:', event.target);
			resolve(event.target.result);
		};

		request.onerror = function(event) {
			console.error('Error opening IndexedDB:', event.target.error);
			reject(event.target.error);
		};
	});
}

async function clearState(store, operationId) {
	const db = await openDB();
	const transaction = db.transaction(store, 'readwrite');
	const objectStore = transaction.objectStore(store);
	const request = objectStore.clear();

	request.onsuccess = function (event) {
		console.log('State cleared:', store);
		notifySubscribers(operationId);
		db.close();
	};

	request.onerror = function (event) {
		console.error('Error clearing state:', event.target.error);
		db.close();
	};
}

async function setState(value, store, operationId) {
	const db = await openDB();
	const transaction = db.transaction(store, 'readwrite');
	const objectStore = transaction.objectStore(store);
	value.forEach(item => {
		objectStore.add(item);
	});
	notifySubscribers(operationId);
	db.close();
}

async function getState(store, operationId) {
	const db = await openDB();
	const transaction = db.transaction(store, 'readonly');
	const objectStore = transaction.objectStore(store);
	const request = objectStore.getAll();

	request.onsuccess = function (event) {
		postMessage({ action: 'getState', state: event.target.result, operationId });
		db.close();
	};

	request.onerror = function (event) {
		console.error('Error fetching state:', event.target.error);
		db.close();
	};
}

async function queryState(query, store, operationId) {
	const db = await openDB();
	const transaction = db.transaction(store, 'readonly');
	const objectStore = transaction.objectStore(store);
	const request = objectStore.getAll();

	request.onsuccess = function (event) {
		const results = event.target.result.filter(query);
		postMessage({ action: 'queryState', results, operationId });
		db.close();
	};

	request.onerror = function (event) {
		console.error('Error querying state:', event.target.error);
		db.close();
	};
}

async function queryRange(store, index, rangeType, rangeParams, operationId) {
	console.log('Querying range:', store, index, rangeType, rangeParams);
	const db = await openDB();
	const transaction = db.transaction(store, 'readonly');
	const objectStore = transaction.objectStore(store);
	const indexStore = objectStore.index(index);
	const IDBKeyRange = self.IDBKeyRange || self.webkitIDBKeyRange;
	const keyRange = IDBKeyRange[rangeType](...rangeParams);
	const request = indexStore.getAll(keyRange);

	request.onsuccess = function (event) {
		postMessage({ action: 'queryRange', store, results: event.target.result, operationId });
		db.close();
	};

	request.onerror = function (event) {
		console.error('Error querying range:', event.target.error);
		db.close();
	};
}


async function getRecordById(store, id, operationId) {
	const db = await openDB(store);
	const transaction = db.transaction(store, 'readonly');
	const objectStore = transaction.objectStore(store);
	const request = objectStore.get(id);
	request.onsuccess = function (event) {
		console.log('Getting record by ID:', id, event.target.result);
		postMessage({ action: 'getRecordById', store, id: id, record: event.target.result, operationId });
		db.close();
	};
	request.onerror = function (event) {
		console.error('Error getting record by ID:', event.target.error);
		db.close();
	};
}


async function setRecordById(store, id, value, operationId) {
	const db = await openDB(store);
	const transaction = db.transaction(store, 'readwrite');
	const objectStore = transaction.objectStore(store);
	const request = objectStore.get(id);
	request.onsuccess = function (event) {
		const record = event.target.result;
		if (record) {
			// Update the record with the new value
			// if the value is of primitive type, it will be replaced
			// if the value is an object, it will be merged with the existing record
			if (typeof value === 'object') {
				Object.assign(record, value);
				objectStore.put(record, id);
			} else {
				objectStore.put(value, id);
			}

			console.log('Record put', value);
			postMessage({ action: 'setRecordById', store, record: record, operationId});
			db.close();
		} else {
			console.error('Record not found:', id);
			// create record with given id
			objectStore.add(value, id);
			db.close();
		}
	};
	request.onerror = function (event) {
		console.error('Error getting record by ID:', event.target.error);
		db.close();
	};
}

function notifySubscribers(operationId) {
	postMessage({ action: 'stateUpdate', operationId });
}