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

console.log('MRAA Version: ' + mraa.getVersion()); //write the mraa version to the console

// GPIO pins connected to keypad
//var rows = [2,3,4,5];
//var cols = [6,7,8];

var keypad = [[1,2,3],[4,5,6],[7,8,9],[0,0,0]];

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

function readKeypad() {
    for (var row in rows) {
        // Enable a row
        rows[row].gpio.write(0);

        sleep.usleep(5000)
        
        // Read column inputs
        for (var col in cols) {
            var v = cols[col].gpio.read();
            //console.log(v  + " - " + row + " / " + col);
            if (!v) {
                //cb();
                var button = keypad[row][col];
                console.log("PRESSED: " + button);
            } 
        }
            
        // Reset row
        rows[row].gpio.write(1);
    }  
    
    setTimeout(readKeypad, 200);
}

readKeypad();
