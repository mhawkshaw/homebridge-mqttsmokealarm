import { Service, PlatformAccessory } from 'homebridge';

import { MqttSmokeSensorPlatform as MqttSmokeSensorPlatform } from './platform';

import { Client, connect } from 'mqtt';

/**
 * MQTT Smoke Sensor Accessory
 * An instance of this class is created for each accessory registered (in this case only one)
 * The MQTT Smoke Detector accessory exposes the services of smoke detected, battery low and if tampered with
 */
export class MqttSmokeSensorSensor {
  private smokeSensorService: Service;

  private smokeDetectedTopic = '';
  private smokeDetectedPayload = '';
  private smokeNotDetectedTopic = '';
  private smokeNotDetectedPayload = '';
  private getSmokeDetectedTopic = '';
  private batteryLowTopic = '';
  private lowBatteryPayload = '';
  private batteryNormalTopic = '';
  private normalBatteryPayload = '';
  private getLowBatteryTopic = '';
  private tamperedTopic = '';
  private tamperedPayload = '';
  private notTamperedTopic = '';
  private notTamperedPayload = '';
  private getTamperedTopic = '';
  private faultTopic = '';
  private faultPayload = '';
  private noFaultTopic = '';
  private noFaultPayload = '';
  private getFaultTopic = '';

  // Use to store the sensor data for quick retrieval
  private sensorData = {
    smokeDetected: this.platform.Characteristic.SmokeDetected.SMOKE_NOT_DETECTED,
    batteryLow: this.platform.Characteristic.StatusLowBattery.BATTERY_LEVEL_NORMAL,
    tampered: this.platform.Characteristic.StatusTampered.NOT_TAMPERED,
    fault: this.platform.Characteristic.StatusFault.NO_FAULT,
  };

  private mqttClient: Client;
  private connectionAttempts = 1;
  readonly MAX_CONNECTION_ATTEMPTS: number = 30;

  // Subscribes to the specified MQTT topic
  private subscribeMqttTopic(topicName: string) {
    this.platform.log.debug('Subscribing to topic ->', topicName);
    if (this.mqttClient) {
      this.mqttClient.subscribe(topicName, { qos: 0 }, (error, granted) => {
        if (error) {
          this.platform.log.error('Unable to connect to the MQTT broker: ' + error.name + ' ' + error.message);
        } else {
          // If we're re-connecting then the existing topic subscription should still be persisted.
          if (granted.length > 0) {
            this.platform.log.debug(granted[0].topic + ' was subscribed');
          }
        }
      });
    }
  }

  // Send a message to the specified MQTT topic. Payload will be empty.
  private sendMqttMsg(topicName: string) {
    if (this.mqttClient) {
      this.mqttClient.publish(topicName, '');
    }
  }

  shutdown() {
    this.platform.log.debug('Shutdown called. Unsubscribing from MQTT broker.');
    this.mqttClient.unsubscribe(this.smokeDetectedTopic);
    this.mqttClient.unsubscribe(this.smokeNotDetectedTopic);
    this.mqttClient.unsubscribe(this.batteryLowTopic);
    this.mqttClient.unsubscribe(this.batteryNormalTopic);
    this.mqttClient.unsubscribe(this.tamperedTopic);
    this.mqttClient.unsubscribe(this.notTamperedTopic);
    this.mqttClient.unsubscribe(this.faultTopic);
    this.mqttClient.unsubscribe(this.noFaultTopic);
    this.mqttClient.end();
  }

