module.exports = function softDelete() {
	this.add({
		deleted: {type: Boolean, default: false, hidden: true},
	});

	this.schema.pre('save', function (next) {
		console.log('pre', 123);
		next()
	});
};
