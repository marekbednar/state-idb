import {
	getRecordById,
	getState,
	initializeDatabase,
	queryRange,
	setRecordById,
	setState,
	subscribe
} from './state-manager';

// test for idb-sm, call from outside:
//main().then(() => console.log("main done"));

export async function main() {
	const userAmount = 30;
	let roles = ['user', 'admin', 'moderator', 'editor', 'viewer'];
	const users = Array.from({ length: userAmount }, (_, i) => ({
		id: i,
		name: String.fromCharCode(65 + Math.floor(Math.random() * 6)) + Math.random().toString(36).substring(7),
		age: Math.floor(Math.random() * 100),
		roles: [roles[Math.floor(Math.random() * roles.length)]],
	}));

	const store = 'users';
	const indexes = [
		{ name: 'idIndex', keyPath: 'id' },
		{ name: 'ageIndex', keyPath: 'age' },
		{ name: 'nameIndex', keyPath: 'name' }
	];

	// Initialize the database with the specified store and indexes
	initializeDatabase(store, indexes);

	// Subscribe to state updates
	subscribe().subscribe((update) => {
		console.log('State update:', update);
	});

	// Set state
	setState(users, store);

	// Get state
	const retrievedValue = await getState(store);
	console.log('Retrieved value:', retrievedValue);
	//
	// // Query state
	// const query = (item: any) => item.age > 25;
	// const queryResults = await queryState(query, store);
	// console.log('Query results:', queryResults);

	// Query range
	const index = 'ageIndex'; // Specify your index name
	const rangeType = 'lowerBound';
	const rangeParams = [25];
	const rangeResults = await queryRange(store, index, rangeType, rangeParams);
	console.log('Range query results:', rangeResults);


	// Get record by ID
	const recordId = 5;
	const record = await getRecordById(store, recordId);
	console.log('Record by ID:', record);

	// Set/Modify record by ID
	const updatedRecord = { age: 30, roles: ['admin'] };
	await setRecordById(store, recordId, updatedRecord);
	const modifiedRecord = await getRecordById(store, recordId);
	console.log('Modified record:', modifiedRecord);

}

