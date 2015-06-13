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
var ENDPOINT_URL = "https://salty-plains-7151.herokuapp.com"

console.log('MRAA Version: ' + mraa.getVersion()); //write the mraa version to the console

var greenLed = new mraa.Gpio(7);
greenLed.dir(mraa.DIR_OUT); 

var relay = new mraa.Gpio(8);
relay.dir(mraa.DIR_OUT);

var keypad = [[1,2,3],[4,5,6],[7,8,9],[0,0,0]];
var lastButtonState = [];

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
    setTimeout(function() {
        relay.write(0);
    }, 10000);
}

var currentCode = "";

function accumulateAndValidate(button) {
    console.log("called " + button);
    currentCode += button.toString();
    if (currentCode.length >= 4) {
        // Try code TODO
        console.log("Code Valid: Unlocking Door");
        currentCode = "";
        unlock();
    } else {
        soundAndFlash();
    }
}

/*
requestAccessFromApi("id", "code", function(response) {
    if (response.status == 200) {
        // Open.
    }
    else {
        // Don't open.
    }
});
*/

function requestAccessFromApi(id, code, callback) {
    console.log("Requesting access from API with code " + code);

    request.put(ENDPOINT_URL + '/authenticate/' + id, {
        code: code
    }), function(error, response, body) {
        console.log("Response from API: ", response.statusCode, body);
        if (error) {
            console.log("error", error);
        }
        callback({
            status: response.statusCode,
            body: body
        });
    }
}

readKeypad(accumulateAndValidate);
