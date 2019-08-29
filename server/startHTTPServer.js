/**
 * Configures and starts express server.
 *
 * Events are fired during initialisation to allow customisation, including:
 *   - onHttpServerCreated
 *
 * consumed by lib/core/start.js
 *
 * @api private
 */

var http = require('http');
var io = require('socket.io');

const redisAdapter = require('socket.io-redis');


module.exports = function (keystone, app, callback) {

	var host = keystone.get('host');
	var port = keystone.get('port');
	var forceSsl = (keystone.get('ssl') === 'force');

	keystone.httpServer = http
		.createServer(app)
		.listen(port, host, function ready(err) {
			if (err) {
				return callback(err);
			}

			var message = keystone.get('name') + ' is ready on AWS '
				+ 'http://' + host + ':' + port
				+ (forceSsl ? ' (SSL redirect)' : '');


			io = io.listen(keystone.httpServer);
			io.adapter(redisAdapter({url: process.env.REDIS_URI}));
			keystone.set('socket', io);

			// io.on('connection', (socket) => {
			// 	console.log(socket.handshake.query)
			// });

			if (keystone.get('socket use')) {
				var socket_mw = keystone.get('socket use');
				for (var i = 0; i < socket_mw.length; i++) {
					io.use(socket_mw[i])
				}
			}

			if (keystone.get('socket listeners')) {
				var socket_listeners = keystone.get('socket listeners');
				for (var i = 0; i < socket_listeners.length; i++) {
					var socket_listener = socket_listeners[i];
					if (socket_listener && typeof socket_listener.fn === 'function') {
						console.log('Listening socket on ', socket_listener.type)
						io.on(socket_listener.type, socket_listener.fn)
					}
				}
			}
			// io.use();


			callback(null, message);
		});

};
