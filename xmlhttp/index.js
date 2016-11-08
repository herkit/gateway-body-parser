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
        transform: require('./transform')
   };

module.exports = function(opts) {
    return function (req, res, next) {
        var options = {
                async: true,
                explicitArray: false,
                normalize: true,
                normalizeTags: true,
                trim: true
            };

        var data = '';

        if (req._body) {
            return next();
        }

        req.body = req.body || {};

        if (!utils.hasBody(req) || !exports.xmlhttpregexp.test(utils.mime(req)) || !utils.messageType(req)) {
            return next();
        }

        req._body = true;

        req.setEncoding('utf-8');
        req.on('data', function (chunk) {
            data += chunk;
        });

        req.on('end', function () {
            parseString(data, options, function (err, xml) {
                var type = utils.messageType(req); 
                if (err) {
                    err.status = 400;
                    return next(err);
                }
                var bodycontent = {
                    type: type,
                    data: utils.transform[type](xml)
                }
                req.body = bodycontent;
                req.rawBody = data;
                next();
            });
        });
    }
}

exports.xmlhttpregexp = /^(application\/([\w!#\$%&\*`\-\.\^~]+\+)?xml)$/i;