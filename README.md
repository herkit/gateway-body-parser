#LINK Mobility Gateway Body Parser
This is a connect body parser that parses MOs received from the LINK Mobility Gateway.

##Usage

```
npm install herkit/gateway-body-parser --save
```

```
var gatewayBodyParser = require("gateway-body-parser");

app.use(gatewayBodyParser.xmlhttp());

app.post('/', function(req, res) {
  console.log("Handling Gateway " + req.body.type + " request");
  req.body.data.forEach(function(message) {
    console.log(message.text);
    message.isOk = true;
  });
  res.gatewayResponse();
}
```