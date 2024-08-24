import {
	getRecordById,
	getState,
	initializeDatabase,
	queryRange, queryState,
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

	// Subscribe to state updates
	subscribe().subscribe((update) => {
		console.log('State update:', update);

	});

	const store = 'users';
	const indexes = [
		{ name: 'idIndex', keyPath: 'id' },
		{ name: 'ageIndex', keyPath: 'age' },
		{ name: 'nameIndex', keyPath: 'name' }
	];
	console.log('Users:', users);
	// Initialize the database with the specified store and indexes
	initializeDatabase(store, indexes);

	// Set state
	setState(users, store);

	// Get state
	const retrievedValue = await getState(store);
	console.log('Retrieved value:', retrievedValue);
	//
	// Query state
	const query = (item: any) => item.age > 25;
	const queryResults = await queryState(query, store);
	console.log('Query results:', queryResults);

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
	const updatedRecord = { name: 'bbbbbbb' };
	await setRecordById(store, recordId, updatedRecord);

	const record2 = await getRecordById(store, 2);
	console.log('Record by ID 2:', record2);

	const modifiedRecord = await getRecordById(store, recordId);
	console.log('Modified record:', modifiedRecord);


}

// working code example
// this.initIdb();
// 				let toLoad = 3;
// 				const decreasesLoadedAndCheck = () => {
// 					toLoad--;
// 					if (toLoad === 0) {
// 						this.getStore().dataPreloaded.setState(true);
// 					}
// 				}
//
// 				getRecordById("settings", "members").then((res) => {
// 					console.log('members last updated', res)
// 					if (res === undefined || res + this.storeTimeout < new Date().getMilliseconds()) {
// 						RhmMemberController.searchAll().pipe(
// 							catchError(e => of([]))
// 						).subscribe((members) => {
// 							clearState('members');
// 							setState(members, 'members');
// 							setRecordById("settings", "members", {updated: Date.now()});
// 							decreasesLoadedAndCheck();
// 						});
// 					} else {
// 						decreasesLoadedAndCheck();
// 					}
// 				});
// 				getRecordById("settings", "rhmcases").then((res) => {
// 					console.log('rhmcases last updated', res)
// 					if (res === undefined || res + this.storeTimeout < new Date().getMilliseconds()) {
// 						RhmRecordController.search(filteredUserResponse.company.id).pipe(
// 							catchError(e => of([]))
// 						).subscribe((records) => {
// 							clearState('rhmcases');
// 							setState(records, 'rhmcases');
// 							setRecordById("settings", "rhmcases", {updated: Date.now()});
// 							decreasesLoadedAndCheck();
// 						});
// 					} else {
// 						decreasesLoadedAndCheck();
// 					}
// 				});
// 				getRecordById("settings", "notifications").then((res) => {
// 					console.log('notifications last updated', res)
// 					NotificationController.search(0, new Date().getTime()).pipe(catchError(e => of([]))).subscribe((notifications) => {
// 						if (res === undefined || res + this.storeTimeout < new Date().getMilliseconds()) {
// 							clearState('notifications');
// 							setState(notifications, 'notifications');
// 							setRecordById("settings", "notifications", {updated: Date.now()});
// 							decreasesLoadedAndCheck();
// 						} else {
// 							decreasesLoadedAndCheck();
// 						}
// 					});
// 				});
// 				this.getStore().dataPreloaded.setState(true);
//
//initIdb() {
// 		initializeDatabase([
// 			{ store: 'members', indexes: [] },
// 			{ store: 'rhmcases', indexes: [] },
// 			{ store: 'notifications', indexes: [] },
// 			{ store: 'settings', indexes: [], settings: {
// 					autoIncrement: false
// 				} }
// 		]);
// 	}
