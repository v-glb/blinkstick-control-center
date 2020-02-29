// Imports 
const aColorPicker = require('a-color-picker');
const blinkstick = require('blinkstick');
const si = require('systeminformation');
const electron = require('electron');
const { ipcRenderer } = electron;

// TODO: Define DOM elements as object / variables

// Save state of currentColor with aColorPicker
let currentColor;
// Save state wether CPU or RAM usage is being monitored
let currentMonitor;

// Find first connected led via USB
const led = blinkstick.findFirst();

if (!led) {
  console.log('Please check USB!');
  document.getElementById('nav-device-title').innerHTML = 'No LED!';

} else {
  // Get led information
  led.getDescription((err, data) => {
    document.getElementById('nav-device-title').innerHTML += data;
  });

  led.getSerial((err, data) => {
    document.getElementById('device-serial-h').innerHTML += data;
  });
}

/* 
        EVENT LISTENERS
*/

// Initial State: Watch CPU usage
window.addEventListener('DOMContentLoaded', event => {
  monitorCPU();
});

/* 
        GLORIOUS COLOR WHEEL
*/
aColorPicker.from('.picker')
  .on('change', (picker, color) => {
    currentColor = aColorPicker.parseColor(color, 'hex')
    led.setColor(currentColor);
  });

// Close app on click of 'x'
document.getElementById('close-btn').addEventListener('click', () => {
  ipcRenderer.send('app:close');
});

/* 
------------------ RAM Monitor ------------------------
Tresholds:
  Warning   - 50% Usage
  Critical  - 80% Usage
*/

let memWarn;
let memCrit;

function monitorMem() {
  // Get current memory information as promise
  si.mem()
    // Consume promise
    .then(data => {
      // Calculate values based on total RAM
      memWarn = data.total * 0.5;
      memCrit = data.total * 0.8;

      const memUsage = Math.round((data.active / data.total) * 100 * 100) / 100;
      document.getElementById('current-monitor').innerHTML = 'RAM';
      document.getElementById('current-monitor-use').innerHTML = `${memUsage}%`

      // Turn blinkstick red and start pulsing if RAM is critical 
      if (data.active >= memCrit) {
        console.log('Critical mem usage!');
        led.pulse('red', () => {
          led.morph('red')
        });
      }

      // Turn blinkstick orange if RAM is warning
      else if (data.active >= memWarn) {
        led.morph('orange');

        // Turn blinkstick green if RAM is ok
      } else {
        led.morph('green');
      }
    })
    // Error handling
    .catch(error => console.log(error));

  // Update mem status every 5 seconds
  currentMonitor = setTimeout(monitorMem, 5000)
}

/* 
------------------ CPU/Average Load Monitor ------------------------
Tresholds:
  Warning   - 50% Usage
  Critical  - 80%  Usage
*/

const cpuWarn = 50;
const cpuCrit = 80;

function monitorCPU() {
  si.currentLoad()
    .then(data => {
      const cpuUsage = Math.round(data.currentload * 100) / 100;
      document.getElementById('current-monitor').innerHTML = 'CPU';
      document.getElementById('current-monitor-use').innerHTML = `${cpuUsage}%`;

      if (data.currentload >= cpuCrit) {
        console.log('Critical cpu usage!');
        led.pulse('red', () => {
          led.morph('red')
        });
      }

      else if (data.currentload >= cpuWarn) {
        led.morph('orange')
      }

      else {
        led.morph('green');
      }
    })
    // Error handling
    .catch(error => console.log(error));

  currentMonitor = setTimeout(monitorCPU, 5000)
}

// Clear monitoring loops
function stopMonitoring() {
  clearTimeout(currentMonitor);
}

/* 
        IPC MANAGEMENT
*/
ipcRenderer.on('monitor:ram', e => {
  // Clear previous monitor
  clearTimeout(currentMonitor);

  console.log('Keeping an eye on memory usage.');
  monitorMem();
});

ipcRenderer.on('monitor:cpu', e => {
  // Clear previous monitor
  clearTimeout(currentMonitor);

  console.log('Keeping an eye on cpu usage.');
  monitorCPU();
});

ipcRenderer.on('monitor:pause', e => {
  // Clear previous monitor
  clearTimeout(currentMonitor);

  console.log('Disabling all monitoring.');
  document.getElementById('current-monitor').innerHTML = 'Monitoring currently paused!';
      document.getElementById('current-monitor-use').innerHTML = '';
});