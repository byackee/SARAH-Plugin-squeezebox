var moment = require('moment');
moment.lang('fr');
    
exports.action = function(data, callback, config, SARAH){

  // CONFIG
  config = config.modules.squeezebox;
  if (!config.ip){
    console.log("Missing squeezebox config");
    return;
  } 
    set(data, callback, config, SARAH);
}

// ==========================================
//  GET
// ==========================================

var set = function(data, callback, config, SARAH){ 
	console.log('##### Squeezebox #####');
var net = require('net');


if (!data.periphId){
    var player = '';
 } else {
	var player = data.periphId;
  } 
 if (!data.value){
    var  value = '';
 } else {
	var value = data.value;
  }
  
var playername = data.periphName;
var HOST = config.ip;
var PORT = config.port;
var cmnd = data.request;

if (!data.value){
    var stringtosend = player + data.request + String.fromCharCode(10);
 } else {
	var stringtosend = player + cmnd + value + String.fromCharCode(10);
  } 


var client = new net.Socket();
client.connect(PORT, HOST, player, playername, cmnd, stringtosend, data, value, callback, SARAH, function() {

    console.log('CONNECTED TO: ' + HOST + ':' + PORT);
	console.log('DEVICE: ##' + data.periphName + '##');
	console.log('COMMAND: ##' + cmnd + '##');
    // Write a message to the socket as soon as the client is connected, the server will receive it as message from the client 
    client.write(stringtosend);

});

// Add a 'data' event handler for the client socket
// data is what the server sent to this socket
client.on('data', function(data) {
    //console.log('STRING SEND: ' + data);
    // Close the client socket completely
data = returnString('' + data,/%3A/g,":");
data = returnString('' + data,player,"");
console.log(cmnd + value);
   
get_action('' + data, cmnd, value, playername, config, callback)
   
    client.destroy();
});

// Add a 'close' event handler for the client socket
client.on('close', function() {
    console.log('Connection closed');
});
}

var returnString = function (data, stringtoreplace, word) {
var str = data;
str = str.replace(stringtoreplace,word);
console.log('return: ' + str);
return str;
}

var get_action = function ( data, cmnd, value, playername, config, callback ) {
	switch ( cmnd ) {
		case 'mode ':
			output (callback, 'la squeezebox ' + playername +' est sur ' + returnString(data, cmnd, ""));
			return;
		case 'power 0':
			output (callback, 'la squeezebox ' + playername +' est arretée ');
			return;
		case 'play':
			output (callback, 'la squeezebox ' + playername +' est sur lecture ');
			return;
		case 'pause':
			output (callback, 'la squeezebox ' + playername +' est sur pause ');
			return;
		case 'power 1':
			output (callback, 'la squeezebox ' + playername +' est en fonctionnement ');
			return;	
		case ('mixer volume ') :
			output (callback, 'fait');
			return;
        case 'current_title ':
		    data = returnString(data, cmnd, "")
			output (callback, 'la squeezebox ' + playername + ' joue '   + returnString(data, /%20/g, " "));			
			return;
        case 'artist ':
		    data = returnString(data, cmnd, "")
			output (callback, 'la squeezebox ' + playername + ' joue '   + returnString(data, /%20/g, " "));			
			return;
        case 'album ':
		    data = returnString(data, cmnd, "")
			output (callback, 'la squeezebox ' + playername + 'joue '   + returnString(data, /%20/g, " "));			
			return;  	  			
		default:
		output(callback, "Je ne peux pas exécuter cette action");
		return;	
	}
}


var output = function ( callback, output ) {
	console.log(output);
	callback({ 'tts' : output});
}