import {
	getRecordById,
	getState, clearState,
	initializeDatabase,
	queryRange, queryState,
	setRecordById,
	setState,
	subscribe
} from './state-manager';

// test for idb-sm, call from outside:
//main().then(() => console.log("main done"));

export async function main() {


// working code example
	this.initIdb();
		let toLoad = 3;
		const decreasesLoadedAndCheck = () => {
			toLoad--;
			if (toLoad === 0) {
				this.getStore().dataPreloaded.setState(true);
			}
		}

		getRecordById("settings", "members").then((res) => {
			console.log('members last updated', res)
			if (res === undefined || res + this.storeTimeout < new Date().getMilliseconds()) {
				RhmMemberController.searchAll().pipe(
					catchError(e => of([]))
				).subscribe((members) => {
					clearState('members');
					setState(members, 'members');
					setRecordById("settings", "members", {updated: Date.now()});
					decreasesLoadedAndCheck();
				});
			} else {
				decreasesLoadedAndCheck();
			}
		});
		getRecordById("settings", "rhmcases").then((res) => {
			console.log('rhmcases last updated', res)
			if (res === undefined || res + this.storeTimeout < new Date().getMilliseconds()) {
				RhmRecordController.search(filteredUserResponse.company.id).pipe(
					catchError(e => of([]))
				).subscribe((records) => {
					clearState('rhmcases');
					setState(records, 'rhmcases');
					setRecordById("settings", "rhmcases", {updated: Date.now()});
					decreasesLoadedAndCheck();
				});
			} else {
				decreasesLoadedAndCheck();
			}
		});
		getRecordById("settings", "notifications").then((res) => {
			console.log('notifications last updated', res)
			NotificationController.search(0, new Date().getTime()).pipe(catchError(e => of([]))).subscribe((notifications) => {
				if (res === undefined || res + this.storeTimeout < new Date().getMilliseconds()) {
					clearState('notifications');
					setState(notifications, 'notifications');
					setRecordById("settings", "notifications", {updated: Date.now()});
					decreasesLoadedAndCheck();
				} else {
					decreasesLoadedAndCheck();
				}
			});
		});
		this.getStore().dataPreloaded.setState(true);

		initIdb()
		{
			initializeDatabase([
				{store: 'members', indexes: []},
				{store: 'rhmcases', indexes: []},
				{store: 'notifications', indexes: []},
				{
					store: 'settings', indexes: [], settings: {
						autoIncrement: false
					}
				}
			]);
		}
}
