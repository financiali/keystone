var mongoose = require('mongoose'),
	Schema = mongoose.Schema,
	Model = mongoose.Model,
	util = require('util');

module.exports = function userLogs() {

	let _self = this;

	// console.log('User logs plugin enabled, ' + this.key);
	this.schema.pre('save', function (next) {

		if (_self.key === 'UserLog') {
			next();
		} else {
			let UserLog = _self.keystone.lists['UserLog'];
			let action = 'update';
			if (this.isNew) {
				action = 'insert';
			}

			let logModel = new UserLog.model({
				date: Date.now(),
				module: _self.key,
				action: action
			});

			new UserLog.model({
				date: Date.now(),
				module: _self.key,
				action: action
			}).save();

			next();
		}


	});
};
