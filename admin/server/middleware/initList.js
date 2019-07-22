module.exports = function initList(req, res, next) {
	var keystone = req.keystone;
	req.list = keystone.list(req.params.list);

	if (!req.list) {
		if (req.headers.accept === 'application/json') {
			return res.status(404).json({error: 'invalid list path'});
		}
		req.flash('error', 'List ' + req.params.list + ' could not be found.');
		return res.redirect('/' + keystone.get('admin path'));
	} else {

		if (!req.user.modulesList.includes(req.list.key) && !req.user.isRoot) {
			// return res.status(501).json({error: 'invalid list path'});
			next(new Error('test'));
		} else {
			next();
		}
	}

};
