// Prepara la variable https con la que hara el envio a Xively

var INTERVALO_ENVIO_XIVELY =  10 * 60 * 1000;  // cada 10 minutos
var https = require('https');


function enviaTemperatura( ){

        var temperatura = ultimoDato.substring(0,ultimoDato.indexOf(';'));
	temperatura = Math.round(temperatura);

	console.log("Enviando a Xively temp: " + temperatura );

	   // Prepara el json que enviara Xively
	 var jdata = JSON.stringify({
		"version": '1.0.0',
		"datastreams" : [ {
		"id" : "sensor1",
        	"current_value" : temperatura 
	   	 } ]
         }); 

	var options = {
	  host: 'api.xively.com',
	  path: '/v2/feeds/1651193641.json',
	  method: 'PUT',
	  headers: {
	    'X-ApiKey': 'XIVELY_API_KEY',
	    'Content-Type': 'application/json',
	    'Content-Length': jdata.length,
	    'Host': 'api.xively.com'
	  }
	};

	var req = https.request( options, function(res) {
	  //console.log('Status Code: ' + res.statusCode);
	  //console.log('Headers:');
	  //console.log(res.headers);
	  res.setEncoding('utf8');

	  var buffer = '';
	  res.on('data', function(chunk) {
	    buffer += chunk;
	  });
	  res.on('end', function() {
	    //console.log('complete');
	    //console.log(buffer);
	  });
	});

	req.on('error', function(e){
	   console.log('problem with request: ' + e.message);
	});

        req.write(jdata);
        req.end();
}

// Zona de gestion de datos recibidos de RaspberryPi y envio de datos
var PORT=8080;

var fs = require('fs');

var postHTML="";
leeHTML();
function leeHTML( ){

  fs.readFile('/home/pi/html/server.html', { encoding: "UTF8" },
    function (err, data) {
      if (err) throw err;
      postHTML= data.toString();
    });
  
}

var SerialPort = require("serialport").SerialPort
var serialPort = new SerialPort("/dev/ttyACM0", {
  baudrate: 9600
});

var receivedData = "";
var ultimoDato = "";

console.log("Iniciado server.js");

serialPort.on("open", function(){
  console.log('open');
  serialPort.on('data', function(data) {
    receivedData += data.toString();
    if( receivedData.indexOf('\n') ){
	var datos = receivedData.substring(0,receivedData.indexOf('\n'));
	if( datos.length > 1 ){
	   var fecha = new Date().toUTCString();
	   console.log(fecha + " Recibido: " + datos);
	   ultimoDato = datos;

	   //console.log("Temperatura: " + temperatura);

	   // envia los datos a Xively
	   //console.log("Enviando a Xively temperatura: " + temperatura);
	   //enviaTemperatura( temperatura );
	}
	if( receivedData.length > receivedData.indexOf('\n') )
  	  receivedData = receivedData.substring( receivedData.indexOf('\n') +1 );
	else
	  receivedData ="";
    }
  });

});

senyalaLed = function( senyal ){
	serialPort.write( senyal );
}


// Mini servidor Web
var http = require('http');

http.createServer(function (req, res) {
  var body = "";
  req.on('data', function (chunk) {
    body += chunk;
  });
  req.on('end', function () {
    console.log('POSTed: ' + body);
    res.writeHead(200);
    if( body == "tipo=1" ){
	var temperatura = ultimoDato.substring(0,ultimoDato.indexOf(';') );
	temperatura = Math.round(temperatura);
	var millis = ultimoDato.substring(ultimoDato.indexOf(';')+1, ultimoDato.indexOf('\r'));
	res.end( JSON.stringify([1, temperatura, millis ] ) );
	console.log("Enviado temp: " + temperatura + " millis: " + millis );
	return;
    }
    else if ( body == "sel_led=H" ){
	senyalaLed('H');
	res.end( JSON.stringify([2,  1, 0] ) );
	return;
    }
    else{
      //leeHTML();  // Va releyendo el fichero esto solo por depuracion
      senyalaLed('L');
      res.end( postHTML );
   }
  });
}).listen(PORT);


setInterval( enviaTemperatura, INTERVALO_ENVIO_XIVELY );
