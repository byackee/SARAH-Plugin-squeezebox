 exports.action = function(data, callback, config, SARAH){
  //partie spéciale demande libre
 if (data.dictation){
  var album = data.dictation;
   var album1 = album.replace(/Sarah /i,"");
   var album2 = album1.replace(/Jarvis /i,"");
   var album3 = album2.replace(/je veux écouter /i,""); 
   var album4 = album3.replace(/dans le /i,"");
   var album5 = album4.replace(/dans la /i,"");
   var album6 = album5.replace(/cuisine /i,"");
   var album7 = album6.replace(/salon/i,"");
   Song = album7 + "*";
 } else {
   Song = ""; 
 }
  //fin de la partie spéciale demande libre
// CONFIG
  config = config.modules.squeezebox;
  if (!config.ip){
    console.log("Missing squeezebox config");
    return;
  } 

 if (!data.value){
    value = '';
 } else {
	value = data.value;	
  }
  switch (data.request)
	{
	case 'set':
	get_squeezebox(set_action, data, value, callback, config, SARAH);
	break;
	case 'update':
	get_squeezebox(update, data, value, callback, config, SARAH);
	break;
	case 'alarms':
	get_alarms(update, data, value, callback, config, SARAH);
	break;
	default:
	output(callback, "Je ne sais pas faire cela ");
	}
}

var get_squeezebox = function(Action, data, value, callback, config, SARAH){ 
console.log(' ');
console.log('       ##### SQUEEZEBOX #####');
var directory = data.directory;
var net = require('net'); 
var playername = data.periphName;
var cmnd = data.Action;
var HOST = config.ip;
var PORT = config.port;
var client_get = new net.Socket();

client_get.connect(PORT, HOST, playername, callback, config, SARAH, function() {
    console.log('CONNECTED TO: ' + HOST + ':' + PORT);
	console.log(' ');
    client_get.write('players 0 10' + String.fromCharCode(10));
});

client_get.on('data', function(data) {
data = returnString('' + data,/%3A/g,":");
data = returnString(data,/%2C/g,",");
data = returnString(data,/%3F/g,"?");
data = returnString(data,/%3D/g,"=");
data = returnString(data,/%26/g,"&");
data = returnString(data,/players 0 10 count:\d /,"");
data = returnString(data,/ /g,"\",");
data = returnString(data,/,playerindex/g,"},{playerindex");
data = returnString(data,/count:/g,"\"count\":\"");
data = returnString(data,/playerindex:/g,"\"playerindex\":\"");
data = returnString(data,/playerid:/g,"\"playerid\":\"");
data = returnString(data,/ip:/g,"\"ip\":\"");
data = returnString(data,/name:/g,"\"name\":\"");
data = returnString(data,/model:/g,"\"model\":\"");
data = returnString(data,/displaytype:/g,"\"displaytype\":\"");
data = returnString(data,/connected:/g,"\"connected\":\"");
data = returnString(data,/canpoweroff:/g,"\"canpoweroff\":\"");
data = returnString(data,/isplayer:/g,"\"isplayer\":\"");
data = returnString(data,/uuid:/g,"\"uuid\":\"");
data = returnString(data,String.fromCharCode(10),"");
data = '[{' + data + '\"}]';
var json = JSON.parse(data);
Action(data, json, cmnd, value, playername, directory, callback, config, SARAH);
    client_get.destroy();
});

client_get.on('close', function() {
});
}

var get_alarms = function(Action, data, value, callback, config, SARAH){ 
console.log(' ');
console.log('       ##### SQUEEZEBOX #####');
var directory = data.directory;
var net = require('net'); 
var playername = data.periphName;
var cmnd = data.Action;
var value = data.value;
var HOST = config.ip;
var PORT = config.port;
var client_get = new net.Socket();

client_get.connect(PORT, HOST, playername, callback, config, SARAH, function() {
    console.log('CONNECTED TO: ' + HOST + ':' + PORT);
	console.log(' ');
    client_get.write('alarms 0 4'+ String.fromCharCode(10));
});

client_get.on('data', function(data) {
data = returnString('' + data,/%3A/g,":");
data = returnString('' + data,/%2F/g,"/");
data = returnString('' + data,/%2C/g,",");
data = returnString('' + data,/%3F/g,"?");
data = returnString('' + data,/%3D/g,"=");
data = returnString('' + data,/%26/g,"&");
console.log(data);
var now = new Date();    
var hours = now.getHours()*(60*60);
var minutes = now.getMinutes()*60;
var seconds = now.getSeconds();

var secSinceMidnight = hours+minutes+seconds;
console.log(secSinceMidnight);
//var json = JSON.parse(data);
//Action(data, json, cmnd, value, playername, directory, callback, config, SARAH);
    client_get.destroy();
});

client_get.on('close', function() {
});
}

