var mongoose = require('mongoose'),
	Schema = mongoose.Schema,
	Model = mongoose.Model,
	util = require('util');

function parseUpdateArguments(conditions, doc, options, callback) {
	if ('function' === typeof options) {
		// .update(conditions, doc, callback)
		callback = options;
		options = null;
	} else if ('function' === typeof doc) {
		// .update(doc, callback);
		callback = doc;
		doc = conditions;
		conditions = {};
		options = null;
	} else if ('function' === typeof conditions) {
		// .update(callback)
		callback = conditions;
		conditions = undefined;
		doc = undefined;
		options = undefined;
	} else if (typeof conditions === 'object' && !doc && !options && !callback) {
		// .update(doc)
		doc = conditions;
		conditions = undefined;
		options = undefined;
		callback = undefined;
	}

	var args = [];

	if (conditions) args.push(conditions);
	if (doc) args.push(doc);
	if (options) args.push(options);
	if (callback) args.push(callback);

	return args;
}

function parseIndexFields(options) {
	var indexFields = {
		deleted: false,
		deletedAt: false,
		deletedBy: false
	};

	if (!options.indexFields) {
		return indexFields;
	}

	if ((typeof options.indexFields === 'string' || options.indexFields instanceof String) && options.indexFields === 'all') {
		indexFields.deleted = indexFields.deletedAt = indexFields.deletedBy = true;
	}

	if (typeof (options.indexFields) === "boolean" && options.indexFields === true) {
		indexFields.deleted = indexFields.deletedAt = indexFields.deletedBy = true;
	}

	if (Array.isArray(options.indexFields)) {
		indexFields.deleted = options.indexFields.indexOf('deleted') > -1;
		indexFields.deletedAt = options.indexFields.indexOf('deletedAt') > -1;
		indexFields.deletedBy = options.indexFields.indexOf('deletedBy') > -1;
	}

	return indexFields;
}

function createSchemaObject(typeKey, typeValue, options) {
	options[typeKey] = typeValue;
	return options;
}


module.exports = function softDelete() {

	let _self = this;

	let options = {
		overrideMethods: true
	};

	this.add({
		deleted: {type: Boolean, default: false, hidden: true},
	});

	this.schema.pre('save', function (next) {
		next()
	});

	if (options.overrideMethods) {
		var overrideItems = options.overrideMethods;
		var overridableMethods = ['count', 'countDocuments', 'find', 'findOne', 'findOneAndUpdate', 'update'];
		var finalList = [];

		if ((typeof overrideItems === 'string' || overrideItems instanceof String) && overrideItems === 'all') {
			finalList = overridableMethods;
		}

		if (typeof (overrideItems) === "boolean" && overrideItems === true) {
			finalList = overridableMethods;
		}

		if (Array.isArray(overrideItems)) {
			overrideItems.forEach(function (method) {
				if (overridableMethods.indexOf(method) > -1) {
					finalList.push(method);
				}
			});
		}


		finalList.forEach(function (method) {
			if (['count', 'countDocuments', 'find', 'findOne'].indexOf(method) > -1) {
				var modelMethodName = method;

				// countDocuments do not exist in Mongoose v4
				/* istanbul ignore next */
				if (method === 'countDocuments' && typeof Model.countDocuments !== 'function') {
					modelMethodName = 'count';
				}

				_self.schema.statics[method] = function () {
					return Model[modelMethodName].apply(this, arguments).where('deleted').ne(true);
				};
				_self.schema.statics[method + 'Deleted'] = function () {
					return Model[modelMethodName].apply(this, arguments).where('deleted').ne(false);
				};
				_self.schema.statics[method + 'WithDeleted'] = function () {
					return Model[modelMethodName].apply(this, arguments);
				};
			} else {
				_self.schema.statics[method] = function () {
					var args = parseUpdateArguments.apply(undefined, arguments);

					args[0].deleted = {'$ne': true};

					return Model[method].apply(this, args);
				};

				_self.schema.statics[method + 'Deleted'] = function () {
					var args = parseUpdateArguments.apply(undefined, arguments);

					args[0].deleted = {'$ne': false};

					return Model[method].apply(this, args);
				};

				_self.schema.statics[method + 'WithDeleted'] = function () {
					return Model[method].apply(this, arguments);
				};
			}
		});
	}


	this.schema.methods.remove = function (deletedBy, cb) {
		this.deleted = true;
		return this.save(cb);
	};

	this.schema.methods.delete = function (deletedBy, cb) {
		this.deletedBy = deletedBy;
		this.deleted = true;
		return this.save(cb);
	};
};
