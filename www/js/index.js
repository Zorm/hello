/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
var app = {



        // UUID of Luxometer service.
    LUXOMETER_SERVICE : 'f000aa70-0451-4000-b000-000000000000',

    // UUID of Luxometer config characteristic (write 1 to turn sensor ON,
    // 0 to turn sensor OFF).
    LUXOMETER_CONFIG : 'f000aa72-0451-4000-b000-000000000000',

    // UUID of Luxometer data characteristic.
    LUXOMETER_DATA : 'f000aa71-0451-4000-b000-000000000000',

    findDevice:function()
    {
        hyper.log('Start scanning')

        // Start scanning. Two callback functions are specified.
        evothings.ble.startScan(
            onDeviceFound,
            onScanError)

        // This function is called when a device is detected, here
        // we check if we found the device we are looking for.
        function onDeviceFound(device)
        {
            hyper.log('Found device: ' + device.advertisementData.kCBAdvDataLocalName)

            if (device.advertisementData.kCBAdvDataLocalName == 'CC2650 SensorTag')
            {
                hyper.log('Found the TI SensorTag!')

                // Stop scanning.
                evothings.ble.stopScan()

                // Connect.
                connectToDevice(device)
            }
        }

        // Function called when a scan error occurs.
        function onScanError(error)
        {
            hyper.log('Scan error: ' + error)
        }
    },

    connectToDevice:function(device)
    {
        evothings.ble.connectToDevice(
            device,
            onConnected,
            onDisconnected,
            onConnectError)

        function onConnected(device)
        {
            hyper.log('Connected to device')

            // Enable notifications for Luxometer.
            enableLuxometerNotifications(device)
        }

        // Function called if the device disconnects.
        function onDisconnected(error)
        {
            hyper.log('Device disconnected')
        }

        // Function called when a connect error occurs.
        function onConnectError(error)
        {
            hyper.log('Connect error: ' + error)
        }
    },

    enableLuxometerNotifications:function(device)
    {
        // Get Luxometer service and characteristics.
        var service = evothings.ble.getService(device, app.LUXOMETER_SERVICE)
        var configCharacteristic = evothings.ble.getCharacteristic(service, app.LUXOMETER_CONFIG)
        var dataCharacteristic = evothings.ble.getCharacteristic(service, app.LUXOMETER_DATA)

        // Turn Luxometer ON.
        evothings.ble.writeCharacteristic(
            device,
            configCharacteristic,
            new Uint8Array([1]),
            onLuxometerActivated,
            onLuxometerActivatedError)

        function onLuxometerActivated()
        {
            hyper.log('Luxometer is ON')

            // Enable notifications from the Luxometer.
            evothings.ble.enableNotification(
                device,
                dataCharacteristic,
                onLuxometerNotification,
                onLuxometerNotificationError)
        }

        function onLuxometerActivatedError(error)
        {
            hyper.log('Luxometer activate error: ' + error)
        }

        // Called repeatedly until disableNotification is called.
        function onLuxometerNotification(data)
        {
            var lux = calculateLux(data)
            hyper.log('Luxometer value: ' + lux)
        }

        function onLuxometerNotificationError(error)
        {
            hyper.log('Luxometer notification error: ' + error)
        }
    },

    // Calculate the light level from raw sensor data.
    // Return light level in lux.
    calculateLux: function(data)
    {
        // Get 16 bit value from data buffer in little endian format.
        var value = new DataView(data).getUint16(0, true)

        // Extraction of luxometer value, based on sfloatExp2ToDouble
        // from BLEUtility.m in Texas Instruments TI BLE SensorTag
        // iOS app source code.
        var mantissa = value & 0x0FFF
        var exponent = value >> 12

        var magnitude = Math.pow(2, exponent)
        var output = (mantissa * magnitude)

        var lux = output / 100.0

        // Return result.
        return lux
    },

    // Start scanning for devices when the plugin has loaded.
    //document.addEventListener('deviceready', findDevice, false)





    // Application Constructor
    initialize: function() {
        document.addEventListener('deviceready', this.onDeviceReady.bind(this), false);
    },

    // deviceready Event Handler
    //
    // Bind any cordova events here. Common events are:
    // 'pause', 'resume', etc.
    onDeviceReady: function() {
        hyper.log("Device ready");
        document.getElementById('foo').innerHTML = "Barbappapa";
        this.findDevice('deviceready');
    },

    // Update DOM on a Received Event
    receivedEvent: function(id) {
        var parentElement = document.getElementById(id);
        var listeningElement = parentElement.querySelector('.listening');
        var receivedElement = parentElement.querySelector('.received');

        listeningElement.setAttribute('style', 'display:none;');
        receivedElement.setAttribute('style', 'display:block;');

        hyper.log('Received Event: ' + id);
    }
};

app.initialize();