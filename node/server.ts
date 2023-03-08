import * as proxy from "express-http-proxy";
import * as express from "express";
import * as cors from "cors";
import * as compression from "compression";
import * as zlib from "zlib";
import * as expressStaticGzip from "express-static-gzip";
import * as fs from "fs";
import * as https from "https";
import * as http from "http";
import * as path from "path";

import * as helmet from "helmet";
import * as hidePoweredBy from "hide-powered-by";
import * as csp  from "helmet-csp";
import * as nocache  from "nocache";
import * as nosniff  from "dont-sniff-mimetype";
import * as frameguard  from "frameguard";
import * as xssFilter  from "frameguard";
import bodyParser = require("body-parser");

const app: express.Application = express();
const reportTo = require('report-to')

let configFile = '/proxy-config.json';
let host = 'localhost:9090';
let authToken = 'nosecrets';
let port = '80';
let sslPort = '4443';
let supportSSL = false;
let validAPIGWCert = "1";
let APIGWHasSSL = true;
let isEmbedIFRAME = false;
let tlsVersion = '';
let hstsExpireTime = '63072000';
let tlsversionSet = ['TLSv1_method', 'TLSv1_1_method', 'TLSv1_2_method'];
let cipherSet = [];
let allowedOrigins = [];
let jsonParser = bodyParser.json();
let referer = '';

const google_analytics = 'https://www.google-analytics.com';
const bootstarp_cdn = 'https://maxcdn.bootstrapcdn.com';
const countrycode_css = 'https://cdnjs.cloudflare.com/ajax/libs/intl-tel-input/16.0.1/js/utils.js';

// Enable packet compression of each response
app.use(compression({level: zlib.Z_BEST_COMPRESSION, strategy: zlib.Z_DEFAULT_STRATEGY}));
// Set route to fetch compressed content
if (fs.existsSync(__dirname + '/src/zip')) {
   app.use("/zip", expressStaticGzip(__dirname + '/src/zip', {
	   enableBrotli: false,
    customCompressions: [{
        encodingName: "gzip",
        fileExtension: "gz"
    }]
   }));
}

//update configurations using config.json
const configuration = JSON.parse(
	fs.readFileSync(__dirname + configFile, "utf8")
);
// //update user-configurations using config.json for functional server
// var userConfiguration = JSON.parse(
// 	fs.readFileSync(userConfigFile)
// );

//Set well-known web vulnerabilities by setting HTTP headers appropriately
app.use(helmet());

//Hackers can exploit known vulnerabilities in Express/Node if they see that your site is
//powered by Express (or whichever framework you use)
app.use(hidePoweredBy());
app.disable('x-powered-by');

//Abolish all JS client-side caching.
app.use(nocache());

//Browsers will try to "sniff" mimetypes. For example, if my server serves file.txt with a text/plain content-type,
//some browsers can still run that file with <script src="file.txt"></script>
app.use(nosniff());

//The X-Frame-Options HTTP header restricts who can put your site in a frame
// action either can be {action:'deny'}, {action:'sameorigin'}, {action: 'allow-from', domain: 'http://example.com'}
app.use(frameguard({ action: 'deny' }));

//The X-XSS-Protection HTTP header is a basic protection against XSS
app.use(xssFilter());
// add report-to header
app.use(reportTo({
    groups: [
        {
            group: "reportToEndpoint",
            max_age: 10886400,
            include_subdomains: true,
            endpoints: [
                {
                    url: "/report-violation",
                    priority: 1
                }
            ]
        }
    ]
}));
//Content Security Policy helps prevent unwanted content being injected into your webpages
app.use(csp({
	directives: {
	defaultSrc: ["'self'"],
	scriptSrc: ["'self'", google_analytics,countrycode_css ],
	// phoneScriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'",countrycode_css ],
	styleSrc: ["'self'", "'unsafe-inline'",bootstarp_cdn],
	fontSrc: ["'self'", bootstarp_cdn],
	imgSrc: ["'self'", google_analytics,countrycode_css],
	sandbox: ['allow-forms', 'allow-scripts', 'allow-same-origin', 'allow-popups'],
	reportUri: '/report-violation',
	reportTo: 'reportToEndpoint',
	objectSrc: ["'none'"]
	},
	// This module will detect common mistakes in your directives and throw errors
	// if it finds any. To disable this, enable "loose mode".
	loose: true,

	// Set to true if you only want browsers to report errors, not block them.
	// You may also set this to a function(req, res) in order to decide dynamically
	// whether to use reportOnly mode, e.g., to allow for a dynamic kill switch.
	reportOnly: false,

	// Set to true if you want to blindly set all headers: Content-Security-Policy,
	// X-WebKit-CSP, and X-Content-Security-Policy.
	setAllHeaders: false,

	// Set to true if you want to disable CSP on Android where it can be buggy.
	disableAndroid: false,

	// Set to false if you want to completely disable any user-agent sniffing.
	// This may make the headers less compatible but it will be much faster.
	// This defaults to `true`.
	browserSniff: true
}));

