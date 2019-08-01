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

			var message = keystone.get('name') + ' is ready on '
				+ 'http://' + host + ':' + port
				+ (forceSsl ? ' (SSL redirect)' : '');


			io = io.listen(keystone.httpServer);
			keystone.set('socket', io);


			io.use(function (socket, next) {
				// console.log("Query: ", socket.handshake.query);
				// return the result of next() to accept the connection.
				if (typeof socket.handshake.query.tx !== "undefined") {
					console.log('joining room', socket.handshake.query.tx);
					socket.join('tx_' + socket.handshake.query.tx);
				}
				return next();
			});


			callback(null, message);
		});

};
