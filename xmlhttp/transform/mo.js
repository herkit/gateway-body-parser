module.exports = function(xml) {
    var msgs = !Array.isArray(xml.msglst.msg) ? [xml.msglst.msg] : xml.msglst.msg;
    return msgs.map(function(msg) {
        var out = {
            sequenceId: msg.id,
            receiver: msg.rcv,
            sender: msg.snd,
            text: msg.text,
            isOk: false
        };

        if (msg.address) out.address = msg.address;

        if (msg.position) {
            var pos = msg.position;

            if (pos.status === "OK") {
                pos = pos.pos;
                out.position = {
                    lng: parseFloat(pos.longitude.replace(',', '.')),
                    lat: parseFloat(pos.latitude.replace(',', '.')),
                    radius: pos.radius ? parseInt(pos.radius) : -1,
                    council: pos.council,
                    councilNumber: pos.councilnumber,
                    place: pos.place,
                    subplace: pos.subplace,
                    zipCode: pos.zipcode,
                    city: pos.city
                };

            }
        }

        if (msg.metadata) {
            var meta = !Array.isArray(msg.metadata.data) ? [msg.metadata.data] : msg.metadata.data;
            out.metadata = meta.reduce(function(data, item) {
                data[item.$.KEY.toLowerCase()] = item.$.VALUE;
                return data;
            }, {})
        }

        return out;
    })
}