host = configuration.apigw_ip_port.value;
port = configuration.local_webserver_port.value;
authToken = configuration.auth_token.value;
sslPort = configuration.local_webserver_ssl_port.value;
supportSSL = (configuration.support_ssl.value.trim() === 'true')?true:false;
validAPIGWCert = (configuration.gateway_certificate_is_valid.value.trim()=== 'true')?"1":"0";
APIGWHasSSL = (configuration.gateway_has_certificate.value.trim()=== 'true')?true:false;
isEmbedIFRAME = (configuration.embed_iFrame.value.trim() === 'true')?true:false;
tlsVersion = configuration.tls_version.value;
hstsExpireTime = configuration.hsts_expire_time.value;
cipherSet = configuration.cipher_set.value;
allowedOrigins = configuration.allow_origins.value;

//this will bypass certificate errors in node to API gateway encrypted channel, if set to '1'
//if '0' communication will be blocked. So production this should be set to '0'
process.env.NODE_TLS_REJECT_UNAUTHORIZED = validAPIGWCert;

let privateKey, certificate, credentials;

if (supportSSL) {
	privateKey = fs.readFileSync(__dirname + '/sslcert/server.key', 'utf8');
	certificate = fs.readFileSync(__dirname + '/sslcert/server.crt', 'utf8');

	credentials = { key: privateKey, cert: certificate };
	if (tlsVersion.length > 0 && tlsversionSet.indexOf(tlsVersion) !== -1) {
		credentials.secureProtocol = tlsVersion;
	}
	if (cipherSet.length > 0) {
		credentials.ciphers = cipherSet.join(':');
	}
}
// middleware to catch referer url
app.use(function (req, res, next) {
	referer = req.get('referer');
	return next();
});

const options = {
	setHeaders: function (res, path, stat) {
		res = handleHeaders(res);
	}
}

const corsOptions = {
	origin: function (origin, callback) {
		// for some requests it needs to check the same origin manually(ex: font requests)
		if (allowedOrigins.indexOf(origin) !== -1 || (referer && referer.includes(origin)) || !origin) {
			callback(null, true)
		} else {
			callback(new Error('Not allowed by CORS'))
		}
	}
}
app.use(cors(corsOptions));
app.use(express.static(__dirname + '/src', options));


// Redirect no_branch requests to index.html
app.get('/no_support$', (req, res) => {
	res = handleHeaders(res);
  	res.sendFile(path.join(__dirname + '/src', 'index.html'));
});

// Redirect no_branch requests to index.html
app.get('/no_branch$', (req, res) => {
	res = handleHeaders(res);
  	res.sendFile(path.join(__dirname + '/src', 'index.html'));
});

// Redirect fingerprint
app.get('/fingerprintjs2$', (req, res) => {
	res = handleHeaders(res);
  	res.sendFile(path.join(__dirname + '/src', 'fingerprint2.js'));
});
// Redirect no_visit requests to index.html
app.get('/no_visit$', (req, res) => {
	res = handleHeaders(res);
  	res.sendFile(path.join(__dirname + '/src', 'index.html'));
});

// Redirect all requests that start with branches and end, to index.html
app.get('/branches*', (req, res) => {
	res = handleHeaders(res);
  	res.sendFile(path.join(__dirname + '/src', 'index.html'));
});

// Redirect all requests that start with services and end, to index.html
app.get('/services$',  (req, res) => {
	res = handleHeaders(res);
  	res.sendFile(path.join(__dirname + '/src', 'index.html'));
});

// Redirect all requests that start with ticket info and end, to index.html
app.get('/ticket$',  (req, res) => {
	res = handleHeaders(res);
  	res.sendFile(path.join(__dirname + '/src', 'index.html'));
});

// Redirect all requests that start with branches and end, to index.html
app.get('/open_hours$', (req, res) => {
	res = handleHeaders(res);
  	res.sendFile(path.join(__dirname + '/src', 'index.html'));
});
// Redirect all requests that start with appointment and end, to index.html
app.get('/appointment$', (req, res) => {
	res = handleHeaders(res);
  	res.sendFile(path.join(__dirname + '/src', 'index.html'));
});

// Redirect all requests that start with customer data and end, to index.html
app.get('/customer_data$', (req, res) => {
	res = handleHeaders(res);
  	res.sendFile(path.join(__dirname + '/src', 'index.html'));
});

