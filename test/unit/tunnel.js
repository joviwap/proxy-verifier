'use strict';

var _ = require('underscore');
var expect = require('chai').expect;

var ProxyVerifier = require('../../');
var helpers = require('../helpers');

describe('testTunnel(proxy[, options], cb)', function() {

	var appServer;

	before(function() {
		appServer = helpers.createAppServer(3001, '127.0.0.1');
	});

	after(function() {
		appServer.http.close();
		appServer.https.close();
	});

	var proxyServers = {};

	before(function() {
		proxyServers.withTunneling = helpers.createProxyServer(5050, '127.0.0.2');
		proxyServers.withoutTunneling = helpers.createProxyServer(5051, '127.0.0.3', { tunnel: false });
	});

	after(function() {
		_.each(_.values(proxyServers), function(proxyServer) {
			proxyServer.close();
			proxyServer.http.close();
			proxyServer.https.close();
		});
	});

	it('should be a function', function() {
		expect(ProxyVerifier.testTunnel).to.be.a('function');
	});

	it('proxy with tunneling', function(done) {

		var proxyServer = proxyServers.withTunneling;
		var proxyProtocol = 'http';

		var proxy = {
			ipAddress: proxyServer[proxyProtocol].address().address,
			port: proxyServer[proxyProtocol].address().port,
			protocols: [proxyProtocol]
		};

		var options = {
			// The HTTPS app server listens on port 3002.
			testUrl: 'https://127.0.0.1:3002/check',
			requestOptions: {
				strictSSL: false,
				agentOptions: {
					rejectUnauthorized: false
				},
				timeout: 100
			}
		};

		ProxyVerifier.testTunnel(proxy, options, function(error, result) {

			try {
				expect(error).to.equal(null);
				expect(result).to.deep.equal({ ok: true });
			} catch (error) {
				return done(error);
			}

			done();
		});
	});

	it('proxy without tunneling', function(done) {

		var proxyServer = proxyServers.withoutTunneling;
		var proxyProtocol = 'http';

		var proxy = {
			ipAddress: proxyServer[proxyProtocol].address().address,
			port: proxyServer[proxyProtocol].address().port,
			protocols: [proxyProtocol]
		};

		var options = {
			// The HTTPS app server listens on port 3002.
			testUrl: 'https://127.0.0.1:3002/check',
			requestOptions: {
				strictSSL: false,
				agentOptions: {
					rejectUnauthorized: false
				},
				timeout: 100
			}
		};

		ProxyVerifier.testTunnel(proxy, options, function(error, result) {

			try {
				expect(error).to.equal(null);
				expect(result).to.be.an('object');
				expect(result.ok).to.equal(false);
				expect(result.error).to.not.equal(undefined);
				expect(result.error).to.be.an('object');
				expect(result.error.message).to.be.a('string');
				expect(result.error.message).to.not.equal('');
			} catch (error) {
				return done(error);
			}

			done();
		});
	});
});
