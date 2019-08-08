module.exports = function (req, res) {
	var keystone = req.keystone;
	if (!keystone.security.csrf.validate(req)) {
		return res.apiError(403, 'invalid csrf');
	}
	req.list.model.findById(req.params.id, function (err, item) {
		if (err) return res.status(500).json({ error: 'database error', detail: err });
		if (!item) return res.status(404).json({ error: 'not found', id: req.params.id });
		req.list.updateItem(item, req.body, { files: req.files, user: req.user }, function (err) {
			if (err) {
				var status = err.error === 'validation errors' ? 400 : 500;
				var error = err.error === 'database error' ? err.detail : err;
				return res.apiError(status, error);
			}else{
				var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

				new keystone.lists.UserLog.model({
					date: Date.now(),
					module: req.list.key,
					action: 'update',
					ip: ip,
					user: req.user._id
				}).save(function (err, logResponse) {
					req.list.model.findById(req.params.id, function (err, updatedItem) {
						res.json(req.list.getData(updatedItem));
					});
				})
			}
			// Reload the item from the database to prevent save hooks or other
			// application specific logic from messing with the values in the item

		});
	});
};