// Redirect all requests that start with privacy policy and end, to index.html
app.get('/privacy_policy$', (req, res) => {
	res = handleHeaders(res);
  	res.sendFile(path.join(__dirname + '/src', 'index.html'));
});

// Redirect all requests that start with delays and end, to index.html
app.get('/delays$', (req, res) => {
	res = handleHeaders(res);
  	res.sendFile(path.join(__dirname + '/src', 'index.html'));
});

app.get('/cookie_consent$', (req, res) => {
	res = handleHeaders(res);
  	res.sendFile(path.join(__dirname + '/src', 'index.html'));
});

app.get('/otp_number$', (req, res) => {
	res = handleHeaders(res);
  	res.sendFile(path.join(__dirname + '/src', 'index.html'));
});

app.get('/otp_pin$', (req, res) => {
	res = handleHeaders(res);
  	res.sendFile(path.join(__dirname + '/src', 'index.html'));
});
app.get('/unauthorized$', (req, res) => {
	res = handleHeaders(res);
  	res.sendFile(path.join(__dirname + '/src', 'index.html'));
});
app.use('/report-violation', express.json({ type: 'application/json' }));  // for old browsers
app.use('/report-violation', express.json({ type: 'application/reports+json' })); // for report-to directive
app.use('/report-violation', express.json({ type: 'application/csp-report' }));  // for report-uri directive

app.post('/report-violation$', (req, res) => {
	let filePath =  __dirname + "/violations.json";
	let reportObj;
	if (req['body']['csp-report']) {
		// coming from report-uri
		reportObj = req['body']['csp-report'];
		// add timestamp
		reportObj['Date'] = new Date().toUTCString();
	} else if (req['body']) {
		// coming from report-to
		reportObj = req['body'];
		// add timestamp
		reportObj.forEach(function (obj) {
			obj.Date = new Date().toUTCString();
		});
	}
	if (fs.existsSync(filePath)) {
		const jsonString = fs.readFileSync(filePath);
		let jsonArr = JSON.parse(jsonString.toString());
		// remove the oldest record if the count reached 20
		if (jsonArr.length > 19) {
			jsonArr.shift();
		}
		jsonArr.push(reportObj);
		fs.writeFileSync(filePath, JSON.stringify(jsonArr));
	} else {
		fs.writeFileSync(filePath, JSON.stringify([reportObj]));
	}

	res = handleHeaders(res);
	res.status(200).send("violation recorded");
});

// Proxy mobile example to API gateway
const apiProxy = proxy(host, {
	// ip and port off apigateway

	proxyReqPathResolver: (req) => {
		if ( ticketToken === "enable" && req.originalUrl.slice(-12) === "ticket/issue" ) {
			if (req.body.token){
				checkToken(req.body.token);
			} else {
				req.abort();
			}

		}
		return require('url').parse(req.originalUrl).path;
	},
	proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
		proxyReqOpts.headers['auth-token'] = authToken		// api_token for mobile user
		proxyReqOpts.headers['Content-Type'] = 'application/json'
		return proxyReqOpts;
	},
	userResHeaderDecorator(headers, userReq, userRes, proxyReq, proxyRes) {
		removeXPoweredBy(headers);
		if (isEmbedIFRAME === false) {
			headers['X-Frame-Options'] = "DENY";
		}
		headers['Content-Security-Policy'] = "default-src \'self\'";

		if (supportSSL) {
			headers['Strict-Transport-Security'] = "max-age=" + hstsExpireTime + "; includeSubDomains";
		}
		return headers;
	},
	https: APIGWHasSSL
});

