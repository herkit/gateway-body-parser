module.exports = function(xml) {
    var msgs = !Array.isArray(xml.msglst.msg) ? [xml.msglst.msg] : xml.msglst.msg;
    return msgs.map(function(msg) {
        var out = {
            sequenceId: msg.id,
            reference: msg.ref,
            receiver: msg.rcv,
            state: msg.state,
            isOk: false
        };

        if (msg.deliverytime) out.timestamp = msg.deliverytime;

        return out;
    })
}