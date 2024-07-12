self.onmessage = async function (event) {
	const { action, value, store, id, index, rangeType, rangeParams, query } = event.data;
	switch (action) {
		case 'initializeDatabase':
			await initializeDatabase(store, event.data.indexes);
			break;
		case 'setState':
			await setState(value, store);
			notifySubscribers();
			break;
		case 'getState':
			getState(store);
			break;
		case 'queryState':
			queryState(eval(query), store);
			break;
		case 'queryRange':
			queryRange(store, index, rangeType, rangeParams);
			break;
		case 'getRecordById':
			getRecordById(store, id);
			break;
		case 'setRecordById':
			setRecordById(store, id, value);
			break;
	}
};

const dbName = 'nis-idb';

async function initializeDatabase(store, indexes) {

	console.log('Initializing database:', dbName, store, indexes);

	// Open or create the IndexedDB database
	return await new Promise((resolve, reject) => {
		const request = indexedDB.open(dbName, 1);

		request.onupgradeneeded = function (event) {
			const db = event.target.result;

			// Create object store if it doesn't exist
			if (!db.objectStoreNames.contains(store)) {
				const objectStore = db.createObjectStore(store, {keyPath: 'id', autoIncrement: true});

				// Create indexes
				indexes.forEach(({name, keyPath}) => {
					objectStore.createIndex(name, keyPath, {unique: false, multiEntry: true});
				});
			}
		};

		request.onsuccess = function (event) {
			resolve(event.target.result);
		};

		request.onerror = function (event) {
			reject(event.target.error);
		};
	});
}

async function openDB() {
	const request = indexedDB.open(dbName, 1);

	return new Promise((resolve, reject) => {
		request.onsuccess = function(event) {
			resolve(event.target.result);
		};

		request.onerror = function(event) {
			console.error('Error opening IndexedDB:', event.target.error);
			reject(event.target.error);
		};
	});
}

async function setState(value, store) {
	const db = await openDB();
	const transaction = db.transaction(store, 'readwrite');
	const objectStore = transaction.objectStore(store);
	value.forEach(item => {
		objectStore.add(item);
	});
}

async function getState(store) {
	const db = await openDB();
	const transaction = db.transaction(store, 'readonly');
	const objectStore = transaction.objectStore(store);
	const request = objectStore.getAll();

	request.onsuccess = function (event) {
		postMessage({ action: 'getState', state: event.target.result });
	};

	request.onerror = function (event) {
		console.error('Error fetching state:', event.target.error);
	};
}

async function queryState(query, store) {
	const db = await openDB();
	const transaction = db.transaction(store, 'readonly');
	const objectStore = transaction.objectStore(store);
	const request = objectStore.getAll();

	request.onsuccess = function (event) {
		const results = event.target.result.filter(query);
		postMessage({ action: 'queryState', results });
	};

	request.onerror = function (event) {
		console.error('Error querying state:', event.target.error);
	};
}

async function queryRange(store, index, rangeType, rangeParams) {
	console.log('Querying range:', store, index, rangeType, rangeParams);
	const db = await openDB();
	const transaction = db.transaction(store, 'readonly');
	const objectStore = transaction.objectStore(store);
	const indexStore = objectStore.index(index);
	const IDBKeyRange = self.IDBKeyRange || self.webkitIDBKeyRange;
	const keyRange = IDBKeyRange[rangeType](...rangeParams);
	const request = indexStore.getAll(keyRange);

	request.onsuccess = function (event) {
		postMessage({ action: 'queryRange', store, results: event.target.result });
	};

	request.onerror = function (event) {
		console.error('Error querying range:', event.target.error);
	};
}


async function getRecordById(store, id) {
	const db = await openDB(store);
	const transaction = db.transaction(store, 'readonly');
	const objectStore = transaction.objectStore(store);
	const request = objectStore.get(id);
	request.onsuccess = function (event) {
		postMessage({ action: 'getRecordById', store, record: event.target.result });
	};
	request.onerror = function (event) {
		console.error('Error getting record by ID:', event.target.error);
	};
}

async function setRecordById(store, id, value) {
	const db = await openDB(store);
	const transaction = db.transaction(store, 'readwrite');
	const objectStore = transaction.objectStore(store);
	const request = objectStore.get(id);
	request.onsuccess = function (event) {
		const record = event.target.result;
		if (record) {
			// Update the record with the new value
			Object.assign(record, value);
			objectStore.put(record);
		} else {
			console.error('Record not found:', id);
		}
	};
	request.onerror = function (event) {
		console.error('Error getting record by ID:', event.target.error);
	};
}

function notifySubscribers() {
	postMessage({ action: 'stateUpdate' });
}