const aColorPicker = require('a-color-picker');
const blinkstick = require('blinkstick');

let currentColor;

// Find connected led via USB
const led = blinkstick.findFirst();

// Get led information
led.getDescription((err, data) => {
  document.getElementById('device-info-h').innerHTML += data;
});

led.getSerial((err, data) => {
  document.getElementById('device-serial-h').innerHTML += data;
});

led.getManufacturer((err, data) => {
  document.getElementById('device-manufact-h').innerHTML += data;
});


// Handle color selection
aColorPicker.from('.picker')
  .on('change', (picker, color) => {
    document.body.style.backgroundColor = color;
    currentColor = aColorPicker.parseColor(color, 'hex')
    led.setColor(currentColor);
  });

// Submit color to blinkstick
document.querySelector('.color-change').addEventListener('click', () => {
  console.log('asdfasdf');
  // Get current color's hex value
  led.morph(currentColor, () => {
    console.log(`Changing my color to ${currentColor}! Woohoo!`);
  });
});