const apiFindProxy = proxy(host, {	// ip and port off apigateway
	proxyReqPathResolver: (req) => {
		var newUrl = req.originalUrl.replace("/MobileTicket/MyAppointment/find/","/rest/calendar-backend/api/v1/appointments/publicid/");
		return require('url').parse(newUrl).path;
	},
	proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
		proxyReqOpts.headers['auth-token'] = authToken		// api_token for mobile user
		proxyReqOpts.headers['Content-Type'] = 'application/json'
		return proxyReqOpts;
	},
	userResHeaderDecorator(headers, userReq, userRes, proxyReq, proxyRes) {
		removeXPoweredBy(headers);
		if (isEmbedIFRAME === false) {
			headers['X-Frame-Options'] = "DENY";
		}
		headers['Content-Security-Policy'] = "default-src \'self\'";

		if (supportSSL) {
			headers['Strict-Transport-Security'] = "max-age=" + hstsExpireTime + "; includeSubDomains";
		}
		return headers;
	},
	https: APIGWHasSSL,
	userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
		const data = JSON.parse(proxyResData.toString('utf8'));
		const newData:any = {};
		newData.appointment = {};
		if (data.appointment !== undefined) {
			var CryptoJS = require("crypto-js");
			var encryptedText = CryptoJS.AES.encrypt(data.appointment.qpId.toString(), authToken ).toString();
			newData.appointment.qpId = encryptedText
			newData.appointment.branch = data.appointment.branch;
			newData.appointment.start = data.appointment.start;
			newData.appointment.services = data.appointment.services;
		}
		return JSON.stringify(newData);
	}
});
const apiTranslationProxy = proxy(host, {	// ip and port off apigateway
	proxyReqPathResolver: (req) => {
		var newUrl = req.originalUrl.replace("/MobileTicket/translations/","/rest/calendar-backend/api/v1/");
		return require('url').parse(newUrl).path;
	},
	proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
		proxyReqOpts.headers['auth-token'] = authToken		// api_token for mobile user
		proxyReqOpts.headers['Content-Type'] = 'application/json'
		return proxyReqOpts;
	},
	userResHeaderDecorator(headers, userReq, userRes, proxyReq, proxyRes) {
		removeXPoweredBy(headers);
		if (isEmbedIFRAME === false) {
			headers['X-Frame-Options'] = "DENY";
		}
		headers['Content-Security-Policy'] = "default-src \'self\'";

		if (supportSSL) {
			headers['Strict-Transport-Security'] = "max-age=" + hstsExpireTime + "; includeSubDomains";
		}
		return headers;
	},
	https: APIGWHasSSL,
	userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
		const data = JSON.parse(proxyResData.toString('utf8'));
		const newData:any = {};

		if (data.serviceList !== undefined) {
			newData.serviceList = [];
			data.serviceList.forEach(service => {
				let newService:any = {};
                newService.qpId = service.qpId;
                newService.name = service.name;
                newService.custom = service.custom;
                newData.serviceList.push(newService);
			});
		}
		// else if (data.branchList !== undefined) {
		// 	newData.branchList = [];
		// 	data.branchList.forEach(branch => {
		// 		let newBranch:any = {};
        //         newBranch.qpId = branch.qpId;
		// 		newBranch.name = branch.name;
        //         newBranch.custom = branch.custom;
        //         newData.branchList.push(newBranch);
		// 	});
		// }
		return JSON.stringify(newData);
	}
});
const apiFindExtProxy = proxy(host, {	// ip and port off apigateway
	proxyReqPathResolver: (req) => {
		var newUrl = req.originalUrl.replace("/MobileTicket/MyAppointment/findCentral/external/","/rest/appointment/appointments/external/");
		return require('url').parse(newUrl).path;
	},
	proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
		proxyReqOpts.headers['auth-token'] = authToken		// api_token for mobile user
		proxyReqOpts.headers['Content-Type'] = 'application/json'
		return proxyReqOpts;
	},
	userResHeaderDecorator(headers, userReq, userRes, proxyReq, proxyRes) {
		removeXPoweredBy(headers);
		if (isEmbedIFRAME === false) {
			headers['X-Frame-Options'] = "DENY";
		}
		headers['Content-Security-Policy'] = "default-src \'self\'";

		if (supportSSL) {
			headers['Strict-Transport-Security'] = "max-age=" + hstsExpireTime + "; includeSubDomains";
		}
		return headers;
	},
	https: APIGWHasSSL,
	userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
		if (proxyResData.toString('utf8')==='') {
            return '';
        }
		const data = JSON.parse(proxyResData.toString('utf8'));
		const newData:any = {};
		newData.properties = {};

		if (data !== undefined) {
			var CryptoJS = require("crypto-js");
			var encryptedText = CryptoJS.AES.encrypt( data.id.toString(), authToken ).toString();
			newData.id =  encryptedText
			newData.properties.publicId = data.properties.publicId;

			newData.services = data.services;
			newData.status = data.status
			newData.branchId = data.branchId;
			newData.startTime = data.startTime;
			newData.endTime = data.endTime;

			newData.properties.notes = (data.properties && data.properties.notes) || '';
			newData.properties.custom = (data.properties && data.properties.custom) || '';
		}
		return JSON.stringify(newData);
	}
});

