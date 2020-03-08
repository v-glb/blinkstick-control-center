// Imports 
const aColorPicker = require('a-color-picker');
const blinkstick = require('blinkstick');
const si = require('systeminformation');
const electron = require('electron');
const { ipcRenderer } = electron;

// IDs and classes from index.html for easier references
const DOMelements = {
  navDeviceTitle: document.getElementById('nav-device-title'),
  deviceSerial: document.getElementById('device-serial-h'),
  closeBtn: document.getElementById('close-btn'),
  currentMonitor: document.getElementById('current-monitor'),
  currentMonitorUse: document.getElementById('current-monitor-use'),
  blinkstickStatus: document.getElementById('blinkstick-status'),
  currentMonitorPause: document.getElementById('current-monitor-pause'),
  colorPicker: document.getElementById('color-picker'),
  darkModeSwitchStatus: document.getElementById('dark-mode-switch-status')
}

// Save state of currentColor with aColorPicker
let currentColor;
// Save state wether CPU or RAM usage is being monitored (or paused)
let currentMonitor;

// Find first connected led via USB
const led = blinkstick.findFirst();

if (!led) {
  console.log('Please check USB!'); // Debug, remove later
  DOMelements.navDeviceTitle.innerHTML = 'No LED!';

} else {
  // Get led information
  led.getDescription((err, data) => {
    DOMelements.navDeviceTitle.innerHTML += data;
  });

  led.getSerial((err, data) => {
    DOMelements.deviceSerial.innerHTML += data;
  });
}

/* 
        EVENT LISTENERS START
*/

// Close app on click of 'x'
DOMelements.closeBtn.addEventListener('click', () => {
  ipcRenderer.send('app:close');
});

// Apply dark-theme css
DOMelements.darkModeSwitchStatus.addEventListener('change', v => {
  darkModeToggler();
});

window.addEventListener('DOMContentLoaded', e => {
  // Initialize modal trigger
  const elems = document.querySelectorAll('.modal');
  const instances = M.Modal.init(elems);
});

// Initial State: Watch CPU usage
window.addEventListener('DOMContentLoaded', event => {
  monitorCPU();
});

/* 
        EVENT LISTENERS END
*/

/* 
        GLORIOUS COLOR WHEEL START
*/

aColorPicker.from('.picker')
  .on('change', (picker, color) => {
    currentColor = aColorPicker.parseColor(color, 'hex')
    led.setColor(currentColor);
  });

/* 
        GLORIOUS COLOR WHEEL END
*/

/* 
        FUNCTIONS START
*/

// Toggle bewteen light/dark mode
function darkModeToggler() {
  document.querySelector('body').classList.toggle('dark-theme-bg');
  document.querySelector('.modal').classList.toggle('dark-theme-bg');
  document.querySelector('.btn-flat').classList.toggle('dark-theme-font');
  document.querySelector('.modal-footer').classList.toggle('dark-theme-bg');
  document.querySelector('.modal-footer').classList.toggle('dark-theme-font');

  const h5List = document.querySelectorAll('h5');
  h5List.forEach((el) => {
    el.classList.toggle('dark-theme-font');
  });

  const h4List = document.querySelectorAll('h4');
  h4List.forEach((el) => {
    el.classList.toggle('dark-theme-font');
  });

  const settingsTextList = document.querySelectorAll('.text-settings');
  settingsTextList.forEach((el) => {
    el.classList.toggle('dark-theme-font');
  });

  const thList = document.querySelectorAll('th');
  thList.forEach((el) => {
    el.classList.toggle('dark-theme-font');
  });

}

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
      DOMelements.currentMonitorPause.innerHTML = '';

      // Calculate values based on total RAM
      memWarn = data.total * 0.5;
      memCrit = data.total * 0.8;

      const memUsage = Math.round((data.active / data.total) * 100 * 100) / 100;
      DOMelements.currentMonitor.innerHTML = 'RAM';
      DOMelements.currentMonitorUse.innerHTML = `${memUsage}%`;

      // Turn blinkstick red and start pulsing if RAM is critical 
      if (data.active >= memCrit) {
        DOMelements.blinkstickStatus.innerHTML = 'Critical';
        console.log('Critical mem usage!'); // Debug, remove later
        led.pulse('red', () => {
          led.morph('red')
        });
      }

      // Turn blinkstick orange if RAM is warning
      else if (data.active >= memWarn) {
        DOMelements.blinkstickStatus.innerHTML = 'Warning';
        led.morph('orange');

        // Turn blinkstick green if RAM is ok
      } else {
        DOMelements.blinkstickStatus.innerHTML = 'OK';
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
      DOMelements.currentMonitorPause.innerHTML = '';

      const cpuUsage = Math.round(data.currentload * 100) / 100;
      DOMelements.currentMonitor.innerHTML = 'CPU';
      DOMelements.currentMonitorUse.innerHTML = `${cpuUsage}%`;

      if (data.currentload >= cpuCrit) {
        DOMelements.blinkstickStatus.innerHTML = 'Critical';
        console.log('Critical cpu usage!'); //Debug remove later
        led.pulse('red', () => {
          led.morph('red')
        });
      }

      else if (data.currentload >= cpuWarn) {
        DOMelements.blinkstickStatus.innerHTML = 'Warning';
        led.morph('orange')
      }

      else {
        DOMelements.blinkstickStatus.innerHTML = 'OK';
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
  clearStatusTable();

  console.log('Disabling all monitoring.'); // Debug, remove later
  DOMelements.currentMonitorPause.innerHTML = 'Monitoring currently paused!';

  led.morph('gray');
}

function clearStatusTable() {
  DOMelements.currentMonitor.innerHTML = '';
  DOMelements.currentMonitorUse.innerHTML = '';
  DOMelements.blinkstickStatus.innerHTML = '';
}

/* 
        FUNCTIONS END
*/

/* 
        IPC MANAGEMENT START
*/

ipcRenderer.on('monitor:ram', e => {
  // Clear previous monitor
  clearTimeout(currentMonitor);

  console.log('Keeping an eye on memory usage.'); // Debug, remove later
  monitorMem();
});

ipcRenderer.on('monitor:cpu', e => {
  // Clear previous monitor
  clearTimeout(currentMonitor);

  console.log('Keeping an eye on cpu usage.'); // Debug, remove later
  monitorCPU();
});

ipcRenderer.on('monitor:pause', e => {
  stopMonitoring();
});

/*
        IPC MANAGEMENT END
*/