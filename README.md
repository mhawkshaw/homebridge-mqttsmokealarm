
<p align="center">

<img src="https://github.com/homebridge/branding/raw/master/logos/homebridge-wordmark-logo-vertical.png" width="150">

</p>

# MQTT Smoke Sensor Homebridge Plug-in

This Homebridge plug-in allows you to connect to smoke sensors that can communicate over MQTT. For example, your smoke sensor might communicate over Zigbee or Z-Wave via a USB Stick connected to your Home Asistant installation. You could then have Home Assistant send the status updates over MQTT using an automation.

[![verified-by-homebridge](https://badgen.net/badge/homebridge/verified/purple)](https://github.com/homebridge/homebridge/wiki/Verified-Plugins)

## Setup MQTT broker

This Homebridge plug-in reads the data from an MQTT broker.

You need to install an [MQTT broker](http://mosquitto.org/) on your machine, this can be any machine in your network, including the machine running Homebridge. Here are some instructions for popular distributions:

### Raspberry Pi / Ubuntu

In short, you just need to do the following:

    sudo apt-get update
    sudo apt-get install -y mosquitto mosquitto-clients
    sudo systemctl enable mosquitto.service

### macOS

Use [Homebrew](https://brew.sh/)

    brew install mosquitto

### Windows

Go to the [Mosquitto Download Page](https://mosquitto.org/download/) and choose the right installer for your system.

### Enable authentication

A quick search online will provide you with information on how to secure your installation. To help you, I've found the following links for the 
[Raspberry Pi](https://randomnerdtutorials.com/how-to-install-mosquitto-broker-on-raspberry-pi/) and [Ubuntu](https://www.vultr.com/docs/install-mosquitto-mqtt-broker-on-ubuntu-20-04-server/)

## Plug-in Installation

Follow the [homebridge installation instructions](https://www.npmjs.com/package/homebridge) if you haven't already.

Install this plugin globally:

    npm install -g homebridge-MqttSmokeSensor

Add platform to `config.json`, for configuration see below.

## Plug-in Configuration

The plug-in needs to know where to find the MQTT broker providing the JSON data (e.g. mqtt://127.0.0.1:1883) along with the serial number of the device to uniquely identify it (you can also use your Raspberry Pi identifier).

```json
{
  "platforms": [
    {
      "platform": "MqttSmokeSensor",
      "name": "MqttSmokeSensor",
      "mqttbroker": "mqtt://127.0.0.1:1883",
      "username": "",
      "password": "",
      "devices": [
        {
          "displayName": "My Kitchen Smoke Sensor",
          "serial": "1234567890",
          "manufacturer": "Fibaro",
          "model": "smoke",
          "smokeDetectedTopic": "ha/smokedetector/smokedetected",
          "smokeDetectedPayload": "1",
          "smokeNotDetectedTopic": "ha/smokedetector/smokedetected",
          "smokeNotDetectedPayload": "0",
          "getSmokeDetectedTopic": "ha/smokedetector/getsmokedetected",
          "lowBatteryTopic": "ha/smokedetector/batterylow",
          "lowBatteryPayload": "1",
          "normalBatteryTopic": "ha/smokedetector/batterylow",
          "normalBatteryPayload": "0",
          "getLowBatteryTopic": "ha/smokedetector/getbatterylow",
          "tamperedTopic": "ha/smokedetector/tampered",
          "tamperedPayload": "1",
          "notTamperedTopic": "ha/smokedetector/tampered",
          "notTamperedPayload": "0",
          "getTamperedTopic": "ha/smokedetector/gettampered",
          "faultTopic": "ha/smokedetector/fault",
          "faultPayload": "1",
          "noFaultTopic": "ha/smokedetector/fault",
          "noFaultPayload": "0",
          "getFaultTopic": "ha/smokedetector/getfault"
        }
      ]
    }
  ]
}

```

The following settings are optional:

- `username`: the MQTT broker username
- `password`: the MQTT broker password
- `smokeDetectedPayload`: the payload of the MQTT message received on the topic. If not specified, assumes smoke has been detected.
- `smokeNotDetectedPayload`: the payload of the MQTT message received on the topic. If not specified, assumes smoke has been detected
- `lowBatteryPayload`: the payload of the MQTT message received on the topic. If not specified, assumes battery is low
- `normalBatteryPayload`: the payload of the MQTT message received on the topic. If not specified, assumes battery is low
- `tamperedPayload`: the payload of the MQTT message received on the topic. If not specified, assumes device tampered with
- `notTamperedPayload`: the payload of the MQTT message received on the topic. If not specified, assumes device tampered with
- `faultPayload`: the payload of the MQTT message received on the topic. If not specified, assumes device is faulty
- `noFaultPayload`: the payload of the MQTT message received on the topic. If not specified, assumes device is faulty

If you have multiple smoke sensors, then you can list them all in the config giving each one a unique name, MQTT topic and serial number.
