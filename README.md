# G923 Visualizer
 
Shows your Logitech G923 wheel, pedals and shifter on screen. Made for OBS.
 
## Setup
 
1. Download the files
2. In OBS add a new Browser source
3. Tick `Local file` and pick `index.html`
4. Set width to `790` and height to `850`
5. Remove `overflow: hidden;` from Custom CSS

## Changing buttons and axes
 
Open `main.js` and edit the `CONFIG` part at the top. Axis numbers are for the wheel and pedals and the `btnGear` numbers are for the shifter. If something moves wrong try changing the number or flipping the invert option.