const apiFindCentralProxy = proxy(host, {	// ip and port off apigateway
	proxyReqPathResolver: (req) => {
		var newUrl = req.originalUrl.replace("/MobileTicket/MyAppointment/findCentral/","/rest/appointment/appointments/");
		return require('url').parse(newUrl).path;
	},
	proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
		proxyReqOpts.headers['auth-token'] = authToken		// api_token for mobile user
		proxyReqOpts.headers['Content-Type'] = 'application/json'
		return proxyReqOpts;
	},
	userResHeaderDecorator(headers, userReq, userRes, proxyReq, proxyRes) {
		removeXPoweredBy(headers);
		if (isEmbedIFRAME === false) {
			headers['X-Frame-Options'] = "DENY";
		}
		headers['Content-Security-Policy'] = "default-src \'self\'";

		if (supportSSL) {
			headers['Strict-Transport-Security'] = "max-age=" + hstsExpireTime + "; includeSubDomains";
		}
		return headers;
	},
	https: APIGWHasSSL,
	userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
		let data = JSON.parse(proxyResData.toString('utf8'));
		let newData:any = {};
		if (data !== undefined) {
			newData.services = data.services;
			newData.status = data.status
			newData.branchId = data.branchId;
			newData.startTime = data.startTime;
			newData.endTime = data.endTime;
			newData.properties = {};
			newData.properties.notes = (data.properties && data.properties.notes) || '';
			newData.properties.custom = (data.properties && data.properties.custom) || '';
		}
		return JSON.stringify(newData);
	}
});


const apiFindCentralByEIdProxy = proxy(host, {	// ip and port off apigateway
	proxyReqPathResolver: (req) => {
		// decode qpId
		var CryptoJS = require("crypto-js");
        var decrptedText = CryptoJS.AES.decrypt(req.originalUrl.split('findCentral/id/')[1], authToken).toString(CryptoJS.enc.Utf8);
        var newUrl = req.originalUrl.split('findCentral/id/')[0] + 'findCentral/' + decrptedText;
        newUrl = newUrl.replace("/MobileTicket/MyAppointment/findCentral/", "/rest/appointment/appointments/");
		return require('url').parse(newUrl).path;
	},
	proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
		proxyReqOpts.headers['auth-token'] = authToken		// api_token for mobile user
		proxyReqOpts.headers['Content-Type'] = 'application/json'
		return proxyReqOpts;
	},
	userResHeaderDecorator(headers, userReq, userRes, proxyReq, proxyRes) {
		removeXPoweredBy(headers);
		if (isEmbedIFRAME === false) {
			headers['X-Frame-Options'] = "DENY";
		}
		headers['Content-Security-Policy'] = "default-src \'self\'";

		if (supportSSL) {
			headers['Strict-Transport-Security'] = "max-age=" + hstsExpireTime + "; includeSubDomains";
		}
		return headers;
	},
	https: APIGWHasSSL,
	userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
		let data = JSON.parse(proxyResData.toString('utf8'));
		let newData:any = {};
		if (data !== undefined) {
			newData.services = data.services;
			newData.status = data.status
			newData.branchId = data.branchId;
			newData.startTime = data.startTime;
			newData.endTime = data.endTime;
			newData.properties = {};
			newData.properties.notes = (data.properties && data.properties.notes) || '';
			newData.properties.custom = (data.properties && data.properties.custom) || '';
		}
		return JSON.stringify(newData);
	}
});

const apiEntryPointProxy = proxy(host, {
	// ip and port off apigateway

	proxyReqPathResolver: (req) => {
		var newUrl = req.originalUrl.replace("/MobileTicket/MyAppointment/entrypoint/branches/","/rest/entrypoint/branches/");
		return require('url').parse(newUrl).path;
	},
	proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
		proxyReqOpts.headers['auth-token'] = authToken		// api_token for mobile user
		proxyReqOpts.headers['Content-Type'] = 'application/json'
		return proxyReqOpts;
	},
	userResHeaderDecorator(headers, userReq, userRes, proxyReq, proxyRes) {
		removeXPoweredBy(headers);
		if (isEmbedIFRAME === false) {
			headers['X-Frame-Options'] = "DENY";
		}
		headers['Content-Security-Policy'] = "default-src \'self\'";

		if (supportSSL) {
			headers['Strict-Transport-Security'] = "max-age=" + hstsExpireTime + "; includeSubDomains";
		}
		return headers;
	},
	https: APIGWHasSSL
});


const apiCustomParameterProxy = proxy(host, {
	// ip and port off apigateway

	proxyReqPathResolver: (req) => {
		var newUrl = req.originalUrl.replace("/MobileTicket/MyVisit/entrypoint/branches/","/rest/entrypoint/branches/");
		return require('url').parse(newUrl).path;
	},
	proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
		proxyReqOpts.headers['auth-token'] = authToken		// api_token for mobile user
		proxyReqOpts.headers['Content-Type'] = 'application/json'
		return proxyReqOpts;
	},
	userResHeaderDecorator(headers, userReq, userRes, proxyReq, proxyRes) {
		removeXPoweredBy(headers);
		if (isEmbedIFRAME === false) {
			headers['X-Frame-Options'] = "DENY";
		}
		headers['Content-Security-Policy'] = "default-src \'self\'";

		if (supportSSL) {
			headers['Strict-Transport-Security'] = "max-age=" + hstsExpireTime + "; includeSubDomains";
		}
		return headers;
	},
	https: APIGWHasSSL,
	userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
		const data = JSON.parse(proxyResData.toString('utf8'));
		let newData:any = {};
		newData.parameterMap = {};
		if (data !== undefined) {
			newData.parameterMap.userId = data.parameterMap.userId;
		}
		return JSON.stringify(newData);
	}
});

