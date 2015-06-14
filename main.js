/*jslint node:true, vars:true, bitwise:true, unparam:true */
/*jshint unused:true */

/*
A simple node.js application intended to write data to Digital pins on the Intel based development boards such as the Intel(R) Galileo and Edison with Arduino breakout board.

MRAA - Low Level Skeleton Library for Communication on GNU/Linux platforms
Library in C/C++ to interface with Galileo & other Intel platforms, in a structured and sane API with port nanmes/numbering that match boards & with bindings to javascript & python.

Steps for installing MRAA & UPM Library on Intel IoT Platform with IoTDevKit Linux* image
Using a ssh client: 
1. echo "src maa-upm http://iotdk.intel.com/repos/1.1/intelgalactic" > /etc/opkg/intel-iotdk.conf
2. opkg update
3. opkg upgrade

Article: https://software.intel.com/en-us/html5/articles/intel-xdk-iot-edition-nodejs-templates
*/


var mraa = require('mraa'); //require mraa
var sleep = require('sleep');

var request = require('request');
var ENDPOINT_URL = "http://salty-plains-7151.herokuapp.com";
//var ENDPOINT_URL = "http://192.168.50.133:5000";
var DOOR_ID = "1";

var express = require('express');
var app = express();

app.set('port', (process.env.PORT || 5000));

app.listen(app.get('port'), function() {
    console.log('Server running on port ' + app.get('port'));
});

app.use('/', express.static(__dirname + '/public'));

// GET /unlock.
app.get('/unlock', function(req, res) {
    unlock();
    res.status(200).send("Door unlocked.");
});

console.log('MRAA Version: ' + mraa.getVersion()); //write the mraa version to the console

var greenLed = new mraa.Gpio(11);
greenLed.dir(mraa.DIR_OUT); 
greenLed.write(0);

var redLed = new mraa.Gpio(10);
redLed.dir(mraa.DIR_OUT);
redLed.write(0);

var relay = new mraa.Gpio(8);
relay.dir(mraa.DIR_OUT);

var keypad = [[1,2,3],[4,5,6],[7,8,9],[0,0,0]];
var lastButtonState = [];
var buttonTimeout = -1;

var rows = [
    {
        pin: 0,
        gpio: new mraa.Gpio(0)
    },
    {
        pin: 1,
        gpio: new mraa.Gpio(1)
    },
        {
        pin: 2,
        gpio: new mraa.Gpio(2)
    },
        {
        pin: 3,
        gpio: new mraa.Gpio(3)
    },
];

var cols = [
    {
        pin: 4,
        gpio: new mraa.Gpio(4)
    },
    {
        pin: 5,
        gpio: new mraa.Gpio(5)
    },
    {
        pin: 6,
        gpio: new mraa.Gpio(6)
    }
];

for (var row in rows) {
    rows[row].gpio.dir(mraa.DIR_OUT);
    rows[row].gpio.mode(mraa.MODE_PULLDOWN);
    rows[row].gpio.write(1);
}

for (var col in cols) {
    cols[col].gpio.dir(mraa.DIR_IN);
    cols[col].gpio.mode(mraa.MODE_PULLUP);
}

function readKeypad(onButtonPress) {
    for (var row in rows) {
        // Enable a row
        rows[row].gpio.write(0);

        sleep.usleep(5000)
        
        // Read column inputs
        for (var col in cols) {
            var v = cols[col].gpio.read();
            var button = keypad[row][col];
            if (!v && !lastButtonState[button]) {
                console.log("PRESSED: " + button);
                onButtonPress(button);
            } else if (v && lastButtonState[button]) {
                console.log("RELEASED: " + button);
            }
            lastButtonState[button] = !v;
        }
            
        // Reset row
        rows[row].gpio.write(1);
    }  
    
    setTimeout(function() {
        readKeypad(onButtonPress);
    }, 50);
}

function soundAndFlash() {
    greenLed.write(1);
    setTimeout(function() {
        greenLed.write(0);
    }, 50);
}

function unlock() {
    relay.write(1);
    greenLed.write(1);
    setTimeout(function() {
        relay.write(0);
        greenLed.write(0);
    }, 10000);
}

var currentCode = "";

function accumulateAndValidate(button) {
    console.log("called " + button);
    currentCode += button.toString();
    if (currentCode.length >= 4) {
        requestAccessFromApi("1", currentCode, function(response) {
            if (response.status == 200) {
                // Open.
                console.log("Code Valid: Unlocking Door");
                unlock();
            }
            else {
                // Don't open.
                redLed.write(1);
                setTimeout(function() {
                    redLed.write(0);
                }, 3000);
            }
        });
        currentCode = "";
    } else {
        soundAndFlash();
        if (buttonTimeout >= 0) {
            clearTimeout(buttonTimeout);
        }
        buttonTimeout = setTimeout(function() {
            currentCode = "";
        }, 5000);
    }
}

function requestAccessFromApi(id, code, callback) {
    console.log("Requesting access from API with code " + code);

    request.put(ENDPOINT_URL + '/authenticate/' + id, {
        form: {code: code}
    }, function(error, response, body) {
        console.log("Response from API: ", response.statusCode, body);
        if (error) {
            console.log("error", error);
        }
        callback({
            status: response.statusCode,
            body: body
        });
    });
}

readKeypad(accumulateAndValidate);
