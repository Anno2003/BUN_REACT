import { broadcast } from "./ws.service";
import { mqttService } from "./mqtt.service";

export interface SystemState {
  mode: number | null;
  isChangingMode: boolean;
}

class SystemService {
  private _mode: number | null = null;
  private _isChangingMode: boolean = false;

  public get state(): SystemState {
    return {
      mode: this._mode,
      isChangingMode: this._isChangingMode,
    };
  }

  /**
   * Updates state from MQTT payload.
   * Expected payload: { mode: 1 }
   */
  public updateFromMqtt(payload: Record<string, unknown>): void {
    const newMode = payload['mode'] as number | undefined;

    if (newMode === undefined) {
      console.warn('Received system payload without mode:', payload);
      return;
    }

    this._mode = newMode;
    this._isChangingMode = false; // Reset loading state once confirmed by device
    
    this.notify();
  }

  /**
   * Requests current system state from device.
   */
  public requestSystemRefresh(): void {
    mqttService.publish('system/cmd', JSON.stringify({
      cmd: 'print',
    }));
  }

  /**
   * Changes the system mode.
   * @param mode The mode ID to set (e.g., 1, 2, 3)
   */
  public setSystemMode(mode: number): void {
    this._isChangingMode = true;
    this.notify(); // Notify immediately so UI shows loading state

    mqttService.publish('system/cmd', JSON.stringify({
      cmd: 'set-mode',
      args: { mode },
    }));

    // Optional: Trigger a refresh to confirm change, 
    // though usually the device broadcasts the new state automatically.
    // this.requestSystemRefresh(); 
  }

  /**
   * Broadcasts current state to connected WebSocket clients.
   */
  private notify(): void {
    broadcast({
      type: 'system_update',
      mode: this._mode,
      isChangingMode: this._isChangingMode,
    });
  }
}

export const systemService = new SystemService();