const apiArriveProxy = proxy(host, {
	// ip and port off apigateway

	proxyReqPathResolver: (req) => {
		var newUrl = req.originalUrl.replace("/MobileTicket/MyAppointment/arrive/branches/","/rest/entrypoint/branches/");
		return require('url').parse(newUrl).path;
	},
	proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
		proxyReqOpts.headers['auth-token'] = authToken		// api_token for mobile user
		proxyReqOpts.headers['Content-Type'] = 'application/json'
		return proxyReqOpts;
	},

	proxyReqBodyDecorator: function(bodyContent, srcReq) {
        var CryptoJS = require("crypto-js");
        var decrptedText = CryptoJS.AES.decrypt(bodyContent.appointmentId, authToken).toString(CryptoJS.enc.Utf8);
        var returnText = {
            ... bodyContent,
            'appointmentId' : parseInt(decrptedText)
       }
        return JSON.stringify(returnText);
    },

	userResHeaderDecorator(headers, userReq, userRes, proxyReq, proxyRes) {
		removeXPoweredBy(headers);
		if (isEmbedIFRAME === false) {
			headers['X-Frame-Options'] = "DENY";
		}
		headers['Content-Security-Policy'] = "default-src \'self\'";

		if (supportSSL) {
			headers['Strict-Transport-Security'] = "max-age=" + hstsExpireTime + "; includeSubDomains";
		}
		return headers;
	},
	https: APIGWHasSSL,
	userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
		const data = JSON.parse(proxyResData.toString('utf8'));
		let newData:any = {};
		newData.parameterMap = {};
		if (data !== undefined) {
			newData.id = data.id;
			newData.ticketId = data.ticketId;
			newData.currentVisitService = data.currentVisitService;
			newData.checksum = data.checksum;
			newData.parameterMap.startQueueOrigId = data.parameterMap.startQueueOrigId;
			newData.parameterMap.branchName = data.parameterMap.branchName;
		}
		return JSON.stringify(newData);
	}
});

const apiMeetingProxy = proxy(host, {
	// ip and port off apigateway

	proxyReqPathResolver: (req) => {
		var newUrl = req.originalUrl.replace("/MobileTicket/MyMeeting/branches/","/rest/entrypoint/branches/");
		return require('url').parse(newUrl).path;
	},
	proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
		proxyReqOpts.headers['auth-token'] = authToken		// api_token for mobile user
		proxyReqOpts.headers['Content-Type'] = 'application/json'
		return proxyReqOpts;
	},
	userResHeaderDecorator(headers, userReq, userRes, proxyReq, proxyRes) {
		removeXPoweredBy(headers);
		if (isEmbedIFRAME === false) {
			headers['X-Frame-Options'] = "DENY";
		}
		headers['Content-Security-Policy'] = "default-src \'self\'";

		if (supportSSL) {
			headers['Strict-Transport-Security'] = "max-age=" + hstsExpireTime + "; includeSubDomains";
		}
		return headers;
	},
	https: APIGWHasSSL,
	userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
		const data = JSON.parse(proxyResData.toString('utf8'));
		let newData:any = {};
		newData.parameterMap = {};
		if (data !== undefined) {
			newData.ticketId = data.ticketId;
			newData.checksum = data.checksum;
			newData.parameterMap.meetingUrl = data.parameterMap.meetingUrl;
		}
		return JSON.stringify(newData);
	}
});

const apiDelayProxy = proxy(host, {
	// ip and port off apigateway

	proxyReqPathResolver: (req) => {
		var newUrl = req.originalUrl.replace("/MobileTicket/DelayVisit/branches/","/rest/entrypoint/branches/");
		return require('url').parse(newUrl).path;
	},
	proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
		proxyReqOpts.headers['auth-token'] = authToken		// api_token for mobile user
		proxyReqOpts.headers['Content-Type'] = 'application/json'
		return proxyReqOpts;
	},
	userResHeaderDecorator(headers, userReq, userRes, proxyReq, proxyRes) {
		removeXPoweredBy(headers);
		if (isEmbedIFRAME === false) {
			headers['X-Frame-Options'] = "DENY";
		}
		headers['Content-Security-Policy'] = "default-src \'self\'";

		if (supportSSL) {
			headers['Strict-Transport-Security'] = "max-age=" + hstsExpireTime + "; includeSubDomains";
		}
		return headers;
	},
	https: APIGWHasSSL
});

