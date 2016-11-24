var xml2js = require('xml2js');

module.exports = function(res, body) {
  var response = { MSGLST: { MSG: body.data.map(function(item) { return { "ID": item.sequenceId, "STATUS": item.isStored ? "OK" : "FAIL"}}) } };
  var builder = new xml2js.Builder({ renderOpts: { "pretty": false, "indent": false }, headless: true});
  var out = builder.buildObject(response);
  res.end(out);
}