var set_action = function(data, json, cmnd, value, playername, directory, callback, config, SARAH){ 
var net = require('net');	
var HOST = config.ip;
var PORT = config.port;
console.log('##### DETECTION DES SQUEEZEBOX #####');
for ( var i = 0; i < json.length; i++ ) {
		var module = json[i];
		var tokens = module.name.split(' ');
		var found = true;
		for ( var j = 0; found && j < tokens.length; j++ ) {
			found = new RegExp(tokens[j],'i').test(playername);
		}
		console.log ( "Found (" + i + ") " + module.name + ": " + found +' adress: ' + module.playerid);
		if ( found ) {
		var modulefind = module;
			if (!value){
				var stringtosend = module.playerid + ' ' + cmnd + Song + String.fromCharCode(10);
			} else {
				var stringtosend = module.playerid + ' ' + cmnd + value + String.fromCharCode(10);
			} 
		}
	}
	console.log(' ');
 console.log('CHAINE ENVOYE: ' + stringtosend);
var client_set = new net.Socket();

client_set.connect(PORT, HOST, stringtosend, function() {
console.log(' ');
console.log('##### ENVOI DE L\'ACTION #####');
    client_set.write(stringtosend);
});

client_set.on('data', function(data) {
// Close the client socket completely
data = returnString('' + data,/%3A/g,":");
data = returnString('' + data,modulefind.playerid,"");
	
say('' + data, cmnd, value, modulefind, config, callback)   
	client_set.destroy();
});

// Add a 'close' event handler for the client socket
client_set.on('close', function() {
    console.log('##### CONNECTION CLOSED #####');
});
}

var returnString = function (data, stringtoreplace, word) {
var str = data;
str = str.replace(stringtoreplace,word);
//console.log('return: ' + str);
return str;
}

var say = function ( data, cmnd, value, modulefind, config, callback ) {
	switch ( cmnd ) {
		case 'mode ':
			output (callback, 'la squeezebox ' + modulefind.name +' est sur ' + returnString(data, cmnd, ""));
			return;
		case 'power 0 ':
			output (callback, 'la squeezebox ' + modulefind.name +' est arretée ');
			return;
		case 'play ':
			output (callback, 'la squeezebox ' + modulefind.name +' est sur lecture ');
			return;
		case 'pause ':
			output (callback, 'la squeezebox ' + modulefind.name +' est sur pause ');
			return;
		case 'power 1 ':
			output (callback, 'la squeezebox ' + modulefind.name +' est en fonctionnement ');
			return;	
		case ('mixer volume ') :
			output (callback, 'fait');
			return;
		case ('mixer muting 0 ') :
			output (callback, 'le son de la squeezebox ' + modulefind.name +' est normal');
			return;
		case ('mixer muting 1 ') :
			output (callback, 'le son de la squeezebox ' + modulefind.name +' est coupé');
			return;
        case 'current_title ':
		    data = returnString(data, cmnd, "")
			output (callback, 'la squeezebox ' + modulefind.name + ' joue '   + returnString(data, /%20/g, " "));			
			return;
        case 'artist ':
		    data = returnString(data, cmnd, "")
			output (callback, 'la squeezebox ' + modulefind.name + ' joue '   + returnString(data, /%20/g, " "));			
			return;
        case 'album ':
		    data = returnString(data, cmnd, "")
			output (callback, 'la squeezebox ' + modulefind.name + ' joue '   + returnString(data, /%20/g, " "));			
			return;
		case 'randomplay tracks ':
		    data = returnString(data, cmnd, "")
			output (callback, 'la squeezebox ' + modulefind.name + ' joue des musiques aléatoires');			
			return;
		case 'randomplay albums ':
		    data = returnString(data, cmnd, "")
			output (callback, 'la squeezebox ' + modulefind.name + ' joue des albums aléatoires');			
			return;
		case 'favorites playlist play item_id:':
		    data = returnString(data, cmnd, "")
			output (callback, 'la squeezebox ' + modulefind.name + ' joue le favoris ' + value);			
			return;
		case 'info total songs ':
		    data = returnString(data, cmnd, "")
			output (callback, 'j\'ai trouvé ' + returnString(data, /%20/g, " ") + 'chansons');			
			return;
		case 'info total albums ':
		    data = returnString(data, cmnd, "")
			output (callback, 'j\'ai trouvé ' + returnString(data, /%20/g, " ") + 'albums');			
			return;
		case 'info total artists ':
		    data = returnString(data, cmnd, "")
			output (callback, 'j\'ai trouvé ' + returnString(data, /%20/g, " ") + 'artistes');			
			return;
		default:
		output(callback, "Je ne sais pas quoi dire");
		return;	
	}
}

var update = function(data, json, cmnd, value, playername, directory, callback, config, SARAH){
	console.log("***** UPDATE  *****");

	if (!directory){ 
	console.log('il n\'y a pas de dossier spécifié');
	return false; 
	}

	var fs   = require('fs');	
	var file = data.directory + '/../plugins/squeezebox/squeezebox.xml';
	var xml  = fs.readFileSync(file,'utf8');
  
	var replace  = '§ -->\n';
	replace += '  <one-of>\n';
					
		for ( var i = 0; i < json.length; i++ ) {
			var module = json[i];
			var tokens = module.name.split(' ');
			replace += '    <item>'+module.name+'<tag>out.action.periphName="'+module.name+'"</tag></item>\n';
			console.log('ajout de : ' + module.name);
						
		}
	replace += '  </one-of>\n';
	replace += '<!-- §';
						
	var regexp = new RegExp('§[^§]+§','gm');
	var xml    = xml.replace(regexp,replace);
	fs.writeFileSync(file, xml, 'utf8');
	fs.writeFileSync(file, xml, 'utf8');
		
  callback({ 'tts' : 'j\'ai trouvé ' + json.length + ' squeezebox'});

}

var output = function ( callback, output ) {
	console.log('ACTION: ' + output);
	callback({ 'tts' : output});
}
