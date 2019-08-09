var _ = require('lodash');
var ejs = require('ejs');
var path = require('path');
var utils = require('keystone-utils');

var templatePath = path.resolve(__dirname, '../templates/index.html');

module.exports = function IndexRoute(req, res) {
	var keystone = req.keystone;
	var lists = {};
	var listsArray = [];
	_.forEach(keystone.lists, function (list, key) {
		lists[key] = list.getOptions();
		listsArray.push(list.getOptions());
	});

	var UserList = keystone.list(keystone.get('user model'));

	var orphanedLists = keystone.getOrphanedLists().map(function (list) {
		return _.pick(list, ['key', 'label', 'path']);
	});

	var backUrl = keystone.get('back url');
	if (backUrl === undefined) {
		// backUrl can be falsy, to disable the link altogether
		// but if it's undefined, default it to "/"
		backUrl = '/';
	}

	let nav = initNav(keystone, req.user);

	// keystone.nav.sections = navSections;
	// keystone.nav.by.section = navSectionsList;
	// keystone.nav.by.list = navSectionsList;
	// orphanedLists = navSections;

	var keystoneData = {
		adminPath: '/' + keystone.get('admin path'),
		appversion: keystone.get('appversion'),
		item_insert_sound: keystone.get('item_insert_sound'),
		item_update_sound: keystone.get('item_update_sound'),
		backUrl: backUrl,
		brand: keystone.get('brand'),
		csrf: {header: {}},
		devMode: !!process.env.KEYSTONE_DEV,
		lists: lists,
		nav: nav,
		orphanedLists: orphanedLists,
		signoutUrl: keystone.get('signout url'),
		user: {
			id: req.user.id,
			name: UserList.getDocumentName(req.user) || '(no name)',
			modules: req.user.modules || [],
		},
		userList: UserList.key,
		version: keystone.version,
		wysiwyg: {
			options: {
				enableImages: keystone.get('wysiwyg images') ? true : false,
				enableCloudinaryUploads: keystone.get('wysiwyg cloudinary images') ? true : false,
				enableS3Uploads: keystone.get('wysiwyg s3 images') ? true : false,
				additionalButtons: keystone.get('wysiwyg additional buttons') || '',
				additionalPlugins: keystone.get('wysiwyg additional plugins') || '',
				additionalOptions: keystone.get('wysiwyg additional options') || {},
				overrideToolbar: keystone.get('wysiwyg override toolbar'),
				skin: keystone.get('wysiwyg skin') || 'keystone',
				menubar: keystone.get('wysiwyg menubar'),
				importcss: keystone.get('wysiwyg importcss') || '',
			}
		},
	};
	keystoneData.csrf.header[keystone.security.csrf.CSRF_HEADER_KEY] = keystone.security.csrf.getToken(req, res);

	var codemirrorPath = keystone.get('codemirror url path')
		? '/' + keystone.get('codemirror url path')
		: '/' + keystone.get('admin path') + '/js/lib/codemirror';

	var locals = {
		adminPath: keystoneData.adminPath,
		cloudinaryScript: false,
		codemirrorPath: codemirrorPath,
		env: keystone.get('env'),
		fieldTypes: keystone.fieldTypes,
		ga: {
			property: keystone.get('ga property'),
			domain: keystone.get('ga domain'),
		},
		keystone: keystoneData,
		title: keystone.get('name') || 'Keystone',
	};

	var cloudinaryConfig = keystone.get('cloudinary config');
	if (cloudinaryConfig) {
		var cloudinary = require('cloudinary');
		var cloudinaryUpload = cloudinary.uploader.direct_upload();
		keystoneData.cloudinary = {
			cloud_name: keystone.get('cloudinary config').cloud_name,
			api_key: keystone.get('cloudinary config').api_key,
			timestamp: cloudinaryUpload.hidden_fields.timestamp,
			signature: cloudinaryUpload.hidden_fields.signature,
		};
		locals.cloudinaryScript = cloudinary.cloudinary_js_config();
	}
	;

	ejs.renderFile(templatePath, locals, {delimiter: '%'}, function (err, str) {
		if (err) {
			console.error('Could not render Admin UI Index Template:', err);
			return res.status(500).send(keystone.wrapHTMLError('Error Rendering Admin UI', err.message));
		}
		res.send(str);
	});
};

function initNav(keystone, user) {
	// var keystone = this;

	let sections = keystone.get('nav');

	const userModules = user.modules.map(function (userModule) {
		return (userModule.name + 's').toLowerCase();
	});


	let navSections = [];
	let navSectionsList = {};

	// keystone.nav.sections.forEach(function (navSection) {
	// 	if (userModules.includes(navSection.key.toString().toLowerCase())) {
	// 		navSections.push(navSection);
	// 		navSectionsList[navSection.key.toString().toLowerCase()] = navSection;
	// 	}
	// });


	var nav = {
		sections: [],
		by: {
			list: {},
			section: {},
		},
	};

	if (!sections) {
		sections = {};
		nav.flat = true;
		_.forEach(keystone.lists, function (list) {

			if (list.get('hidden') || !userModules.includes(list.key.toString().toLowerCase())) return;
			sections[list.path] = [list.path];
		});
	}

	_.forEach(sections, function (section, key) {
		if (typeof section === 'string') {
			section = [section];
		}
		section = {
			lists: section,
			label: nav.flat ? keystone.list(section[0]).label : utils.keyToLabel(key),
		};
		section.key = key;
		section.lists = _.map(section.lists, function (i) {
			if (typeof i === 'string') {
				var list = keystone.list(i);
				if (!list) {
					throw new Error('Invalid Keystone Option (nav): list ' + i + ' has not been defined.\n');
				}
				if (list.get('hidden')) {
					throw new Error('Invalid Keystone Option (nav): list ' + i + ' is hidden.\n');
				}
				nav.by.list[list.key] = section;
				return {
					key: list.key,
					label: list.label,
					path: list.path,
				};
			} else if (_.isObject(i)) {
				if (!_.has(i, 'key')) {
					throw new Error('Invalid Keystone Option (nav): object ' + i + ' requires a "key" property.\n');
				}
				i.label = i.label || utils.keyToLabel(key);
				i.path = i.path || utils.keyToPath(key);
				i.external = true;
				nav.by.list[i.key] = section;
				return i;
			}
			throw new Error('Invalid Keystone Option (nav): ' + i + ' is in an unrecognized format.\n');
		});
		if (section.lists.length && (userModules.includes(section.key.toString().toLowerCase()) || user.isRoot)) {
			nav.sections.push(section);
			nav.by.section[section.key] = section;
		}
	});

	return nav;
}
