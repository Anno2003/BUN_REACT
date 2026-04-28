import { type Alarm, alarmFromJson } from "../models/alarm.model";
import { broadcast } from "./ws.service";
import { mqttService } from "./mqtt.service";

// --- Types ---

export interface AlarmPayload {
  hour: number;
  minute: number;
  days: boolean[];
  duration: number;
  target_state: boolean;
  target: number;
  id?: number; // Optional for add, required for edit/delete
}

export interface AlarmCommand {
  cmd: 'print' | 'add' | 'edit' | 'remove';
  args?: Omit<AlarmPayload, 'cmd'>;
}

// --- Service Class ---

class AlarmService {
  private _alarms: Alarm[] = [];
  private _isRefreshing: boolean = false;

  // Getters (Read-only access to state)
  public get alarms(): readonly Alarm[] {
    return Object.freeze([...this._alarms]);
  }

  public get isRefreshing(): boolean {
    return this._isRefreshing;
  }

  public updateFromMqtt(payload: Record<string, unknown>): void {

    if (!payload || !('alarms' in payload)) {
      console.warn('Alarm is empty:', payload);
      // Optional: Decide if you want to clear alarms here or just ignore. 
      // Usually ignoring is safer for partial updates.
      this._isRefreshing = false;
      return;
    }

    const alarmsData = payload['alarms'];

    if (!Array.isArray(alarmsData)) {
      console.warn('Received invalid alarms payload from MQTT:', payload);
      return;
    }

    this._alarms = []; // Clear existing
    this._isRefreshing = false;

    for (const item of alarmsData) {
      if (typeof item === 'object' && item !== null) {
        // Assuming alarmFromJson handles the mapping from JS object to Alarm type
        this._alarms.push(alarmFromJson(item as Record<string, unknown>));
      }
    }

    // Notify connected WebSocket clients about the update
    this.notify();
  }

  /**
   * Clears the local list.
   */
  public clear(): void {
    this._alarms = [];
    this._isRefreshing = false;
    this.notify();
  }

  // --- Actions ---

  /**
   * Requests a fresh list of alarms from the device via MQTT.
   */
  public requestAlarmsRefresh(): void {
    this._isRefreshing = true;
    this.notify(); // Notify UI that loading started

    mqttService.publish('alarms/cmd', JSON.stringify({
      cmd: 'print',
    }));
  }

  /**
   * Adds a new alarm.
   */
  public addAlarm(params: {
    hour: number;
    minute: number;
    days: boolean[];
    duration: number;
    targetState: boolean;
    target: number;
  }): void {
    const command: AlarmCommand = {
      cmd: 'add',
      args: {
        hour: params.hour,
        minute: params.minute,
        days: params.days,
        duration: params.duration,
        target_state: params.targetState,
        target: params.target,
      },
    };

    mqttService.publish('alarms/cmd', JSON.stringify(command));
    
    // Optimistically refresh to get the new ID and confirmed state
    this.requestAlarmsRefresh();
  }

  /**
   * Edits an existing alarm.
   */
  public editAlarm(params: {
    id: number;
    hour: number;
    minute: number;
    days: boolean[];
    duration: number;
    targetState: boolean;
    target: number;
    enabled?: boolean;
  }): void {
    const command: AlarmCommand = {
      cmd: 'edit',
      args: {
        id: params.id,
        hour: params.hour,
        minute: params.minute,
        days: params.days,
        duration: params.duration,
        target_state: params.targetState,
        target: params.target,
      },
    };

    mqttService.publish('alarms/cmd', JSON.stringify(command));
    this.requestAlarmsRefresh();
  }

  /**
   * Deletes an alarm by ID.
   */
  public deleteAlarm(id: number): void {
    const command: AlarmCommand = {
      cmd: 'remove',
      args: {
          id,
          hour: 0,
          minute: 0,
          days: [],
          duration: 0,
          target_state: false,
          target: 0
      },
    };

    mqttService.publish('alarms/cmd', JSON.stringify(command));
    this.requestAlarmsRefresh();
  }

  // --- Helpers ---

  private notify(): void {
    broadcast({
      type: 'alarm_update',
      isRefreshing: this._isRefreshing,
      alarms: this._alarms,
    });
  }
}

// Export singleton instance
export const alarmService = new AlarmService();