var apiBranchScheduleProxy = proxy(host, {
	// ip and port off apigateway

	proxyReqPathResolver: (req) => {
		var newUrl = req.originalUrl.replace("/MobileTicket/BranchSchedule","/rest/servicepoint");
		return require('url').parse(newUrl).path;
	},
	proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
		proxyReqOpts.headers['auth-token'] = authToken		// api_token for mobile user
		proxyReqOpts.headers['Content-Type'] = 'application/json'
		return proxyReqOpts;
	},
	userResHeaderDecorator(headers, userReq, userRes, proxyReq, proxyRes) {
		removeXPoweredBy(headers);
		if (isEmbedIFRAME === false) {
			headers['X-Frame-Options'] = "DENY";
		}
		headers['Content-Security-Policy'] = "default-src \'self\'";

		if (supportSSL) {
			headers['Strict-Transport-Security'] = "max-age=" + hstsExpireTime + "; includeSubDomains";
		}
		return headers;
	},
	https: APIGWHasSSL
});

var apiEventProxy = proxy(host, {
	// ip and port off apigateway

	proxyReqPathResolver: (req) => {
		var newUrl = req.originalUrl.replace("/MobileTicket/MyVisit/LastEvent","/rest/servicepoint");
		return require('url').parse(newUrl).path;
	},
	proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
		proxyReqOpts.headers['auth-token'] = authToken		// api_token for mobile user
		proxyReqOpts.headers['Content-Type'] = 'application/json'
		return proxyReqOpts;
	},
	userResHeaderDecorator(headers, userReq, userRes, proxyReq, proxyRes) {
		removeXPoweredBy(headers);
		if (isEmbedIFRAME === false) {
			headers['X-Frame-Options'] = "DENY";
		}
		headers['Content-Security-Policy'] = "default-src \'self\'";

		if (supportSSL) {
			headers['Strict-Transport-Security'] = "max-age=" + hstsExpireTime + "; includeSubDomains";
		}
		return headers;
	},
	https: APIGWHasSSL
});

var apiServicesGroupsProxy = proxy(host, {
	// ip and port off apigateway

	proxyReqPathResolver: function (req) {
		var newUrl = req.originalUrl.replace("/MobileTicket/servicesGroups","/rest/entrypoint/variables/servicesGroups");
		return require('url').parse(newUrl).path;
	},
	proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
		proxyReqOpts.headers['auth-token'] = authToken		// api_token for mobile user
		proxyReqOpts.headers['Content-Type'] = 'application/json'
		return proxyReqOpts;
	},
	userResHeaderDecorator(headers, userReq, userRes, proxyReq, proxyRes) {
		removeXPoweredBy(headers);
		if (isEmbedIFRAME === false) {
			headers['X-Frame-Options'] = "DENY";
		}
		headers['Content-Security-Policy'] = "default-src \'self\'";

		if (supportSSL) {
			headers['Strict-Transport-Security'] = "max-age=" + hstsExpireTime + "; includeSubDomains";
		}
		return headers;
	},
	https: APIGWHasSSL
});

var ticketTokenProxy = function (req, res, next) {
	res.removeHeader("X-Powered-By");
	if (ticketToken === "enable") {
	  if (req.body.token) {
		checkToken(req.body.token).then((status) => {
		  switch (status) {
			  case 200: {
				  if(req.body.parameters){
					delete req.body.token;
				  }
				  next();
				  break;
			  }
			  case 208: {
				  res.sendStatus(403);
				  break;
			  }
			  case 500: {
				  res.sendStatus(500);
				  break;
			  }
			  default: {
				  res.sendStatus(403);
				  break;
			  }
		  }
		});
	  } else {
		res.sendStatus(400);
	  }
	} else {
	  next();
	}
  };

const handleHeaders = (res) => {
	if (isEmbedIFRAME === false) {
		res.set('X-Frame-Options', "DENY");
	} else {
		res.removeHeader('X-Frame-Options');
	}

	if (supportSSL) {
		res.set('Strict-Transport-Security', "max-age=" + hstsExpireTime +"; includeSubDomains");
	}
	return res;
}

const removeXPoweredBy = (headers) => {
	if (headers['X-Powered-By']) {
		delete headers['X-Powered-By'];
	}
}

