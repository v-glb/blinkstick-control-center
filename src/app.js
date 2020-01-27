const aColorPicker = require('a-color-picker');
const blinkstick = require('blinkstick');

let currentColor;

// Find connected blinkstick via USB
const led = blinkstick.findFirst();

// Handle color selection
aColorPicker.from('.picker')
  .on('change', (picker, color) => {
    document.body.style.backgroundColor = color;
    currentColor = aColorPicker.parseColor(color, 'hex')
  });

// Submit color to blinkstick
document.querySelector('.color-change').addEventListener('click', () => {
  console.log('asdfasdf');
  // Get current color's hex value
  led.morph(currentColor, () => {
    console.log(`Changing my color to ${currentColor}! Woohoo!`);
  });
});