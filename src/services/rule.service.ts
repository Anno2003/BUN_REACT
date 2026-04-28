import { type Rule, ruleFromJson } from "../models/rule.model";
import { broadcast } from "./ws.service";
import { mqttService } from "./mqtt.service";

export interface RulePayload {
    min: number;
    max: number;
    target_state: boolean;
    target: number;
    sensor_id: number;
    id?: number; // Optional for add, required for edit/delete
}

export interface RuleCommand {
    cmd: 'print' | 'add' | 'edit' | 'remove';
    args?: Omit<RulePayload, 'cmd'>;
}

class RuleService {
    private _rules: Rule[] = [];
    private _isRefreshing: boolean = false;

    public get rules(): readonly Rule[] {
        return Object.freeze([...this._rules]);
    }

    public get isRefreshing(): boolean {
        return this._isRefreshing;
    }

    public updateFromMqtt(payload: Record<string, unknown>): void {
        const rulesData = payload['rules'];
        if (!Array.isArray(rulesData)) {
            console.warn('Received invalid rules payload from MQTT:', payload);
            return;
        }

        this._rules = [];
        for (const item of rulesData) {
            if (typeof item === 'object' && item !== null) {
                // Convert raw JS object to Rule type using your model helper
                this._rules.push(ruleFromJson(item as Record<string, unknown>));
            }
        }

        this._isRefreshing = false;

        this.notify();
    }

    public clear(): void {
        this._rules = [];
        this._isRefreshing = false;
        this.notify();
    }

    public requestRulesRefresh(): void {
        this._isRefreshing = true;
        this.notify();

        mqttService.publish('rules/cmd', JSON.stringify({
            cmd: 'print',
        }));
    }

    /**
   * Adds a new automation rule.
   */
    public addRule(params: {
        min: number;
        max: number;
        targetState: boolean;
        target: number;
        sensorId: number;
    }): void {
        const command: RuleCommand = {
            cmd: 'add',
            args: {
                min: params.min,
                max: params.max,
                target_state: params.targetState,
                target: params.target,
                sensor_id: params.sensorId,
            },
        };

        mqttService.publish('rules/cmd', JSON.stringify(command));
        this.requestRulesRefresh();
    }

    /**
     * Edits an existing rule.
     */
    public editRule(params: {
        id: number;
        min: number;
        max: number;
        targetState: boolean;
        target: number;
        sensorId: number;
    }): void {
        const command: RuleCommand = {
            cmd: 'edit',
            args: {
                id: params.id,
                min: params.min,
                max: params.max,
                target_state: params.targetState,
                target: params.target,
                sensor_id: params.sensorId,
            },
        };

        mqttService.publish('rules/cmd', JSON.stringify(command));
        this.requestRulesRefresh();
    }

    /**
     * Deletes a rule by ID.
     * Note: Fixed typo from 'ruless/cmd' to 'rules/cmd'
     */
    public deleteRule(id: number): void {
        const command: RuleCommand = {
            cmd: 'remove',
            args: {
                id,
                min: 0,
                max: 0,
                target_state: false,
                target: 0,
                sensor_id: 0
            },
        };

        mqttService.publish('rules/cmd', JSON.stringify(command));
        this.requestRulesRefresh();
    }

    private notify(): void {
        broadcast({
            type: 'rule_update',
            isRefreshing: this._isRefreshing,
            rules: this._rules,
        });
    }
}

export const ruleService = new RuleService();