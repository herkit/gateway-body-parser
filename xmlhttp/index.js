var parseString = require('xml2js').parseString,
    // inlined from connect's 'utils.js' file
    utils = {
        hasBody: function (req) {
            var encoding = 'transfer-encoding' in req.headers,
                length = 'content-length' in req.headers && req.headers['content-length'] !== '0';
            return encoding || length;
        },
        mime: function (req) {
            var str = req.headers['content-type'] || '';
            return str.split(';')[0];
        },
        messageType: function(req) {
            if (req.headers['psw-message-type'])
                return req.headers['psw-message-type'].toLowerCase();
            return undefined;
        },
        transform: require('./transform'),
        reply: require('./reply')
   };

module.exports = function(opts) {
    return function (req, res, next) {
        var xmloptions = {
                async: true,
                explicitArray: false,
                normalize: true,
                normalizeTags: true,
                trim: true
            };

        var data = '';
        opts = opts || {};

        if (!opts.gatewayBody && req._body) {
            return next();
        }

        if (!opts.gatewayBody)
            req.body = req.body || {};
        else
            req.gateway = req.gateway || {};

        if (!utils.hasBody(req) || !exports.xmlhttpregexp.test(utils.mime(req)) || !utils.messageType(req)) {
            return next();
        }

        if (!opts.gatewayBody)
            req._body = true;

        req.setEncoding('utf-8');
        req.on('data', function (chunk) {
            data += chunk;
        });

        req.on('end', function () {
            parseString(data, xmloptions, function (err, xml) {
                var type = utils.messageType(req); 
                if (err) {
                    err.status = 400;
                    return next(err);
                }
                var bodycontent = {
                    type: type,
                    data: utils.transform[type](xml)
                }
                if (!opts.gatewayBody) {
                    req.body = bodycontent;
                    res.gatewayResponse = function() {
                        utils.reply[type](res, req.body);
                    }
                }
                else
                {
                    req.gateway = bodycontent;
                    res.gatewayResponse = function() {
                        utils.reply[type](res, req.gateway);
                    }
                }

                req.rawBody = data;
                next();
            });
        });
    }
}

exports.xmlhttpregexp = /^(application\/xml)$/i;