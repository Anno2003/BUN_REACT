import { type Relay, relayFromJson } from "../models/relay.model.ts";
import { broadcast } from "./ws.service";
import { mqttService } from "./mqtt.service";

type RelayMap = Record<number, Relay>;

class RelayService {
	private relays: RelayMap = {};
	private isRefreshing: boolean = false;
	private pendingRelays: Set<number> = new Set();

	private notify() {
		broadcast({
			type: "relays_update",
			relays: this.relays,
			isRefreshing: this.isRefreshing,
			pending: Array.from(this.pendingRelays),
		});
	}

	updateFromMqtt(payload: any) {
		this.relays = {};
		this.pendingRelays.clear();
		this.isRefreshing = false;

		if (!Array.isArray(payload.device)) return;
		for (const item of payload.device) {
			const relay = relayFromJson(item);
			this.relays[relay.pin] = relay;
		}
		this.notify();
	}

	setUIRelayState(pin: number, newState: boolean) {
		const relay = this.relays[pin];
		if (!relay) return;
		if (relay.state === newState) return;
		relay.state = newState;
		this.notify();
	}

	requestRelaysRefresh() {
		this.isRefreshing = true;
		this.notify();
		mqttService.publish("devices/cmd", JSON.stringify({
			cmd: "print"
		}));
	}

	setRelay(pin: number, state: boolean) {
		this.pendingRelays.add(pin);
		this.notify();
		mqttService.publish("devices/cmd", JSON.stringify({
			'cmd': 'set',
			'args': { 'device': pin, 'status': state },
		}));

		this.requestRelaysRefresh();
	}

	byPin(pin: number): Relay | undefined {
		return this.relays[pin];
	}

	getAll(): Relay[] {
		return Object.values(this.relays);
	}

	clear() {
		this.relays = {};
		this.notify();
	}

}

export const relayService = new RelayService();
