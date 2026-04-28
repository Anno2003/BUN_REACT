import mqtt from "mqtt";
import { dispatchMQTT, requestRefreshAll } from "./mqtt.dispatcher";

const MQTT_HOST = "daya.sjahpoetro.com";
const MQTT_PORT = "1884";
const MQTT_USERNAME = "";
const MQTT_PASSWORD = "";
const MQTT_BASE_PATH = "SMUQ/ICOMP/167693337119600";

class MQTTService {
  private client;
  private basePath: string;

  constructor() {
    const brokerUrl = `mqtt://${MQTT_HOST}:${MQTT_PORT}`;
    const options: mqtt.IClientOptions = {
      username: MQTT_USERNAME,
      password: MQTT_PASSWORD,
    };
    this.client = mqtt.connect(brokerUrl, options);
    this.basePath = MQTT_BASE_PATH;

    this.setup();
  }

  private setup() {
    this.client.on("connect", () => {
      console.log(`MQTT connected to ${MQTT_HOST}:${MQTT_PORT}`);

      const subscribeTopic = `${this.basePath}/#`;

      this.client.subscribe(subscribeTopic, (err) => {
        if (err) {
          console.error("Subscribe error:", err);
        } else {
          console.log(`Subscribed to topic: ${subscribeTopic}`);
        }
      });

      requestRefreshAll();
    });

    this.client.on("message", (topic, message) => {
      const raw = message.toString();

      let payload: any;

      try {
        payload = JSON.parse(raw);
      } catch {
        console.warn("Invalid JSON payload:", raw);
        return;
      }
      dispatchMQTT(topic, payload);

    });

    this.client.on("error", (err) => {
      console.error("MQTT error:", err);
    });

    this.client.on("reconnect", () => {
      console.log("Reconnecting to MQTT...");
    });
  }

  publish(topic: string, payload: string) {
    const fullTopic = `${this.basePath}/${topic}`;
    this.client.publish(fullTopic, payload);
  }
}

// singleton instance
export const mqttService = new MQTTService();