  constructor(
    private readonly platform: MqttSmokeSensorPlatform,
    private readonly accessory: PlatformAccessory,
    private readonly displayName: string,
    private readonly manufacturer: string,
    private readonly model: string,
    private readonly serial: string,
    private readonly smokeDetected: string,
    private readonly smokeDetectedMsgPayload: string,
    private readonly smokeNotDetected: string,
    private readonly smokeNotDetectedMsgPayload: string,
    private readonly getSmokeDetected: string,
    private readonly batteryLow: string,
    private readonly lowBatteryMsgPayload: string,
    private readonly normalBattery: string,
    private readonly normalBatteryMsgPayload: string,
    private readonly getLowBattery: string,
    private readonly tampered: string,
    private readonly tamperedMsgPayload: string,
    private readonly notTampered: string,
    private readonly notTamperedMsgPayload: string,
    private readonly getTampered: string,
    private readonly fault: string,
    private readonly faultMsgPayload: string,
    private readonly noFault: string,
    private readonly noFaultMsgPayload: string,
    private readonly getFault: string,

  ) {
    this.smokeDetectedTopic = smokeDetected;
    this.smokeDetectedPayload = smokeDetectedMsgPayload;
    this.smokeNotDetectedTopic = smokeNotDetected;
    this.smokeNotDetectedPayload = smokeNotDetectedMsgPayload;
    this.getSmokeDetectedTopic = getSmokeDetected;
    this.batteryLowTopic = batteryLow;
    this.lowBatteryPayload = lowBatteryMsgPayload;
    this.batteryNormalTopic = normalBattery;
    this.normalBatteryPayload = normalBatteryMsgPayload;
    this.getLowBatteryTopic = getLowBattery;
    this.tamperedTopic = tampered;
    this.tamperedPayload = tamperedMsgPayload;
    this.notTamperedTopic = notTampered;
    this.notTamperedPayload = notTamperedMsgPayload;
    this.getTamperedTopic = getTampered;
    this.faultTopic = fault;
    this.faultPayload = faultMsgPayload;
    this.noFaultTopic = noFault;
    this.noFaultPayload = noFaultMsgPayload;
    this.getFaultTopic = getFault;

    // set accessory information
    const accessoryInfo: Service | undefined = this.accessory.getService(this.platform.Service.AccessoryInformation);

    if (accessoryInfo !== undefined) {
      accessoryInfo.setCharacteristic(this.platform.Characteristic.Manufacturer, manufacturer)
        .setCharacteristic(this.platform.Characteristic.Model, model)
        .setCharacteristic(this.platform.Characteristic.SerialNumber, serial);
    }

    this.smokeSensorService = this.accessory.getService(this.platform.Service.SmokeSensor) ||
      this.accessory.addService(this.platform.Service.SmokeSensor);

    // set the service name, this is what is displayed as the default name on the Home app
    this.smokeSensorService.setCharacteristic(this.platform.Characteristic.Name, displayName);

    // register handlers
    this.smokeSensorService.getCharacteristic(this.platform.Characteristic.SmokeDetected)
      .onGet(this.handleSmokeDetectedGet.bind(this));
    this.smokeSensorService.getCharacteristic(this.platform.Characteristic.StatusLowBattery)
      .onGet(this.handleLowBatteryGet.bind(this));
    this.smokeSensorService.getCharacteristic(this.platform.Characteristic.StatusTampered)
      .onGet(this.handleTamperedGet.bind(this));
    this.smokeSensorService.getCharacteristic(this.platform.Characteristic.StatusFault)
      .onGet(this.handleFaultGet.bind(this));

    // Connect to MQTT broker
    const options = {
      username: this.platform.config.username,
      password: this.platform.config.password,
    };

    let brokerUrl = this.platform.config.mqttbroker;

    // URL needs to include mqtt:// prefix
    if (brokerUrl && !brokerUrl.includes('://')) {
      brokerUrl = 'mqtt://' + brokerUrl;
    }

    this.platform.log.info('Connecting to MQTT broker...');
    this.mqttClient = connect(brokerUrl, options);

    this.mqttClient.on('message', (topic, message) => {
      this.platform.log.debug('MQTT topic: ', topic);
      this.platform.log.debug('MQTT message received: ', message.toString('utf-8'));

      if (topic === this.smokeDetectedTopic && (message.toString() === this.smokeDetectedPayload) || !this.smokeDetectedPayload) {
        this.sensorData.smokeDetected = this.platform.Characteristic.SmokeDetected.SMOKE_DETECTED;
        this.smokeSensorService.setCharacteristic(this.platform.Characteristic.SmokeDetected, this.sensorData.smokeDetected);
      } else if (topic === this.smokeNotDetectedTopic && (message.toString() === this.smokeNotDetectedPayload) ||
                  !this.smokeNotDetectedPayload) {
        this.sensorData.smokeDetected = this.platform.Characteristic.SmokeDetected.SMOKE_NOT_DETECTED;
        this.smokeSensorService.setCharacteristic(this.platform.Characteristic.SmokeDetected, this.sensorData.smokeDetected);
      } else if (topic === this.batteryLowTopic && (message.toString() === this.lowBatteryPayload) || !this.lowBatteryPayload) {
        this.sensorData.batteryLow = this.platform.Characteristic.StatusLowBattery.BATTERY_LEVEL_LOW;
        this.smokeSensorService.setCharacteristic(this.platform.Characteristic.StatusLowBattery, this.sensorData.batteryLow);
      } else if (topic === this.batteryNormalTopic && (message.toString() === this.normalBatteryPayload) || !this.normalBatteryPayload) {
        this.sensorData.batteryLow = this.platform.Characteristic.StatusLowBattery.BATTERY_LEVEL_NORMAL;
        this.smokeSensorService.setCharacteristic(this.platform.Characteristic.StatusLowBattery, this.sensorData.batteryLow);
      } else if (topic === this.tamperedTopic && (message.toString() === this.tamperedPayload) || !this.tamperedPayload) {
        this.sensorData.tampered = this.platform.Characteristic.StatusTampered.TAMPERED;
        this.smokeSensorService.setCharacteristic(this.platform.Characteristic.StatusTampered, this.sensorData.tampered);
      } else if (topic === this.notTamperedTopic && (message.toString() === this.notTamperedPayload) || !this.notTamperedPayload) {
        this.sensorData.tampered = this.platform.Characteristic.StatusTampered.NOT_TAMPERED;
        this.smokeSensorService.setCharacteristic(this.platform.Characteristic.StatusTampered, this.sensorData.tampered);
      } else if (topic === this.faultTopic && (message.toString() === this.faultPayload) || !this.faultPayload) {
        this.sensorData.fault = this.platform.Characteristic.StatusFault.GENERAL_FAULT;
        this.smokeSensorService.setCharacteristic(this.platform.Characteristic.StatusFault, this.sensorData.fault);
      } else if (topic === this.noFaultTopic && (message.toString() === this.noFaultPayload) || !this.noFaultPayload) {
        this.sensorData.fault = this.platform.Characteristic.StatusFault.NO_FAULT;
        this.smokeSensorService.setCharacteristic(this.platform.Characteristic.StatusFault, this.sensorData.fault);
      }
    });

    this.mqttClient.on('connect', () => {
      this.platform.log.info('Connected to MQTT broker');

      this.subscribeMqttTopic(this.smokeDetectedTopic);
      this.subscribeMqttTopic(this.smokeNotDetectedTopic);
      this.subscribeMqttTopic(this.batteryLowTopic);
      this.subscribeMqttTopic(this.batteryNormalTopic);
      this.subscribeMqttTopic(this.tamperedTopic);
      this.subscribeMqttTopic(this.notTamperedTopic);
      this.subscribeMqttTopic(this.faultTopic);
      this.subscribeMqttTopic(this.noFaultTopic);
    });

    this.mqttClient.on('disconnect', () => {
      this.platform.log.warn('Disconnected from MQTT broker');
    });

    this.mqttClient.on('error', (error) => {
      if (this.connectionAttempts === 1) {
        // First connection attempt. Notify user.
        this.platform.log.error('Problem with MQTT broker: ' + error.message);
      } else if (this.connectionAttempts > this.MAX_CONNECTION_ATTEMPTS) {
        // Reset counter to inform user on next attempt.
        this.connectionAttempts = 0;
      }
      this.connectionAttempts++;
    });
  }

  /**
   * Handle the "GET" requests from HomeKit
   * Here we use the locally stored data for performance reasons and also to avoid sending too many requests to the Enviro+ server
   */
  async handleSmokeDetectedGet(): Promise<number> {
    this.platform.log.debug('Smoke Detected ->', this.sensorData.smokeDetected);
    this.sendMqttMsg(this.getSmokeDetectedTopic);

    return this.sensorData.smokeDetected;
  }

  async handleLowBatteryGet(): Promise<number> {
    this.platform.log.debug('Low Battery ->', this.sensorData.batteryLow);
    this.sendMqttMsg(this.getLowBatteryTopic);

    return this.sensorData.batteryLow;
  }

  async handleTamperedGet(): Promise<number> {
    this.platform.log.debug('Tampered ->', this.sensorData.tampered);
    this.sendMqttMsg(this.getTamperedTopic);

    return this.sensorData.tampered;
  }

  async handleFaultGet(): Promise<number> {
    this.platform.log.debug('Fault ->', this.sensorData.fault);
    this.sendMqttMsg(this.getFaultTopic);

    return this.sensorData.fault;
  }
}