app.use("/geo/branches/*", apiProxy);
app.use("/MobileTicket/branches/*", apiProxy);
app.use("/MobileTicket/MyAppointment/find/*", apiFindProxy);
app.use("/MobileTicket/translations/*", apiTranslationProxy);
app.use("/MobileTicket/MyAppointment/findCentral/external/*", apiFindExtProxy);
app.use("/MobileTicket/MyAppointment/findCentral/id/*", apiFindCentralByEIdProxy);
app.use("/MobileTicket/MyAppointment/findCentral/*", apiFindCentralProxy);
app.use("/MobileTicket/MyAppointment/entrypoint/branches/*/entryPoints/deviceTypes/SW_VISITAPP", apiEntryPointProxy);
app.use("/MobileTicket/MyVisit/entrypoint/branches/*/visits/*", apiCustomParameterProxy);
app.use("/MobileTicket/MyAppointment/arrive/branches/*/entryPoints/*/visits",jsonParser, apiArriveProxy);
app.use("/MobileTicket/services/:serviceID/branches/:branchID/ticket/*",jsonParser, ticketTokenProxy);
app.use("/MobileTicket/DelayVisit/branches/:branchID/queues/:queueId/visits", apiDelayProxy);
app.use("/MobileTicket/DelayVisit/branches/:branchID/visits/:visitId", apiDelayProxy);
app.use("/MobileTicket/services/*", apiProxy);
app.use("/MobileTicket/MyVisit/LastEvent/*", apiEventProxy);
app.use("/MobileTicket/MyVisit/*", apiProxy);
app.use("/MobileTicket/MyMeeting/*", apiMeetingProxy);
app.use("/MobileTicket/BranchSchedule/*", apiBranchScheduleProxy);
app.use("/MobileTicket/servicesGroups/*", apiServicesGroupsProxy);

// MT service
let env = process.argv[2] || 'prod';
let otpService = "disable";
let ticketToken = "disable";
let tenantID = "";
let userConfigFile = __dirname + '/src/app/config/config.json';
let mtConfigFile = __dirname + '/mt-service/src/config/config.json';
if (env=='dev') {
	userConfigFile = "../src/app/config/config.json";
}
const userConfiguration = JSON.parse(fs.readFileSync(userConfigFile, "utf8"));
const mtConfiguration = JSON.parse(fs.readFileSync(mtConfigFile, "utf8"));
otpService = userConfiguration.otp_service.value;
ticketToken = userConfiguration.create_ticket_token.value;
tenantID = mtConfiguration.tenant_id.value;

const importRoutes = async (service: string) => {
  switch (service) {
    case "otp": {
      const { OtpRoutes } = await import("./mt-service/src/routes/otp.routes");
      const otpRoutes = new OtpRoutes();
      otpRoutes.route(app);
      break;
    }
    case "ticketToken": {
      const { TicketTokenRoutes } = await import("./mt-service/src/routes/ticket-token.routes");
      const ticketTokenRoutes = new TicketTokenRoutes();
      ticketTokenRoutes.route(app);
      break;
    }
  }
};

if (otpService === "enable" || ticketToken === "enable") {
  if (!(tenantID.trim().length > 0)) {
    console.log("Tenant ID is required, server needs to be restarted with `Tenant ID`");
    process.exit(0);
  } else {
    app.use(bodyParser.json());
	app.use(bodyParser.urlencoded({ extended: true }));
	if (otpService === "enable") {
		importRoutes('otp');
  	}
	if (ticketToken === "enable") {
		importRoutes('ticketToken');
  	}
    startServer();
  }
} else {
  startServer();
}

async function checkToken(token) {

    return await new Promise(function(resolve, reject) {
        var data = JSON.stringify({
            token: token,
        });
        var MT_SERVICE_TOKEN_DELETE = "/MTService/token/delete";

        var options = {
            hostname: "localhost",
            port: supportSSL ? sslPort : port,
            path: MT_SERVICE_TOKEN_DELETE,
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Content-Length": data.length,
            },
        };
		if(supportSSL){
			var tokenRequest = https.request(options, function (res) {
				resolve(res.statusCode);
			});
		} else {
			var tokenRequest = http.request(options, function (res) {
				resolve(res.statusCode);
			});
		}

		tokenRequest.on("error", function (error) {
			console.error('error :'+error);
			resolve(500);
		});
		tokenRequest.write(data);
		tokenRequest.end();
    });
}

function startServer() {
	if (supportSSL) {
		const httpsServer = https.createServer(credentials, app);
		httpsServer.listen(sslPort,  () => {
			const listenAddress = httpsServer.address()['address'];
			const listenPort = httpsServer.address()['port'];
  			console.log("MT service is running");
			console.log("Mobile Ticket app listening at https://%s:%s over SSL", listenAddress, listenPort);
		});
	} else{
		const server = app.listen(port, () => {  // port the mobileTicket will listen to.
		const listenAddress = server.address()['address'];
		const listenPort = server.address()['port'];
		console.log("MT service is running");
		console.log("Mobile Ticket app listening at http://%s:%s", listenAddress, listenPort);
	});
	}
}


