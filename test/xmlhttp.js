var http = require('http');
var request = require('supertest');
var gatewayBodyParser = require('..');

describe('gatewayBodyParser.xmlhttp', function() {
  it('should parse mo xml', function(done) {
    request(createServer())
    .post('/')
    .set('Content-Type', 'application/xml')
    .set('PSW-Message-type', 'MO')
    .send('<MSGLST><MSG><ID>1</ID><SND>4700000000</SND><RCV>01337</RCV><TEXT>Some text</TEXT></MSG></MSGLST>')
    .expect(200, '{"type":"mo","data":[{"sequenceId":"1","receiver":"01337","sender":"4700000000","text":"Some text","isStored":false}]}', done);
  })

  it('should parse position', function(done) {
    request(createServer())
    .post('/')
    .set('Content-Type', 'application/xml')
    .set('PSW-Message-type', 'MO')
    .send('<MSGLST><MSG><ID>1</ID><SND>4700000000</SND><RCV>01337</RCV><TEXT>Some text</TEXT><POSITION><STATUS>OK</STATUS><POS><LONGITUDE>60,12345</LONGITUDE><LATITUDE>-5,23245</LATITUDE><RADIUS>2</RADIUS><COUNCIL>Bergen</COUNCIL><COUNCILNUMBER>1501</COUNCILNUMBER><PLACE>Bergen</PLACE></POS></POSITION></MSG></MSGLST>')
    .expect(200, '{"type":"mo","data":[{"sequenceId":"1","receiver":"01337","sender":"4700000000","text":"Some text","isStored":false,"position":{"lng":60.12345,"lat":-5.23245,"radius":2,"council":"Bergen","councilNumber":"1501","place":"Bergen"}}]}', done);
  })

  it('missing radius should return -1', function(done) {
    request(createServer())
    .post('/')
    .set('Content-Type', 'application/xml')
    .set('PSW-Message-type', 'MO')
    .send('<MSGLST><MSG><ID>1</ID><SND>4700000000</SND><RCV>01337</RCV><TEXT>Some text</TEXT><POSITION><STATUS>OK</STATUS><POS><LONGITUDE>60,12345</LONGITUDE><LATITUDE>-5,23245</LATITUDE></POS></POSITION></MSG></MSGLST>')
    .expect(200, '{"type":"mo","data":[{"sequenceId":"1","receiver":"01337","sender":"4700000000","text":"Some text","isStored":false,"position":{"lng":60.12345,"lat":-5.23245,"radius":-1}}]}', done);
  })

  it('should parse metadata', function(done) {
    request(createServer())
    .post('/')
    .set('Content-Type', 'application/xml')
    .set('PSW-Message-type', 'MO')
    .send('<MSGLST><MSG><ID>1</ID><SND>4700000000</SND><RCV>01337</RCV><TEXT>Some text</TEXT><METADATA><DATA KEY="TIMESTAMP" VALUE="2016-11-08 12:00:00"/></METADATA></MSG></MSGLST>')
    .expect(200, '{"type":"mo","data":[{"sequenceId":"1","receiver":"01337","sender":"4700000000","text":"Some text","isStored":false,"metadata":{"timestamp":"2016-11-08 12:00:00"}}]}', done);
  })


  it('should parse deliveryreport', function(done) {
    request(createServer())
    .post('/')
    .set('Content-Type', 'application/xml')
    .set('PSW-Message-type', 'DR')
    .send('<MSGLST><MSG><ID>1</ID><REF>123456-1234-1234-1234-12345678</REF><RCV>4700000000</RCV><STATE>DELIVRD</STATE></MSG></MSGLST>')
    .expect(200, '{"type":"dr","data":[{"sequenceId":"1","reference":"123456-1234-1234-1234-12345678","receiver":"4700000000","state":"DELIVRD"}]}', done);
  })

  it('should parse deliveryreport with deliverytime', function(done) {
    request(createServer())
    .post('/')
    .set('Content-Type', 'application/xml')
    .set('PSW-Message-type', 'DR')
    .send('<MSGLST><MSG><ID>1</ID><REF>123456-1234-1234-1234-12345678</REF><RCV>4700000000</RCV><STATE>DELIVRD</STATE><DELIVERYTIME>2016-11-08 15:12:00</DELIVERYTIME></MSG></MSGLST>')
    .expect(200, '{"type":"dr","data":[{"sequenceId":"1","reference":"123456-1234-1234-1234-12345678","receiver":"4700000000","state":"DELIVRD","timestamp":"2016-11-08 15:12:00"}]}', done);
  })

  it('should allow deserialization to req.gateway', function(done) {
    request(createServer({ gatewayBody: true }))
    .post('/')
    .set('Content-Type', 'application/xml')
    .set('PSW-Message-type', 'MO')
    .send('<MSGLST><MSG><ID>1</ID><SND>4700000000</SND><RCV>01337</RCV><TEXT>Some text</TEXT></MSG></MSGLST>')
    .expect(200, '{"type":"mo","data":[{"sequenceId":"1","receiver":"01337","sender":"4700000000","text":"Some text","isStored":false}]}', done);
  })

  it('should create proper ok reply', function(done) {
    request(createReplyingServer({ gatewayBody: true }, 
      function(req) {
        req.gateway.data.forEach(function(message) { message.isStored = true; });
      }))
    .post('/')
    .set('Content-Type', 'application/xml')
    .set('PSW-Message-type', 'MO')
    .send('<MSGLST><MSG><ID>1</ID><SND>4700000000</SND><RCV>01337</RCV><TEXT>Some text</TEXT></MSG></MSGLST>')
    .expect(200, '<MSGLST><MSG><ID>1</ID><STATUS>OK</STATUS></MSG></MSGLST>', done);
  })

  it('should create proper fail reply', function(done) {
    request(createReplyingServer({ gatewayBody: true }, 
      function(req) {
        req.gateway.data.forEach(function(message) { message.isStored = false; });
      }))
    .post('/')
    .set('Content-Type', 'application/xml')
    .set('PSW-Message-type', 'MO')
    .send('<MSGLST><MSG><ID>1</ID><SND>4700000000</SND><RCV>01337</RCV><TEXT>Some text</TEXT></MSG></MSGLST>')
    .expect(200, '<MSGLST><MSG><ID>1</ID><STATUS>FAIL</STATUS></MSG></MSGLST>', done);
  })

})


function allocBuffer (size, fill) {
  if (Buffer.alloc) {
    return Buffer.alloc(size, fill)
  }

  var buf = new Buffer(size)
  buf.fill(fill)
  return buf
}

function createServer (opts) {
  var _gatewayBodyParser = typeof opts !== 'function'
    ? gatewayBodyParser.xmlhttp(opts)
    : opts
  opts = opts || {};

  return http.createServer(function (req, res) {
    _gatewayBodyParser(req, res, function (err) {
      res.statusCode = err ? (err.status || 500) : 200;
      if (!opts.gatewayBody)
        res.end(err ? err.message : JSON.stringify(req.body));
      else
        res.end(err ? err.message : JSON.stringify(req.gateway));
    })
  })
}

function createReplyingServer(opts, handle) {
  var _gatewayBodyParser = typeof opts !== 'function'
    ? gatewayBodyParser.xmlhttp(opts)
    : opts
  opts = opts || {};

  return http.createServer(function (req, res) {
    _gatewayBodyParser(req, res, function (err) {
      handle(req);
      res.statusCode = err ? (err.status || 500) : 200;
      res.gatewayResponse();
    })
  })  
}