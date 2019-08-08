module.exports = function (req, res) {
	var keystone = req.keystone;
	if (!keystone.security.csrf.validate(req)) {
		return res.apiError(403, 'invalid csrf');
	}

	var item = new req.list.model();
	req.list.updateItem(item, req.body, {
		files: req.files,
		ignoreNoEdit: true,
		user: req.user,
	}, function (err) {
		if (err) {
			var status = err.error === 'validation errors' ? 400 : 500;
			var error = err.error === 'database error' ? err.detail : err;
			return res.apiError(status, error);
		} else {
			var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
			new keystone.lists.UserLog.model({
				date: Date.now(),
				module: req.list.key,
				action: 'create',
				ip: ip,
				user: req.user._id
			}).save()
		}
		res.json(req.list.getData(item));
	});
};
