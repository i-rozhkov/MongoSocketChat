const mongo = require('mongodb').MongoClient;
const client = require('socket.io').listen(4000).sockets;

//  Connect to MongoDB
mongo.connect('mongodb://127.0.0.1/mongochat', function (err, cl) {

    console.log("Connected successfully to server");

    //  Connect to Socket.io
    client.on('connection', function (socket) {
        const db = cl.db('socketchat');
        let chat = db.collection('chats');

        //  Create function to send status
        sendStatus = function (s) {
            socket.emit('status', s);
        }

        //  Get chats from Mongo collection
        chat.find().limit(100).sort({ _id: 1 }).toArray(function (err, res) {
            if (err) {
                throw err
            };

            //  Emit messages
            socket.emit('output', res);
        });

        //  Handle input events
        socket.on('input', function (data) {
            let { name, message } = data;

            //  Check for name and message
            if (name === '' || message === '') {
                //  Send error status
                sendStatus('Please enter a name and message')
            } else {
                //  Insert message
                chat.insert({ name, message }, function () {
                    client.emit('output', [data]);

                    //  Send status object
                    sendStatus({
                        message: 'Message sent',
                        clear: true,
                    });
                });
            }
        });

        //  Handle clear
        socket.on('clear', function (data) {
            //  Remove all chats from collection
            chat.remove({}, function () {
                //  Emit cleared
                socket.emit('cleared');
            });
        });
    });
});