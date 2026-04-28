import * as React from 'react';
import "./services/mqtt.service"; 
import { Box, Divider, Switch } from "@mui/material";
import { Gauge } from '@mui/x-charts';
import { sensorService } from './services/sensor.service';
import { mqttService } from './services/mqtt.service'; 

export function App() {
  const [readings, setReadings] = React.useState(sensorService.getReadings());
  
  const [relay1State, setRelay1State] = React.useState(false);
  const [relay2State, setRelay2State] = React.useState(false);

  React.useEffect(() => {
    const handleSensorUpdate = (event: any) => {
      if (event.detail?.type === 'sensor_update') {
        const newReadings = event.detail.readings;
        const clonedReadings: any = {};
        for (const key in newReadings) {
          clonedReadings[key] = { ...newReadings[key] };
        }
        setReadings(clonedReadings);
      }
    };

    window.addEventListener('sensor_update', handleSensorUpdate as EventListener);

    return () => {
      window.removeEventListener('sensor_update', handleSensorUpdate as EventListener);
    };
  }, []);

  // --- Switch Handlers ---

  const publishRelay1 = (event: React.ChangeEvent<HTMLInputElement>, checked: boolean) => {
    setRelay1State(checked);
    const payload = {
      "cmd":"set",
      "args":{
        "device":19,
        "status":checked
      }
    };
    
    mqttService.publish('devices/cmd', JSON.stringify(payload));
  };

  const publishRelay2 = (event: React.ChangeEvent<HTMLInputElement>, checked: boolean) => {
    setRelay2State(checked);
    const payload = {
      "cmd":"set",
      "args":{
        "device":23,
        "status":checked
      }
    };
    
    mqttService.publish('devices/cmd', JSON.stringify(payload));
  };

  // Safely access the value
  const analogValue = readings['analog']?.['0']?.value ?? 0;
  
  return (
    <div className="app">
      <Box sx={{ width: 300, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Gauge
          width={100}
          height={100}
          value={Number(analogValue)}
        />
        
        <Divider />
        
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>Relay 1</span>
          <Switch
            checked={relay1State}
            onChange={publishRelay1}
            color="primary"
          />
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>Relay 2</span>
          <Switch
            checked={relay2State}
            onChange={publishRelay2}
            color="primary"
          />
        </Box>
      </Box>
    </div>
  );
}

export default App;