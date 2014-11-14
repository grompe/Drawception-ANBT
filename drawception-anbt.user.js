// ==UserScript==
// @name         Drawception ANBT
// @author       Grom PE
// @namespace    http://grompe.org.ru/
// @version      1.29.2014.11
// @description  Enhancement script for Drawception.com - Artists Need Better Tools
// @downloadURL  https://raw.github.com/grompe/Drawception-ANBT/master/drawception-anbt.user.js
// @match        http://drawception.com/*
// @match        https://drawception.com/*
// @grant        none
// @run-at       document-start
// @license      Public domain
// ==/UserScript==

function wrapped() {

var SCRIPT_VERSION = "1.29.2014.11";
var NEWCANVAS_VERSION = 9; // Increase to update the cached canvas

// == DEFAULT OPTIONS ==

var options =
{
  asyncSkip: 0, // Whether to try loading next game pages asynchronously when skipped
  enableWacom: 0, // Whether to enable Wacom plugin and thus pressure sensitivity support
  fixTabletPluginGoingAWOL: 1, // Fix pressure sensitivity disappearing in case of stupid/old Wacom plugin
  hideCross: 0, // Whether to hide the cross when drawing
  enterToCaption: 0, // Whether to submit caption by pressing Enter
  pressureExponent: 0.5, // Smaller = softer tablet response, bigger = sharper
  brushSizes: [2, 5, 12, 35], // Brush sizes for choosing via keyboard
  loadChat: 1, // Whether to load the chat
  chatAutoConnect: 0, // Whether to automatically connect to the chat
  removeFlagging: 1, // Whether to remove flagging buttons
  ownPanelLikesSecret: 0,
  backup: 1,
  timeoutSound: 0,
  timeoutSoundBlitz: 0,
  newCanvas: 1,
  proxyImgur: 0,
  rememberPosition: 0,
  ajaxRetry: 1,
  localeTimestamp: 0,
  autoplay: 1, // Whether to automatically start playback of a recorded drawing
  submitConfirm: 1,
};

/*
== HOW TO USE ==
- Chrome/Iron: (Recommended: all features, best performance)
  - add the script in Tampermonkey addon
  - or open URL: chrome://extensions then drag and drop this .user.js file on it
- Firefox: add the script in Greasemonkey addon
- Opera 12.x: add the script in "site properties"

== FEATURES ==
General
- Menu buttons in the header for easier access
- Fix keyboard scrolling after pages load
- Fix notifications showing in Opera and Firefox < 5
- No temptation to judge
- An embedded chat
- Automatically retry failed requests to reduce annoying error messages
Canvas:
- Wacom tablet eraser and smooth pressure support; doesn't conflict with mouse
- Secondary color, used with right mouse button; palette right-clicking
- Alt+click picks a color from the canvas
- Brush cursor
- Current colors indicator
- X swaps primary and secondary colors
- B selects last used color as primary
- E selects eraser
- [ ] and - = changes brush sizes
- Shift+F fills with the current color
- Confirm closing a page if it has a canvas and is painted on
- Don't confirm clearing, but allow to undo it
Sandbox
- Re-add background button
- Add drawing time indicator
- Add palettes
- Upload directly to imgur
View game
- Add reverse panels button
- Add "like all" button
- Track new comments
- Show when the game was started
- Ability to favorite panels
Play
- Much faster skipping
- Play modes for those who only caption or only draw
- Enter pressed in caption mode submits the caption
- Ability to bookmark games without participating
- Show your panel position and track changes in unfinished games list
Forum
- Better-looking timestamps with correct timezone
- Clickable drawing panels
- Clickable links
- Show and highlight direct links to forum posts
*/

var __DEBUG__, prestoOpera, firefox4OrOlder, username, userid;
var usingTablet, bgoptions, fileInput, sandboxDrawingStart;

var playMode = localStorage.getItem("gpe_playMode");
playMode = (playMode === null) ? 0 : parseInt(playMode, 10);
var inDark = localStorage.getItem("gpe_inDark");
inDark = (inDark === null) ? 0 : parseInt(inDark, 10);

var MODE_ALL = 0;
var MODE_CAPTION_ONLY = 1;
var MODE_DRAW_ONLY = 2;
var availablePlayModes = ["Mode: captions and drawings", "Mode: only make captions", "Mode: only draw"];
var palettes =
[
  {
    name: "Normal",
    class: "label-normalpal",
    colors:
    [
      '#000000', '#444444', '#999999', '#ffffff',
      '#603913', '#c69c6d', '#FFDAB9', '#FF0000',
      '#FFD700', '#FF6600', '#16ff00', '#0fad00',
      '#00FFFF', '#0247fe', '#ec008c', '#8601af',
      '#fffdc9',
    ],
  },
  {
    name: "Sepia",
    class: "label-sepia",
    colors:
    [
      '#402305', '#503315', '#604325', '#705335',
      '#806345', '#907355', '#a08365', '#b09375',
      '#bfa284', '#cfb294', '#dfc2a4', '#ffe2c4',
    ],
  },
  {
    name: "Grayscale",
    class: "label-darkgray",
    colors:
    [
      '#000000', '#111111', '#222222', '#333333',
      '#444444', '#555555', '#666666', '#777777',
      '#888888', '#999999', '#c0c0c0', '#ffffff',
      '#eeeeee'
    ],
  },
  {
    name: "B&W",
    longname: "Black and white",
    class: "label-inverse",
    colors:
    [
      '#ffffff', '#000000',
    ],
  },
  {
    name: "CGA",
    class: "label-cga",
    colors:
    [
      '#555555', '#000000', '#0000AA', '#5555FF',
      '#00AA00', '#55FF55', '#00AAAA', '#55FFFF',
      '#AA0000', '#FF5555', '#AA00AA', '#FF55FF',
      '#AA5500', '#FFFF55', '#AAAAAA', '#FFFFFF',
    ],
    background: '#FFFF55',
  },
  {
    name: "Gameboy",
    class: "label-theme_gameboy",
    colors:
    [
      '#8bac0f', '#9bbc0f', '#306230', '#0f380f',
    ],
  },
  {
    name: "Neon",
    class: "label-neon",
    colors:
    [
      '#ffffff', '#000000', '#adfd09', '#feac09',
      '#fe0bab', '#ad0bfb', '#00abff',
    ],
  },
  {
    name: "Thxgiving",
    longname: "Thanksgiving",
    class: "label-theme_thanksgiving",
    colors:
    [
      '#673718', '#3c2d27', '#c23322', '#850005',
      '#c67200', '#77785b', '#5e6524', '#cfb178',
      '#f5e9ce',
    ],
  },
  {
    name: "Holiday",
    class: "label-theme_holiday",
    colors:
    [
      '#3d9949', '#7bbd82', '#7d1a0c', '#bf2a23',
      '#fdd017', '#00b7f1', '#bababa', '#ffffff',
    ],
  },
  {
    name: "Valentine",
    longname: "Valentine's",
    class: "label-theme_valentines",
    colors:
    [
      '#8b2158', '#a81f61', '#bb1364', '#ce0e62',
      '#e40f64', '#ff0000', '#f5afc8', '#ffccdf',
      '#e7e7e7', '#ffffff',
    ],
  },
  {
    name: "Halloween",
    class: "label-warning",
    colors:
    [
      '#444444', '#000000', '#999999', '#FFFFFF',
      '#603913', '#c69c6d', '#7A0E0E', '#B40528',
      '#FD2119', '#FA5B11', '#FAA611', '#FFD700',
      '#602749', '#724B97', '#BEF202', '#519548',
      '#B2BB1E',
    ],
    background: '#444444',
  },
  {
    name: "the blues",
    class: "label-theme_blues",
    colors:
    [
      '#b6cbe4', '#618abc', '#d0d5ce', '#82a2a1',
      '#92b8c1', '#607884', '#c19292', '#8c2c2c',
      '#295c6f',
    ],
  },
  {
    name: "March",
    class: "label-theme_holiday",
    colors:
    [
      '#9ed396', '#57b947', '#4d7736', '#365431', '#231302',
      '#3e2409', '#a66621', '#a67e21', '#ebbb49', '#ffc0cb', '#fff'
    ],
  },
  {
    name: "???",
    class: "label-normalpal",
    colors:
    [
      '#000000', '#ffffff', '#ff0000', '#00ff00',
      '#0000ff', 'rgba(0,0,0,0.3)', 'rgba(255,255,255,0.3)', 'rgba(255,0,0,0.3)',
      'rgba(0,255,0,0.3)', 'rgba(0,0,255,0.3)'
    ],
  },
];
var alarmSoundOgg = 'data:audio/ogg;base64,T2dnUwACAAAAAAAAAABnHAAAAAAAAHQUSFoBHgF2b3JiaXMAAAAAAUSsAAAAAAAAYG0AAAAAAADJAU9nZ1MAAAAAAAAAAAAAZxwAAAEAAABq35G0DxD/////////////////NQN2b3JiaXMAAAAAAAAAAAEFdm9yYmlzH0JDVgEAAAEAFGNWKWaZUpJbihlzmDFnGWPUWoolhBRCKKVzVlurKbWaWsq5xZxzzpViUilFmVJQW4oZY1IpBhlTEltpIYQUQgehcxJbaa2l2FpqObacc62VUk4ppBhTiEromFJMKaQYU4pK6Jxz0DnmnFOMSgg1lVpTyTGFlFtLKXROQgephM5SS7F0kEoHJXRQOms5lRJTKZ1jVkJquaUcU8qtpphzjIHQkFUAAAEAwEAQGrIKAFAAABCGoSiKAoSGrAIAMgAABOAojuIokiI5kmM5FhAasgoAAAIAEAAAwHAUSZEUy9EcTdIszdI8U5ZlWZZlWZZlWZZd13VdIDRkFQAAAQBAKAcZxRgQhJSyEggNWQUAIAAAAIIowxADQkNWAQAAAQAIUR4h5qGj3nvvEXIeIeYdg9577yG0XjnqoaTee++99x5777n33nvvkWFeIeehk9577xFiHBnFmXLee+8hpJwx6J2D3nvvvfeec+451957752j3kHpqdTee++Vk14x6Z2jXnvvJdUeQuqlpN5777333nvvvffee++9955777333nvvrefeau+9995777333nvvvffee++9995777333nvvgdCQVQAAEAAAYRg2iHHHpPfae2GYJ4Zp56T3nnvlqGcMegqx9557773X3nvvvffeeyA0ZBUAAAgAACGEEFJIIYUUUkghhhhiyCGHHIIIKqmkoooqqqiiiiqqLKOMMsook4wyyiyjjjrqqMPOQgoppNJKC620VFtvLdUehBBCCCGEEEIIIYQQvvceCA1ZBQCAAAAwxhhjjEEIIYQQQkgppZRiiimmmAJCQ1YBAIAAAAIAAAAsSZM0R3M8x3M8x1M8R3RER3RER5RESbRETfREUTRFVbRF3dRN3dRNXdVN27VVW7ZlXdddXddlXdZlXdd1Xdd1Xdd1Xdd1XbeB0JBVAAAIAABhkEEGGYQQQkghhZRSijHGGHPOOSA0ZBUAAAgAIAAAAEBxFEdxHMmRJMmyLM3yLM8SNVMzNVNzNVdzRVd1Tdd0Vdd1Tdd0TVd0Vdd1XVd1Vdd1Xdd1Xdc0Xdd1XdN1Xdd1Xdd1Xdd1XRcIDVkFAEgAAOg4juM4juM4juM4jiQBoSGrAAAZAAABACiK4jiO4ziSJEmWpVma5VmiJmqiqIqu6QKhIasAAEAAAAEAAAAAACiWoimapGmaplmapmmapmmapmmapmmapmmapmmapmmapmmapmmapmmapmmapmmapmmapmmapmmapmkaEBqyCgCQAABQcRzHcRzHkRzJkRxHAkJDVgEAMgAAAgBQDEdxHEeSLMmSNMuyNE3zRFF0TdU0XdMEQkNWAQCAAAACAAAAAABQLEmTNE3TNEmTNEmTNE3TNEfTNE3TNE3TNE3TNE3TNE3TNE3TNE3TNE3TNE3TNE3TNE3TLMuyLMuyLCA0ZCUAAAQAwFpttdbaKuUgpNoaoRSjGivEHKQaO+SUs9oy5pyT2ipijGGaMqOUchoIDVkRAEQBAADGIMcQc8g5J6mTFDnnqHRUGggdpY5SZ6m0mmLMKJWYUqyNg45SRy2jlGosKXbUUoyltgIAAAIcAAACLIRCQ1YEAFEAAIQxSCmkFGKMOacYRIwpxxh0hjEGHXOOQeechFIq55h0UErEGHOOOaicg1IyJ5WDUEonnQAAgAAHAIAAC6HQkBUBQJwAgEGS' +
  'PE/yNFGUNE8URVN0XVE0VdfyPNP0TFNVPdFUVVNVZdlUVVe2PM80PVNUVc80VdVUVdk1VVV2RVXVZdNVddlUVd12bdnXXVkWflFVZd1UXVs3VdfWXVnWfVeWfV/yPFX1TNN1PdN0XdV1bVt1Xdv2VFN2TdV1ZdN1Zdl1ZVlXXVm3NdN0XdFVZdd0Xdl2ZVeXVdm1ddN1fVt1XV9XZVf4ZVnXhVnXneF0XdtXXVfXVVnWjdmWdV3Wbd+XPE9VPdN0Xc80XVd1XdtWXdfWNdOUXdN1bVk0XVdWZVnXVVeWdc80Xdl0XVk2XVWWVdnVdVd2ddl0Xd9WXdfXTdf1bVu3jV+Wbd03Xdf2VVn2fVV2bV/WdeOYddm3PVX1fVOWhd90XV+3fd0ZZtsWhtF1fV+VbV9YZdn3dV052rpuHKPrCr8qu8KvurIu7L5OuXVbOV7b5su2rRyz7gu/rgtH2/eVrm37xqzLwjHrtnDsxm0cv/ATPlXVddN1fd+UZd+XdVsYbl0YjtF1fV2VZd9XXVkYblsXhlv3GaPr+sIqy76w2rIx3L4tDLswHMdr23xZ15WurGMLv9LXjaNr20LZtoWybjN232fsxk4YAAAw4AAAEGBCGSg0ZEUAECcAYJEkUZQsyxQlyxJN0zRdVTRN15U0zTQ1zTNVTfNM1TRVVTZNVZUtTTNNzdNUU/M00zRVUVZN1ZRV0zRt2VRVWzZNVbZdV9Z115Vl2zRNVzZVU5ZNVZVlV3Zt2ZVlW5Y0zTQ1z1NNzfNMU1VVWTZV1XU1z1NVzRNN1xNFVVVNV7VV1ZVly/NMVRM11/REU3VN17RV1VVl2VRV2zZNVbZV19VlV7Vd35Vt3TdNVbZN1bRd1XVl25VV3bVtW9clTTNNzfNMU/M8UzVV03VNVXVly/NU1RNFV9U00XRVVXVl1XRVXfM8VfVEUVU10XNN1VVlV3VNXTVV03ZVV7Vl01RlW5ZlYXdV29VNU5Vt1XVt21RNW5Zt2RdeW/Vd0TRt2VRN2zZVVZZl2/Z1V5ZtW1RNWzZNV7ZVV7Vl2bZtXbZtXRdNVbZN1dRlVXVdXbZd3ZZl29Zd2fVtVXV1W9Zl35Zd3RV2X/d915VlXZVV3ZZlWxdm2yXbuq0TTVOWTVWVZVNVZdmVXduWbVsXRtOUZdVVddc0VdmXbVm3ZdnWfdNUZVtVXdk2XdW2ZVm2dVmXfd2VXV12dVnXVVW2dV3XdWF2bVl4XdvWZdm2fVVWfd32faEtq74rAABgwAEAIMCEMlBoyEoAIAoAADCGMecgNAo55pyERinnnJOSOQYhhFQy5yCEUFLnHIRSUuqcg1BKSqGUVFJqLZRSUkqtFQAAUOAAABBgg6bE4gCFhqwEAFIBAAyOY1meZ5qqquuOJHmeKKqq6/q+I1meJ4qq6rq2rXmeKJqm6sqyL2yeJ4qm6bqurOuiaZqmqrquLOu+KIqmqaqyK8vCcKqq6rquLNs641RV13VlW7Zt4VddV5Zt27Z1X/hV15Vl27ZtXReGW9d93xeGn9C4dd336cbRRwAAeIIDAFCBDasjnBSNBRYashIAyAAAIIxByCCEkEFIIaSQUkgppQQAAAw4AAAEmFAGCg1ZEQDECQAAiFBKKaXUUUoppZRSSimlklJKKaWUUkoppZRSSimlVFJKKaWUUkoppZRSSimllFJKKaWUUkoppZRSSimllFJKKaWUUkoppZRSSimllFLqKKWUUkoppZRSSimllFJKKaWUUkoppZRSSimllFJKqaSUUkoppZRSSimllFJKKaWUUkoppZRSSimllFJKKaWUUkoppZRSSimllFJKKaWUUUoppZRSSimllFJKKaWUSkoppZRSSimllFJKKaWUUkoppZRSSimllFJKKaWUUkoppZRSSimllFJKKaWU' +
  'UkoppZRSSimllFJKKaWUUkoppZRSSimllFJKKaWUUkoppZRSSimllFJKKaWUUkoppZRSSimllFJKKaWUUkoppZRSSimllFJKKaWUUkoppZRSSimllFJKKaWUUkoppZRSSimllFJKKaWUUkoppZRSSimllFJKKaWUUkoppZRSSimllFJKKaWUUkoppZRSSimVUkoppZRSSimllFJKKaWUUkoppZRSSimllFJKKaWUAgCkIhwApB5MKAOFhqwEAFIBAABjlFIKOuicQ4wx5pyTTjqIGHOMOSmptJQ5ByGUlFJKKXPOQQillJRa5hyEklJLLaXMOQilpJRaS52UUlKqqbUWQymltFRTTS2WlFKKqdYYY00ptdRai7XG2lJrrcUYa6w1tVZbjC3GWmsBADgNDgCgBzasjnBSNBZYaMhKACAVAAAxRinGnIMQOoOQUs5BByGEBiGmnHMOOugUY8w5ByGEECrGGHMOQgghZM45Bx2EEkLJnHMOQgghlNJBCCGEEEoJpYMQQgghhFBKCKGEUEIopZQQQgghlFBKKSGEEkIpoZRSQgglhFBKKaUUAABY4AAAEGDD6ggnRWOBhYasBACAAAAgZaGGkCyAkGOQXGMYg1REpJRjDmzHnJNWROWUU05ERx1liHsxRuhUBAAAIAgACDABBAYICkYhCBDGAAAEITJDJBRWwQKDMmhwmAcADxAREgFAYoKi1YUL0MUALtCFuxwQgiAIgiAsGoACJMCBE9zgCW/wBDdwAh1FSR0EAAAAAIACAHwAABwUQEREcxUWFxgZGhscHR4BAAAAAMAEAB8AAMcHEBHRXIXFBUaGxgZHh0cAAAAAAAAAAAAQEBAAAAAAAAgAAAAQEE9nZ1MAAIDaAAAAAAAAZxwAAAIAAAAqpEEvIiYpmZmbjKaYlaSRkqaViYqKh4V7fnV7JSIkKyyanZyQoZ283DtYRAkUX087uupqj4fNo3Wl9/CWhqowHaBQUiMwnpEYX+kOAMTaZa3cRgDsvB0UUAozijjUHs3+FKS+LfueownmmxkC81Pkc9qENwkAumxOfyx+0Q6Uahs8h6PU+rTO1JnqAQAKJDwAcK83DAoBQigEQSEAFgQAAIDHCACAgAwzAsDaC31cK/mSxa9TxfE68dQfL98fjbrTj05ivh/Fh649TN6WmMkTPbe2SKnNC9rXXEYDoYCjsXCJDnLQgAkgAAUAAQCAADCI2zee5uonAAHAogMA+kNoACgAFgD5WgEkAOYJEqABXjy2f7J6xDCC3W43/lai1LpCu5truoOwNBs+Eh4A6BrDAwB/rhBCIRAKgVBIuz4f2+JYXft6MgAAlPfdxAGlOc3rvKcFEdXUcc2ePP1yee6dEtXIw5LN+B+cPpzeqY4+83qXAQD6/ZphQMJoGgnbJ+DSmM7APkAA6ChA7RITYAIsFgBg3BhoAHigAKDtxwwNkIAEAGvUWzQA/ivmf6x+KF+I73bn4rUopS4Lm3sAQEevxqYEU/gcHgDYy/AA4PXhgwn0A1Qs1S4xS7d/W3dWLL5ldpIPAACnNPZJQVFFj5/Vw26VHzHH9GQ40KbCX8TOgRgG9e9rAOiX9l2MvAcBsuCGPj+NaoCTvqXDAjgRoIFGKgc8mABMmAATgHWqJmJBAQAdOsDdJEADTAAd6ADfWwELWAAenc7fWj2qfYFne/cSrAUotS7QkygjGAEADQkPALyeGB4AfPtnQwAKQKgILAQFAADgBwAApIXpANCreq9GhnvfDpSqoLo/2tk7079cO4oVV3K/sYDK9pJ1nWmjmoJkNp/3rhKQFsD2yoMApR8C4B94gAUo7vQAYwEA+pQA0EEBQPssApAaQAAA+yuADv4Ltt9e/aHyAbvdSsHahVLLCjWXB5JFB2JqEGAKIwBAssADAHti' +
  'eADw9ryuyFEREqDLMLur1+vdtvu1d6e6/TW0wQEAANgAAABRTXUAB1SE/M/h07c5Isf5duE4WeRoxI2hqZiiPlxDBNz6EMIaxbSBhDyfhQW8If0UkCh6QOc1AGy6GEwHHkBDsQDm6TQmALQFQIEHgICXA6ABSKDBA5qmvUACTAC+bHbfXjwqfYFnu3sL1sKUWofqaXMgTFJrMz0AQCLhAYARIvAAwN9VmoBksrVI9PwZK+Ht8iEAAAD3AgAI1MrfBNDWojTnnu2B7cFczOjvffkhRiuPHFbmMhRRLt9EQYXZePmOSw2AzWGwsgwGqGzOQAcEDWA5PA0AKIDFAwQAK8OCggYggUwZ/lVogAIACUhAAjNZmgTABP5cjt/e/dw+YLe3h2BtSKl1wfpUGAZ2w0aTRnoAgImEBwC60vAAYP/EEMACUSHUOk9la/jT0mtNEgAAANoFAABC2OUAUOrV6aM+AM/SF/rxnt6KOP9D3F9PTNXDPH3YzmytGGd/cVwCnw//RlAAeW8BBNwDgAWTygeABUDvHxIsKEAHABz6GYAJCxKADgBVaaQEDUwA/gt2f6z+oI1gNMcS2CSUqsUxH2TapRtMNSUoDg8AYg+VTMb/WkfN8whH/4bpgxZAVyy/Dn9H3z/zeDSfcn/Z6kS/vHG+6APyCJ5kNjSi6b1/ZO3qADUNuSL2miY4BGA/fGJ2d5tgNjEe8BOwUDvlx1srMg0EAHqqJM0ALPhmB97agAAABRAIAErNAx14AAGgAQk8+ZsAHUBDAh5oAMD9/Q4aADz+jE7f2v1RG8HZbix+PUota+tOPcAKwBRGAMBCwgMA+2B4APDpnycLwAaACyAJEaT1fpD8jdFbp1kAAADQEQAAwP8sgACxfPv59ggAAK4LwODig5GeTn1xhKjYTWkktwYLlzYGZrl03hgAmZREFM1ggFpRADSAAiiApzRGAgANYIIEgETDmAx0YAELUECjXRAAvmy2vy8ePYxgdWMVwdqEUmOFcmAYQufJzTgYdAiGBwC23vAA4P4nVgATQmAiEGpX2ixjzse/fKYMAAB40w8ASrQFDaXHAngo25r2qZL5NFg/sjlPFNyQO5YlNtPaam7jCgD4nHCYAnQkCHlxYQ9S6+UIJABoBZiAdF0PYAL4Y8eRCYAH4afAA7DoALB8BtBAAwAeDC6/Dn9VeRajXRYLM22je6jy8EAzU55ooluvFliDzhJ4AEDk8ABgnuzJhwKU3NvuN6RcN+bw//2udiXm7iMADjhoZAAFbY4wep73N7M3fFIijqeW93h57Jza0nz/mQKANCas0wABTBDWJbxi5OE8l4XWNnUha72ICW4MsZ0J3ACTHTlVggSAxAQ0AOQhFSQACRNMAA0K7KgOmACYgAAcj9EAngkAHgyu/zr80TJBaW2/ArUoNVZXU2C4wVkhdbSNSsMDACoNDwB82lQUkiAAJnjpViUfT61nN3sBAECRvgARKKi3BRkcILys+o3H5J9HjO7d0Q7jmCoMVVZWDHUujUWzgL2pOKe+DxNCXLpWvYHxQ4IY8JxKA5uYAD4AYF9CE4ACsABogA4AfoEOUIACAD7CyLMAIM9hyAAeDB7+OvzJMkGe9rII1KWUy9nWYwp5ejfBFL4SeABgGR4A+KkwTABgBhCI9WRrr33OdWDdAQAAvTJGcBAAUbWPk1u+zJsK189a0ejaYDSxihjt3LaDzxNpgMaenOvtRg+jAHmmfFfma5T3QcMD/cSCztLBEIAFsBxHA1AAAaAAs73oyZU0ACgAAR4MHv89/fHQoLXXboG6lKrV1Ro9SFZiMcAv8ACAG8MDgH7DSiAACwAItJgkvbFnMVLH0wEAgGomFaCAYzcVC1RvFpTnbzCIs5sPtBcVR5pT9i676tXU0wIJROk0ujoo' +
  'gOyKvPfkHBOaaxWwXaOzPGgs0AAIZZq2AHgA6BAADbC0kwIAQPUJMHQdAB4MHv59+lNDwDrdaDuBbUapWl2rokzRCsMDANrwAEA1IQhCoEMAAACxjQ4RFNAu7KSU8Z830YfLpv/5G79W/Vo8j9MTz3P5dVTdZKbbqOw9pWpzctSvCxPzWVeanJ7KXs7QSvAVgBznaQBkC2ADAAk8wBMdEADQgDboCdgEgFMBDWBCAiBNADQAJh4Mnv++94vJwTjtrSlYm1FqXFq76gEuIQHGGgCAPzwA4N3wAKCFCEwIQCMDK2icHjLS/pEBqoK/sdMdHAAAIIwJAAQKYddb6D6+sm3SKTGnWpLDJos0AHTpeZz+DQaANrCqhTK8Hw88EyAAGgACuFEhARoAOpjDhAXYu5LARAAQgAkPaABYAB4M3v9++9US0E77dxVMh1LLOjoVBWMNAMDP8ACAGsMDAMswEeQIJODKQlCQUAAAAK5BAQVo4oiGi8J9HKY7jjH1dm8vz/NB0GQm97GN5B4SAYA8lxaqDR06BHYUuYOeTQd4SgFmABoaWABybxUA0CSgAYChQwAmaAA4VdIAGoAOGtAAJAAeDD7+/vGrJqC0nl/BtCmVYg1HGaFGDQ8AOuxDD0GBQpOiB0YUOg41hds9GU9cu19xfk4nrDueqp5dr8XTOrNdCpoFPNfuhQ50wL+vgTkWQAJg9/xE0cADjCMBHh3pIgB0AAlQQANoQ8ADASBYCsDsgEqgAXgs6ACgARYeDN7+/ue3G4PV/nkL1uaUqmJTOFP08ACA0qj/AQAAlAO0ggFGbnbacJicTRhq1+oAmaESnKc/u7h2OXs7C3gfELCUMgSY6/KCPrYA6A3wABNAB56FBV2Ylb/NzQbQAaADjQQIKooGJgsrAaABJOzJGiwAGmBKADzuADQAIAEe7D39/cvjbg6y3Z0CJ8woNVafAKePHh4AEEb9DwAAwNgKjWMg9C8H7csz/Cjhx62QS9Q7CFKOfLV3ksH7Og1uMASUQoOpNwBRAzzABLAAzoCgo72bsTqACUBSAEABXw8P0AEkNIAHaBPQgAIP6AA0QAd0MAEW7L3+/eG3hwKjvXcRrBEoOYbrwzSFn+EBgE7/HwAAwJ+JRFf3Wz477EdYLfWi6Ces2BgsRz7XAwD0c27ChKZjWIvDYXpo/ggAOQE6ACcYGAQwnhP8JcVlZAIgwAPcjU8wHUM0SHgEiQgA2RAAo0IBQAMoCgAwLYAHdADMXt/6AwC+AMBIAAIooAAkxAtBAJhEBIQl48h5GiuMNupGi5wAxNz7hhEGAfT3j5hy9PbhITarKbuhXxWGZyNkMVbXDDe9AMTcaOMrACwIoFZPW9G6uFZe2gxTRzxfHzVGgjGdr4QQHE5LAbzc983HhwXo/fnjC6DHACCAHnYB4J8v2QrgpQ9XOgWc/xgQ/nK+/VTkawDU4neHywEAH1UNE8AMQIwBgAGUJhIQcCv2CAAAQYIDAEo0AADwTzgXWT9uJtp8zn/sfjmMoLS3Tv6yVKWWVSTNwQ7G5GAKIwBAiYQHAO5vhkEhABUAK0RG7ee1c/+jsc+op4wAAABUuwAAAB7GBgCuAcyrd87rR5ZG4Qe3Skf3McYCx0mTpmiMEMydPQIA23moAJhvCDxAxwMCoAHAAMw5x+/bXivpIAEAkNf/LIBOAjDRAOLxx0QBQAE0ACxgAqjqEoAGNAA+LHa/N48xPYPVbi3+9kWp5QHmFplaBxjBRzA8ANA1hgcA53OlAAWFNYn2adMxvE95assBAMBjnQkASly1yfb9IGKvnUfh4Z3aTX/sSVFPGKbcMnm1OvtVQm9SBmflfrGBBct7x7gUBejxXlYpPkMarNpQuQoIwGoAsOCpuNSYdABYAOiuzwYWFFAAAO1NIgAU' +
  'gIcEUACaTZIDCRQAXjzWf3p4hPABZ3v7FKxVKLWuCgyH3rbnNFhT3fAAwF6GBwD3T1abfHJaHaXnff4ECXkBAADVZ56AQEEMZ4rpArpxXJSvjzsp76n59oicj8gjQqLDGNERiZT5UX0nAPBPDj890YCYIKdaU3oHto0TkAkgJSxAIV06CQAWFAAsAgDNR3VoAiSAADqgA6zDggUEEMADAIlzcbMM6MAE3lyO39r8ahjBbncu/lag1GXlTa46B0YAwAYSHgB4VRseAPz2PxcCYANAAkQhECwAQAEA1AkAAEgLOwA4ReHj/80fAAACLoCW90v0L9CNR5Ut3t6Y3ovz+bzT9/lazCqprIram5ntVPWSESWJEcsBaJcAwjETMBIAJrAdPACYrkUHsCgAkEBAv87AAw8A5DMA3gtWf3LyCOEDdrtivFal1OUKSw9g27LouM46QeYaUZVRwwOAx8ca6skwAxwOLi3sNA/S++agZ9gdScNYEEHVpfF8obs9jUJi2jceexNTk5QKzJGvU564AKDNZUZoO10geVz1Fz55O+M5O+AeQHP/v/+7uZShgLEAFCagA5sup3WEKQATQEIBgNOFAgDkA5gA8LD4PwkCAJjQQABobhoogAa+bA5/cvKD9AHP1jUENhOl1pV1OwzL3M5OBOjDCAAQSHgAoI/hAUD/UT0FUOPJ9oVl1x36OOTaz+sAAECxAgAAFDGNtgAKKOEdYwCSzHVHzp7PU1Vb+3GDV+s4B6Kk6Fh16NlS7aUBCybfLi3A2K6ExkQB6EoAQAkdLWQm8GABAHP/ZxPoYIECJAAeXDj6PYBJA4COCQAeFpMBASABT2dnUwAEgFUBAAAAAABnHAAAAwAAAIZ6ge0Qj5+YnaOYkYeKhIR+en55Vd58jt86PHr4gLP9cwimTallgdbU2XoAgIOEBwC6NDwA6P8FBMCCIFRAFgAAAHEBAACElQMgeIMe27r/wUKpb37kdyku/pl6LX17ezuxTyLe7IONbTETw42npn6QeCXq/p76ZgUNSoK25uT0E9hoWsADJAA6QLF3BgDIfZtQQAfAArBivxY6MAESAPWiAwEA/gvWvw5/3D4Wrd0o/NOmlBoXNvdAACPGlfaCoQOmaAujRk0moQGWTu3+jMlOu760GUnvb838xl1VpRe5KlusZmni6pD7nVEBuyYSy8CGXA7sJhI03jiH8RgNlgTFNVgToLFP//+hNiLggZa6YrJggvsG2h57PFT/Gy/vHB7IBJhIACCRAErNwwMWwIIANIDslPWTCwABQBIAzK81HQAB3nxO3zo8xvDAaneeAluwUsvK4lSZ6gEADYQHAF4PhkEhAAJgA0ACSiYBAADcww8AAGjcqgBwPgAAAFE7AMyd1oOqtSqM46K6ubocl374t+t3+sKxm12xMbmVEytuaEIO65tP7YdlBEpvDy8A5RSADsBEAoArAQBgB0rx8Va2NgYASEgABUzQSI+oDBAUsADwMAHUtQsEQAJePFbfOvsTwwju9tfmbxVKjYcFjilVVMIDAFtveADw+ocGlYyKoAIAgCP+CgUUEVmdnwyh1Lx73+upPt58/021L4XTN30WqskxfXcjznt9XGVWdh5iXerhmAIgbXShCCEB8DoxcQIxUXQoJ71awGGJEgCumMACEshNqB8NJoAHoGAB9H9MEABMgAYNgAUAfqkATKADGoAE4FsANAAeHgxuvzZ/MT2L1swhmBalLMUDyJQOGwmmBQNVSlAqPACsEVTyB9iuusdULqOGNaSf/oS7k9QOAN7F0TG89lUV71y1bweIRxfLgTd027G0BNGcIU+ARk6WTZ4tBTxdcX351Jeoof0ukschAIKwsNHH87fisC4CLGHpWaDMAoB19OyWIvDABCxAAiDXYAJAAjoEIEB1' +
  'iAkeQAFYmAUwAYenAhrABP4Lbn9y9ofDBK092/yOTKlaXLlgWNMSGgy64QEAtQ0PAPzMqBB5Sb8f+nkMoYejLQAAEKL+CgoAusdh/QVIZReDz2++qyNIdv9iwpFpiJRbOUH3g7YbEnsAWBNOXgbfKTpWXg+sztTvMidAaB9hiEUHFAABrK2ARwASAI0GAGDjTWICYIIFKACvVYAACQCTBxMAswo0rOQBHgzu/67+AB1Y7fItsNUpNdZUjjlpCfZo9InCqOEBwD6WJhBCAggZkonyJruH8ZR3j1AgQL8eW3iByLgWfxkbhbsMIIz20FvubSjIYjrul8xi4jyrStmSC65LI1d1zoJLYUCfew7ABMDefpb3aR+dDcqzQIMAmGGwSGACCwCFBgAL1QFrAkCBwBkoCHgArjsKAB4Mrv/d+4NS4DztnAS2GaWWhbWMHtwFicVgNDwA4MbwAMAjEQIhsAIIiKW9Gn2xlXU3AAAOHAkAB1QlfhIvJW/w9s1xnl9rIVO6z48m6lZde4Yluoz9wM6Bn90rJ85ojej4oQ70eW4AZfRRUIeCZCIAYFIAAcBDAYDUUGACeADsawYw8QD4Gh4MHv78ux+EgHXa9ylYi1EqK0x1BvTwAIBheACwN/wjEAAAgLYTAIDCPUq8SOWnP2vjZBT/Vf+Q/fi+JfXj42yjzY1DyarJgeOGrjn5RgjgtLI62U59XBd8gc1ZzxyCAmLQkskHCx0JJMCHAHggAUCDAFAbdAMNPAQgABpAdZbKQAINQAAW0KEBAB4Mnv/8wyOGgPO0t1aBTUKpZU3Nrmdb60SDKRkeAPBu1DAhAHMEmsf11N6hwvuKHg4AAIqPI3B++nn7fHKPbCNdZKqUYha0VtDP1QD88n1QgX2UcY8abOp6/+sCLEOAh04HAA88tMVW69/b4lY7ABI8gATM6oAGfdLOAh7QwQRoQACACR4MXv78y0+DgnHa20WwdqPUZU0NhwcrCGvRRw8PAKgxPADYThECIQ+0mUize/cVWK8DAACFJgUAEJGImILr24EnqUkGnVfwhpzHXaOBqRv1AvAzulrToTQd6XBZzidE11BMJuBRoEkABOjpEkAD8AACYFUASQESACMBJBYnCxAIAGBCAR4MXv/8t18kAatduwVrM0rVklodHjQATMmo4QGAxPrvinjo+NRTD3FAUUCcighYCpc29fM80pjNLWV55WCs1o8AfmYldJg2oR0BXA6AACC5vr+nAB6gngU6gKV0AwB0QAdgASSg3YEG8DABWOjqgXpACVCAnwBAsgA6AFMDAB4MPv78D4/RGIx2YwlsNUotC5ujWDc8AKA0PADY5X8AAIDiAADAUedoDoc7xVn1bc5Y5n4NcSZqxld5qHJMIg+aZaMZAD7mzaabMEENlqBPCiAHBZCABgBiYRkBIIAHwAI0UKrQQW8ALCaADsDTWUCikwANgMQD6AAFHgw+//lffh4IPNvdQ7BmpeQoczgD/OEBAGHyP4ADAIwfQJ1yUvXXowDpTnhjU/2BfkCNmLwccW5uzCkSAB+mKjoPRkGaLDPM/qBDB0jAEFCABhbMZ4xYrAIeYAITAAJweVOAhksTiQTMRvoDoIEhSAqYcAw8gA54HKpQgAYAHgy+09+fHtfEgOZ7C4yo5KJGwwmqwAMAXZr8QwEAAPwOgAdJi7zhe9HHE+x3esc+x1c5kAAA8Nc5ABSQQONiuygufEIGRAMsTKCxOgDEc/RLO3VhBK+CAigAWsUzAUBtTUzGB4DvDVCShgYCNECABQrQAf3uDYBAAB7srfa/v3vsJuDZLf9DYKNWcnV9HgBYgOEBABP0jwAIAAAA0F0BwP53Btp+rdiDTQRAB1NtswMCAM7gtrkahs7ZAdAAm10CAAFYASRAW4AAwIIGNAA=';

if (typeof GM_addStyle == 'undefined')
{
  var GM_addStyle = function(css)
  {
    var parent = document.getElementsByTagName("head")[0];
    if (!parent) parent = document.documentElement;
    var style = document.createElement("style");
    style.type = "text/css";
    var textNode = document.createTextNode(css);
    style.appendChild(textNode);
    parent.appendChild(style);
  };
}

/*
canvas integration todo:
- autoskipping captions/drawings
*/

// Executed on completely empty page. That means no jQuery!
function setupNewCanvas(insandbox, url)
{
  var canvasHTML = localStorage.getItem("anbt_canvasHTML");
  var canvasHTMLver = localStorage.getItem("anbt_canvasHTMLver");
  if (!canvasHTML || canvasHTMLver < NEWCANVAS_VERSION)
  {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', "https://api.github.com/repos/grompe/Drawception-ANBT/contents/newcanvas_embedding.html");
    xhr.setRequestHeader("Accept", "application/vnd.github.3.raw");
    xhr.onload = function()
    {
      localStorage.setItem("anbt_canvasHTML", this.responseText);
      localStorage.setItem("anbt_canvasHTMLver", NEWCANVAS_VERSION);
      setupNewCanvas(insandbox, url);
    };
    xhr.onerror = function()
    {
      alert("Error loading the new canvas code. Please try again.");
      location.pathname = "/";
    };
    xhr.send();
    //localStorage.setItem("anbt_canvasHTML", atob(""));
    return;
  }
  // Save friend game id if any
  var friendgameid = url.match(/play\/(.+)\//);

  var panelid = url.match(/sandbox\/#?([^\/]+)/);

  var sound = alarmSoundOgg;
  var vertitle = "ANBT v" + SCRIPT_VERSION;

  // Show normal address
  var normalurl;
  if (insandbox)
  {
    normalurl = "/sandbox/";
    if (panelid) normalurl += "#" + panelid[1];
  } else {
    normalurl = "/play/";
    if (friendgameid) normalurl += friendgameid[1] + "/";
  }
  try
  {
    history.pushState({}, document.title, normalurl);
  } catch(e) {};

  document.write("");
  window.anbtReady = function()
  {
    if (friendgameid) window.friendgameid = friendgameid[1];
    if (panelid) window.panelid = panelid[1];
    window.insandbox = insandbox;
    window.options = options;
    window.alarmSoundOgg = sound;
    window.vertitle = vertitle;

    var script = document.createElement("script");
    script.textContent = "(" + needToGoDeeper.toString() + ")();";
    document.body.appendChild(script);
  };
  document.write(canvasHTML);
}

// To be inserted on new canvas page. No jQuery!
function needToGoDeeper()
{

function sendGet(url, onloadfunc, onerrorfunc)
{
  var xhr = new XMLHttpRequest();
  xhr.open('GET', url);
  xhr.onload = onloadfunc;
  xhr.onerror = onerrorfunc || onloadfunc;
  xhr.send();
}

function sendPost(url, params, onloadfunc, onerrorfunc)
{
  var xhr = new XMLHttpRequest();
  xhr.open('POST', url);
  xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded; charset=UTF-8");
  xhr.onload = onloadfunc;
  xhr.onerror = onerrorfunc || onloadfunc;
  xhr.send(params);
}

function extractInfoFromHTML(html)
{
  var extract = function(r)
  {
    var m = html.match(r);
    return m && m[1] || !!m;
  };
  return {
    error: extract(/<div class="error">\s+([^<]+)\s+<\/div>/),
    gameid: extract(/<input type="hidden" name="which_game" value="([^"]+)"/),
    blitz: extract(/BLITZ MODE<br \/>/),
    nsfw: extract(/>This game Not Safe For Work \(18\+\)<\/span>/),
    friend: extract(/<legend>\s+Friend Game/),
    drawfirst: extract(/<input type="button" value="Abort" onclick="DrawceptionPlay\.abortDrawFirst\(\)/),
    timeleft: extract(/<span id="timeleft">\s+(\d+)\s+<\/span>/),
    caption: extract(/<p class="play-phrase">\s+([^<]+)\s+<\/p>/),
    image: extract(/<img src="(data:image\/png;base64,[^"]*)"/),
    palette: extract(/heme item was applied to this game">([^<]+)<\/span>/),
    bgbutton: extract(/<img src="\/img\/draw_bglayer.png"/),
    playerid: extract(/<a href="\/player\/(\d+)\//),
    playername: extract(/<span class="glyphicon glyphicon-user"><\/span> (.+)\n/),
    playerurl: extract(/<a href="(\/player\/\d+\/[^\/]+\/)"/),
    avatar: extract(/<img src="(\/pub\/avatars\/[^"]+)"/),
    coins: extract(/<span id="user-coins-value">(\d+)<\/span>/),
    pubgames: extract(/alt="pubgames" \/> (\d+\/\d+)/),
    friendgames: extract(/alt="friendgames" \/> (\d+)/),
    notifications: extract(/<span id="user-notify-count">(\d+)<\/span>/),
    drawingbylink: extract(/drawing by (<a href="\/player\/\d+\/\S+\/">[^<]+<\/a>)/),
    title: extract(/<title>([^<]+)<\/title>/),
  };
}

function getParametersFromPlay()
{
  var url = "/play/";
  if (window.friendgameid)
  {
    url += window.friendgameid + "/";
    window.friendgameid = false;
  }
  try
  {
    history.replaceState({}, null, url);
  } catch(e) {};
  sendGet(url, function()
  {
    window.gameinfo = extractInfoFromHTML(this.responseText);
    handlePlayParameters();
  }, function()
  {
    window.gameinfo = {
      error: "Server error: " + this.statusText
    };
    handlePlayParameters();
  });
}

function exitToSandbox()
{
  timerStart = Date.now();
  ID("newcanvasyo").className = "sandbox";
  timerCallback = function(){};
  updateTimer();
  document.title = "Sandbox - Drawception";
  ID("gamemode").innerHTML = "Sandbox";
  ID("headerinfo").innerHTML = 'Sandbox with ' + vertitle;
  try
  {
    history.replaceState({}, null, "/sandbox/");
  } catch(e) {};
}

function handleCommonParameters()
{
  if (gameinfo.avatar)
  {
    ID("infoavatar").src = gameinfo.avatar;
  }
  ID("infoprofile").href = gameinfo.playerurl;
  ID("infocoins").innerHTML = gameinfo.coins;
  ID("infogames").innerHTML = gameinfo.pubgames;
  ID("infofriendgames").innerHTML = gameinfo.friendgames;
  ID("infonotifications").innerHTML = gameinfo.notifications;
}

function handleSandboxParameters()
{
  if (gameinfo.drawingbylink)
  {
    var playerid = gameinfo.drawingbylink.match(/\d+/);
    var playername = gameinfo.drawingbylink.match(/>([^<]+)</);
    var avatar = '<img src="/pub/avatars/' + playerid + '.jpg" width="25" height="25">';
    ID("headerinfo").innerHTML = 'Drawing by ' + avatar + " " + gameinfo.drawingbylink;
    if (playername) document.title = playername[1] + "'s drawing - Drawception";
    ID("drawthis").innerHTML = '"' + gameinfo.title.replace(/ \(drawing by .+\)$/, '"');
    ID("drawthis").classList.remove("onlyplay");
    ID("emptytitle").classList.add("onlyplay");
    if (options.autoplay) anbt.Play();
  } else {
    ID("headerinfo").innerHTML = 'Sandbox with ' + vertitle;
    ID("drawthis").classList.add("onlyplay");
  }

  handleCommonParameters();
}

function handlePlayParameters()
{
  var info = window.gameinfo;

  ID("skip").disabled = info.drawfirst;
  ID("report").disabled = info.drawfirst;
  ID("exit").disabled = false;
  ID("start").disabled = false;
  ID("bookmark").disabled = info.drawfirst;
  ID("timeplus").disabled = false;
  ID("timeplus").classList.remove("show");

  ID("headerinfo").innerHTML = 'Playing with ' + vertitle;
  ID("drawthis").classList.add("onlyplay");
  ID("emptytitle").classList.remove("onlyplay");

  window.submitting = false;

  if (info.error)
  {
    alert("Play Error:\n" + info.error);
    return exitToSandbox();
  }

  ID("gamemode").innerHTML = (info.friend ? "Friend " : "Public ") +
    (info.nsfw ? "Not Safe For Work (18+) " : "safe for work ") +
    (info.blitz ? "BLITZ " : "") +
    "Game";
  ID("drawthis").innerHTML = info.caption || info.drawfirst && "(Start your game!)" || "";
  ID("tocaption").src = "";

  var newcanvas = ID("newcanvasyo");
  newcanvas.className = "play";
  if (info.friend) newcanvas.classList.add("friend");
  ID("palettechooser").className = info.friend ? "" : "onlysandbox";
  if (info.nsfw) newcanvas.classList.add("nsfw");
  if (info.blitz) newcanvas.classList.add("blitz");
  newcanvas.classList.add(info.image ? "captioning" : "drawing");

  // Clear
  anbt.Unlock();
  for (var i = anbt.svg.childNodes.length - 1; i > 0; i--)
  {
    var el = anbt.svg.childNodes[i];
    anbt.svg.removeChild(el);
  }
  anbt.Seek(0);
  anbt.MoveSeekbar(1);
  anbt.unsaved = false;

  var palettemap = {
    normal: ["Normal", "#fffdc9"],
    sepia: ["Sepia", "#ffe2c4"],
    grayscale: ["Grayscale", "#eee"],
    "b&amp;w": ["Black and white", "#fff"],
    cga: ["CGA", "#ff5"],
    gameboy: ["Gameboy", "#9bbc0f"],
    neon: ["Neon", "#00abff"],
    thanksgiving: ["Thanksgiving", "#f5e9ce"],
    holiday: ["Holiday", "#fff"],
    valentines: ["Valentine's", "#ffccdf"],
    halloween: ["Halloween", "#444444"],
    "the blues": ["the blues", "#295c6f"]
  };
  var pal = info.palette || "normal";
  var paldata = palettemap[pal.toLowerCase()];
  if (!paldata) alert("Error, please report! Unknown palette: '" + pal + "'");
  setPaletteByName(paldata[0]);
  anbt.SetBackground(paldata[1]);
  anbt.color = [palettes[paldata[0]][0], "eraser"];
  updateColorIndicators();

  ID("setbackground").hidden = !info.bgbutton;

  if (info.image)
  {
    if (info.image.length <= 30)
    {
      // Broken drawing =(
      ID("tocaption").src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAAD6AQMAAAAho+iwAAAABlBMVEWAQEAAAAB4MK1jAAAAfElEQVR4Xu3VgQaAQBBF0ZjfWvbXh/2tYWLjIQHBS/dkhS7s1uh4AgAAACDKNxuRsyXNspWHDKssKvwyscr8z83/e/OfhVh72WQS+7GWQeZ9bszC+//C7O6yyjQLkftumckfMzIymS3plPnTRsoyi7yuW0D2tXcKAAAA4AQpWEKQW53dgwAAAABJRU5ErkJggg==";
    } else {
      ID("tocaption").src = info.image;
    }
    ID("caption").focus();
  }

  timerStart = Date.now() + 1000 * info.timeleft;
  updateTimer();
  window.timesup = false;
  window.timeplus = false;

  if ((options.timeoutSound && !info.blitz) || (options.timeoutSoundBlitz && info.blitz))
  {
    window.playedWarningSound = false;
    var alarm = new Audio(window.alarmSoundOgg);
  }

  timerCallback = function(s)
  {
    if (s <= 121 && !window.timeplus)
    {
      ID("timeplus").classList.add("show");
      window.timeplus = true;
    }
    if (alarm && !window.playedWarningSound && s <= (info.blitz ? 5 : 61) && s > 0)
    {
      alarm.play();
      window.playedWarningSound = true;
    }
    if (s < 1)
    {
      document.title = "[TIME'S UP!] Playing Drawception";
      if (info.image || window.timesup)
      {
        // If pressed submit before timer expired, let it process or retry in case of error
        if (!window.submitting)
        {
          if (!info.image)
          {
            getParametersFromPlay();
          } else {
            // Allow to save the drawing after time's up
            exitToSandbox();
          }
        }
      } else {
        newcanvas.classList.add("locked");
        anbt.Lock();
        timerStart += 15000; // 15 seconds to submit
        updateTimer();
        window.timesup = true;
      }
    } else {
      var m1 = Math.floor(s / 60), s1 = Math.floor(s % 60);
      m1 = ("0" + m1).slice(-2);
      s1 = ("0" + s1).slice(-2);
      document.title = "[" + m1 + ":" + s1 + "] Playing Drawception";
    }
  };

  handleCommonParameters();
}

function include(script, callback)
{
  var tag = document.createElement("script");
  tag.src = script;
  tag.onload = callback;
  document.body.appendChild(tag);
}

function bindCanvasEvents()
{
  var unsavedStopAction = function()
  {
    return anbt.unsaved && !confirm("You haven't saved the drawing. Abandon?");
  };

  ID("exit").addEventListener('click', function()
  {
    if (window.gameinfo.drawfirst)
    {
      if (!confirm("Abort creating a draw first game?")) return;
      ID("exit").disabled = true;
      sendGet("/play/abort-start.json?game_token=" + window.gameinfo.gameid, function()
      {
        ID("exit").disabled = false;
        exitToSandbox();
        document.location.pathname = "/create/";
      }, function()
      {
        ID("exit").disabled = false;
        alert("Server error. :( Try again?");
      });
      return;
    }
    if (!confirm("Really exit?")) return;
    ID("exit").disabled = true;
    sendGet("/play/exit.json?game_token=" + window.gameinfo.gameid, function()
    {
      ID("exit").disabled = false;
      exitToSandbox();
    });
  });

  ID("skip").addEventListener('click', function()
  {
    if (unsavedStopAction()) return;
    ID("skip").disabled = true;
    sendGet("/play/skip.json?game_token=" + window.gameinfo.gameid, function()
    {
      ID("skip").disabled = false;
      getParametersFromPlay();
    });
  });

  ID("start").addEventListener('click', function()
  {
    if (unsavedStopAction()) return;
    ID("start").disabled = true;
    getParametersFromPlay();
  });

  ID("report").addEventListener('click', function()
  {
    if (!confirm("Report this panel?")) return;
    sendGet("/play/flag.json?game_token=" + window.gameinfo.gameid, function()
    {
      ID("report").disabled = false;
      getParametersFromPlay();
    });
  });

  ID("bookmark").addEventListener('click', function()
  {
    ID("bookmark").disabled = true;
    var games = localStorage.getItem("gpe_gameBookmarks");
    games = games ? JSON.parse(games) : {};
    games[window.gameinfo.gameid] = {time: Date.now(), caption: window.gameinfo.caption};
    localStorage.setItem("gpe_gameBookmarks", JSON.stringify(games));
  });

  ID("submit").addEventListener('click', function()
  {
    var moreThanMinuteLeft = timerStart - Date.now() > 60000;
    if (options.submitConfirm && moreThanMinuteLeft && !confirm("Ready to submit this drawing?")) return;
    ID("submit").disabled = true;
    anbt.MakePNG(300, 250, true);
    if (options.backup)
    {
      localStorage.setItem("anbt_drawingbackup_newcanvas", anbt.pngBase64);
    }
    window.submitting = true;
    var params = "game_token=" + window.gameinfo.gameid + "&panel=" + encodeURIComponent(anbt.pngBase64);
    sendPost('/play/draw.json', params, function()
    {
      var o;
      try
      {
        o = JSON.parse(this.responseText);
      } catch (e) {
        o = {error: this.responseText};
      }
      if (o.error)
      {
        ID("submit").disabled = false;
        alert(o.error);
      } else if (o.callJS == "drawingComplete")
      {
        window.onbeforeunload = function(){};
        location.replace(o.data.url);
      } else if (o.message) {
        ID("submit").disabled = false;
        alert(o.message);
      } else if (o.redirect) {
        window.location.replace(o.redirect);
      }
    }, function()
    {
      ID("submit").disabled = false;
      alert("Server error. :( Try again?");
    });
  });

  ID("submitcaption").addEventListener('click', function()
  {
    var title = ID("caption").value;
    if (!title)
    {
      ID("caption").focus();
      return alert("You haven't entered a caption!");
    }
    window.submitting = true;
    var params = "game_token=" + window.gameinfo.gameid + "&title=" + encodeURIComponent(title);
    ID("submitcaption").disabled = true;
    sendPost('/play/describe.json', params, function()
    {
      var o;
      try
      {
        o = JSON.parse(this.responseText);
      } catch (e) {
        o = {error: this.responseText};
      }
      if (o.error)
      {
        ID("submitcaption").disabled = false;
        alert(o.error);
      } else if (o.callJS == "drawingComplete")
      {
        location.replace(o.data.url);
      } else if (o.message) {
        ID("submitcaption").disabled = false;
        alert(o.message);
      } else if (o.redirect) {
        window.location.replace(o.redirect);
      }
    }, function()
    {
      ID("submitcaption").disabled = false;
      alert("Server error. :( Try again?");
    });
  });

  if (options.enterToCaption)
  {
    ID("caption").addEventListener('keydown', function(e)
    {
      if (e.keyCode == 13)
      {
        e.preventDefault();
        ID("submitcaption").click();
      }
    });
  }

  ID("timeplus").addEventListener('click', function()
  {
    ID("timeplus").disabled = true;
    sendGet("/play/add-time.json?game_token=" + window.gameinfo.gameid, function()
    {
      var o = JSON.parse(this.responseText);
      if (o.error)
      {
        alert(o.error);
      } else if (o.callJS == "updatePlayTime") {
        timerStart += o.data.seconds * 1000;
        updateTimer();
        ID("timeplus").classList.remove("show");
        // Let play warning sound twice
        window.playedWarningSound = false;
      }
      ID("timeplus").disabled = false;
    }, function()
    {
      ID("timeplus").disabled = false;
      alert("Server error. :( Try again?");
    });
  });
}

function deeper_main()
{
  if (options.fixTabletPluginGoingAWOL) fixPluginGoingAWOL();
  bindCanvasEvents();
  if (window.insandbox)
  {
    if (window.panelid)
    {
      anbt.FromURL("/panel/drawing/" + window.panelid + "/");
      sendGet("/panel/drawing/" + window.panelid + "/-/", function()
      {
        window.gameinfo = extractInfoFromHTML(this.responseText);
        handleSandboxParameters();
      }, function() {});
    } else {
      sendGet("/sandbox/", function()
      {
        window.gameinfo = extractInfoFromHTML(this.responseText);
        handleSandboxParameters();
      }, function() {});
      if (options.backup)
      {
        var pngdata = localStorage.getItem("anbt_drawingbackup_newcanvas");
        if (pngdata)
        {
          anbt.FromPNG(base642bytes(pngdata.substr(22)).buffer);
          localStorage.removeItem("anbt_drawingbackup_newcanvas");
        }
      }
    }
  } else {
    ID("newcanvasyo").className = "play";
    getParametersFromPlay();
  }

  if (options.loadChat)
  {
    include("//ajax.googleapis.com/ajax/libs/jquery/1.8.3/jquery.min.js",
    function()
    {
      include("http://chat.grompe.org.ru/jappix-mini.js", function()
      {
        var username = localStorage.getItem("gpe_lastSeenName");
        var userid = localStorage.getItem("gpe_lastSeenId");

        MINI_GROUPCHATS = ["drawception"];
        MINI_GROUPCHATS_NOCLOSE = ["drawception@chat.grompe.org.ru"];
        MINI_NICKNAME = username;
        MINI_RESOURCE = userid + "/jm" + Math.random().toString(36).slice(1, 5);
        launchMini(Boolean(options.chatAutoConnect), true, "ip");
      });
    });
  }
}
deeper_main();
} // needToGoDeeper end

function isBlitzInPlay()
{
  var mode = $(".label-game-mode");
  if (mode.length && mode.text().match(/blitz/i)) return true;
  return false;
}

function enhanceCanvas(insandbox)
{
  var canvas = document.getElementById("drawingCanvas");
  if (!canvas) return;

  var drawCursor = document.getElementById("drawCursor");

  $("#gameForm").after('<b>ANBT Note: you are using the old canvas! New canvas can be enabled on the <a href="/settings/"><span class="glyphicon glyphicon-cog" /> settings page</a>.</b>');
  $(document.body).append('<object id="wtPlugin" type="application/x-wacomtabletplugin" width="1" height="1"></object>');
  var wtPlugin = document.getElementById("wtPlugin");
  var penAPI, strokeSize, dynSize, pressureUpdater, backupTimer;
  var lastColor;

  GM_addStyle(
    "#primaryColor, #secondaryColor {width: 49px; height: 20px; float: left; border: 1px solid #AAA}" +
    ".label-normalpal {background: #888}" +
    ".selectable {-webkit-user-select: text; -moz-user-select: text; user-select: text}"
  );
  if (!prestoOpera)
  {
    GM_addStyle(
      (options.hideCross ? "#drawingCanvas.active {cursor: none !important}" : "") +
      "#drawCursor {display: block; z-index: 10; border: 1px solid #FFFFFF }"
    );
  }

  function updateCursorColor(hexcolor)
  {
    drawCursor.style.background = hexcolor;
    drawCursor.style.borderColor = invertColor(hexcolor);
  }

  var oldX, oldY, oldTabletX = 0, oldTabletY = 0, oldTabletPressure = 0, tabletActive = false;
  usingTablet = function()
  {
    if (!options.enableWacom) return false;
    if (!tabletActive) return false;
    var result = false;
    try
    {
      result = wtPlugin.penAPI;
    } catch(e) {}
    return result;
  };

  // Chrome: seems to be the slowest function
  function updateTabletPos(moved)
  {
    if (!options.enableWacom) return false;
    var result = false;
    try
    {
      result = wtPlugin.penAPI;
    } catch(e) {}
    if (result)
    {
      var tabletMoved = (result.sysX !== oldTabletX) || (result.sysY !== oldTabletY) || (result.pressure !== oldTabletPressure);
      if (tabletMoved) tabletActive = true;
      else if (moved) tabletActive = false;
      oldTabletX = result.sysX;
      oldTabletY = result.sysY;
      oldTabletPressure = result.pressure;
    }
  }

  function isEraser()
  {
    var result = false;
    try
    {
      result = wtPlugin.penAPI.isEraser;
    } catch(e) {}
    return result;
  }

  function getPressure()
  {
    var result = 1;
    try
    {
      result = wtPlugin.penAPI.pressure;
    } catch(e) {}
    return result;
  }

  function updatePressure()
  {
    var goal = strokeSize * Math.pow(getPressure(), options.pressureExponent);
    dynSize = (dynSize + goal) / 2;
  }

  function updateDrawCursor()
  {
    var s = drawApp.context.lineWidth;
    drawCursor.style.width = s + "px";
    drawCursor.style.height = s + "px";
    drawCursor.style.marginLeft = "-" + (s / 2) + "px";
    drawCursor.style.marginTop = "-" + (s / 2) + "px";
  }

  function nextSize(d)
  {
    var idx = 0, m = options.brushSizes.length - 1;
    for (var i = m; i > 0; i--)
    {
      if (strokeSize >= options.brushSizes[i])
      {
        idx = i;
        break;
      }
    }
    idx = Math.min(Math.max(idx + d, 0), m);
    strokeSize = options.brushSizes[idx];
    drawApp.context.lineWidth = strokeSize;
    cursorOffset = strokeSize / 2;
    updateDrawCursor();
    $('.btn-drawtool').has('input[id^=brush]').eq(idx).click();
  }

  function saveBackup()
  {
    if (!options.backup) return;
    var o = {game: null, image: drawApp.toDataURL(), timeleft: timeleft};
    var which_game = $('input[name=which_game]');
    if (which_game.length) o.game = which_game.val();
    localStorage.setItem("anbt_drawingbackup", JSON.stringify(o));
  }

  function gridHint()
  {
    var w = drawApp.context.canvas.width, h = drawApp.context.canvas.height;
    var l;
    var c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    var ctx = c.getContext("2d");
    ctx.fillStyle = drawApp.primary_color;
    for (var i = 1; i < 8; i++)
    {
      l = 4 + (i%4==0)*4 + (i%2==0)*4;
      ctx.fillRect(0, Math.floor(i * h / 8), l, 1);
      ctx.fillRect(w-l, Math.floor(i * h / 8), l, 1);
      ctx.fillRect(Math.floor(i * w / 8), 0, 1, l);
      ctx.fillRect(Math.floor(i * w / 8), h-l, 1, l);
    }
    $('#drawingCanvas').css('background-image', 'url("' + c.toDataURL("image/png") + '")');
  }

  // Make right-click draw secondary color and alt+click pick colors
  var waitForDrawApp = setInterval(function()
    {
      if (typeof drawApp == "undefined") return;
      clearInterval(waitForDrawApp);

      // Clear leaving page warning on submitting the drawing
      var old_savePanelDrawing = savePanelDrawing;
      savePanelDrawing = function(a, b, c)
      {
        window.onbeforeunload = function(){};
        return old_savePanelDrawing(a, b, c);
      };

      // And contest panel too
      var old_saveContestDrawing = saveContestDrawing;
      saveContestDrawing = function(a, b, c)
      {
        window.onbeforeunload = function(){};
        return old_saveContestDrawing(a, b, c);
      };

      // Remove backup when exiting (even if confirmation is cancelled)
      if (options.backup)
      {
        DrawceptionPlay.exitGame_old = DrawceptionPlay.exitGame;
        DrawceptionPlay.exitGame = function()
        {
          localStorage.removeItem("anbt_drawingbackup");
          DrawceptionPlay.exitGame_old();
        };
      }

      // Workaround for a bug that skips drawing when undoing after timer
      // expired: http://drawception.com/forums/suggestions/18533/-/
      var old_undo = undo;
      var old_redo = redo;
      undo = function()
      {
        if (restorePoints !== 0) old_undo();
      };
      redo = function()
      {
        if (restorePoints !== 0) old_redo();
      };

      // Make resetting have no confirmation but undoable, and reset sandbox timer
      drawApp.reset = function()
      {
        sandboxDrawingStart = Date.now();
        drawApp.context.clearRect(0, 0, drawApp.context.canvas.width, drawApp.context.canvas.height);
        save();
        return false;
      };

      drawApp.old_setColor = drawApp.setColor;
      drawApp.setPrimaryColor = function(color)
      {
        this.primary_color = color;
        document.getElementById("primaryColor").style.background =
          (color === null) ? "url(/img/draw_eraser.png)" : color;
        updateCursorColor((color === null) ? defaultFill : color);
        if (color) lastColor = color;
      };
      drawApp.setSecondaryColor = function(color)
      {
        this.secondary_color = color;
        document.getElementById("secondaryColor").style.background =
          (color === null) ? "url(/img/draw_eraser.png)" : color;
        updateCursorColor((color === null) ? defaultFill : color);
      };
      drawApp.setColor = function(color, bypass)
      {
        if (!bypass) this.setPrimaryColor(color);
        var disp = (color === null) ? defaultFill : color;
        updateCursorColor(disp);
        if (color === null)
        {
          this.context.globalCompositeOperation = "destination-out";
          this.context.strokeStyle = "rgba(0,0,0,1.0)";
          return;
        }
        return this.old_setColor(color);
      };
      defaultColor = $('#colorOptions').find('.selected').attr('data-color');
      drawApp.primary_color = defaultColor;
      drawApp.secondary_color = null;
      lastColor = defaultColor;

      // Can't remove canvas event listeners, so need to clone the element without events
      var oldcanvas = canvas;
      canvas = oldcanvas.cloneNode(true);
      oldcanvas.parentNode.replaceChild(canvas, oldcanvas);
      drawApp.canvas = $(canvas);
      drawApp.context = canvas.getContext("2d");
      drawApp.canvas.bind("contextmenu", function() {return false;});

      drawApp.old_setSize = drawApp.setSize;
      drawApp.setSize = function(size)
      {
        strokeSize = size;
        return this.old_setSize(size);
      };
      drawApp.context.lineWidth = 12;
      drawApp.context.lineCap = "round";
      strokeSize = drawApp.context.lineWidth;
      cursorOffset = strokeSize / 2;
      dynSize = 0;
      if (insandbox)
      {
        drawApp.context.clearRect(0, 0, drawApp.context.canvas.width, drawApp.context.canvas.height);
        restorePoints = [drawApp.context.getImageData(0, 0, drawApp.context.canvas.width, drawApp.context.canvas.height)];
      }
      //drawApp.context.putImageData = CanvasRenderingContext2D.prototype.putImageData;

      var backup = localStorage.getItem("anbt_drawingbackup");
      if (options.backup && backup)
      {
        backup = JSON.parse(backup);
        var which_game = $('input[name=which_game]');
        if (insandbox || which_game.length && (which_game.val() == backup.game))
        {
          var img = new Image();
          img.onload = function()
          {
            drawApp.context.drawImage(this, 0, 0, drawApp.context.canvas.width, drawApp.context.canvas.height);
            save();
          };
          img.src = backup.image;
        }
        // Delete backup if playing another game
        if (which_game.length && (which_game.val() != backup.game))
        {
          localStorage.removeItem("anbt_drawingbackup");
        }
      }

      drawApp.old_canvasMouseDown = drawApp.onCanvasMouseDown();
      drawApp.canvas.on('mousedown', function(e)
        {
          clearTimeout(backupTimer);
          $(canvas).addClass("active");
          e.preventDefault();
          var x, y;
          if (typeof e.offsetX === "undefined")
          {
            var targetOffset = $(e.target).offset();
            x = e.pageX - targetOffset.left;
            y = e.pageY - targetOffset.top;
          } else {
            x = e.offsetX;
            y = e.offsetY;
          }
          updateTabletPos((oldX != x) || (oldY != y));
          oldX = x;
          oldY = y;
          var rightButton = (e.which === 3 || e.button === 2);
          var leftButton = !rightButton;
          if (e.altKey)
          {
            if (eyedropper(x, y) === null) return;
            if (leftButton)
            {
              drawApp.setPrimaryColor(eyedropper(x, y));
            } else {
              drawApp.setSecondaryColor(eyedropper(x, y));
            }
          } else {
            if (isEraser())
            {
              drawApp.setColor(null, 1);
            } else {
              if (leftButton)
              {
                drawApp.setColor(drawApp.primary_color, 1);
              } else {
                drawApp.setColor(drawApp.secondary_color, 1);
              }
            }
            if (usingTablet())
            {
              dynSize = 0.1;
              drawApp.context.lineWidth = dynSize;
              //pressureUpdater = setInterval(updatePressure, 20);
            }
            // Prevent context menu when finishing drawing outside canvas.
            $(window).on('contextmenu.drawing', false).one('mouseup', function () {
              setTimeout(function () { $(window).off('contextmenu.drawing'); }, 0);
            });
            return drawApp.old_canvasMouseDown(e);
          }
        }
      );
      drawApp.canvas.on('mouseup', function(e)
        {
          backupTimer = setTimeout(saveBackup, 1000);
          $(canvas).removeClass("active");
          if (usingTablet())
          {
            dynSize = 0.1;
            drawApp.context.lineWidth = 0;
            //clearInterval(pressureUpdater);
          }
        }
      );
      $(window).keydown(function(e)
        {
          if (document.activeElement instanceof HTMLInputElement) return true;
          if (e.keyCode == 18) // Alt
          {
            drawCursor.style.display = "none";
          }
          else if (e.keyCode == "Y".charCodeAt(0) && e.ctrlKey)
          {
            redo();
          }
          else if (e.keyCode == "B".charCodeAt(0))
          {
            e.preventDefault();
            if (lastColor) drawApp.setPrimaryColor(lastColor);
          }
          else if (e.keyCode == "X".charCodeAt(0))
          {
            e.preventDefault();
            var tmp = drawApp.secondary_color;
            drawApp.setSecondaryColor(drawApp.primary_color);
            drawApp.setPrimaryColor(tmp);
          }
          else if (e.keyCode == "E".charCodeAt(0))
          {
            e.preventDefault();
            $(".eraserPicker").click();
            drawApp.setPrimaryColor(null);
          }
          else if (!e.ctrlKey && (e.keyCode >= 48 && e.keyCode <= 57))
          {
            e.preventDefault();
            var i = (e.keyCode == 48) ? 9 : e.keyCode - 49;
            if (e.shiftKey) i += 8;
            var el = $(".colorPicker").get(i);
            if (el)
            {
              el = $(el);
              el.click();
              drawApp.setPrimaryColor(el.attr("data-color"));
            }
          }
          else if (e.keyCode == "F".charCodeAt(0) && e.shiftKey)
          {
            e.preventDefault();
            drawApp.context.fillStyle = drawApp.primary_color;
            drawApp.context.fillRect(0, 0, drawApp.context.canvas.width, drawApp.context.canvas.height);
            save();
          }
          else if (e.keyCode == "G".charCodeAt(0))
          {
            e.preventDefault();
            gridHint();
          }
          else if (!e.ctrlKey && (e.keyCode == 109 || e.keyCode == 189 || e.keyCode == 219)) // Numpad - or - or [
          {
            e.preventDefault();
            nextSize(-1);
          }
          else if (!e.ctrlKey && (e.keyCode == 107 || e.keyCode == 187 || e.keyCode == 221)) // Numpad + or = or ]
          {
            e.preventDefault();
            nextSize(+1);
          }
        }
      );
      drawApp.canvas.mousemove(function(e)
        {
          updateTabletPos(true);
          if (usingTablet())
          {
            var goal = strokeSize * Math.pow(getPressure(), options.pressureExponent);
            dynSize = (dynSize + goal) / 2;
            drawApp.context.lineWidth = dynSize;
          } else {
            drawApp.context.lineWidth = strokeSize;
          }
        }
      );

      // Brush-specific events
      if (!prestoOpera)
      {
        $(window).keyup(function(e)
          {
            if (e.keyCode == 18) // Alt
            {
              drawCursor.style.display = "block";
            }
          }
        );
        drawApp.canvas.mousemove(function(e)
          {
            drawCursor.style.display = "block";
            drawCursor.style.left = e.clientX + "px";
            drawCursor.style.top = e.clientY + "px";
            updateDrawCursor();
          }
        );
        drawApp.canvas.mouseleave(function(e)
          {
            drawCursor.style.display = "none";
          }
        );
        drawApp.canvas.mouseenter(function(e)
          {
            drawCursor.style.display = "block";
          }
        );
      }

      // Fix brush cursor location
      $('#drawCursor').hide().prependTo($(document.body));

      // Add primary and secondary color indicators
      var pr = $('<div id="primaryColor" title="Primary color (left click)" style="background: ' + defaultColor +'">');
      var se = $('<div id="secondaryColor" title="Secondary color (right click)" style="background: url(/img/draw_eraser.png)">');
      $(".btn-drawtool").first().before(pr).before(se);

      // Adjust palette buttons to handle left and right clicks
      drawApp.eraser = function(){};
      $(".eraserPicker").parent().mousedown(function(e)
        {
          e.preventDefault();
          var rightButton = (e.which === 3 || e.button === 2);
          var leftButton = !rightButton;
          if (leftButton)
          {
            drawApp.setPrimaryColor(null);
          } else {
            drawApp.setSecondaryColor(null);
          }
        }
      );
      $(".eraserPicker").parent().contextmenu(function(e){ return false; });
      $(".colorPicker").parent().mousedown(colorPickerMousedown);
      $(".colorPicker").parent().contextmenu(function(e){ return false; });

      // Fix sandbox background layer because we re-add the button
      drawApp.exportImage = function()
      {
        var t = new Image();
        t.src = this.toDataURL();
        t.onload = function()
        {
          var e = document.getElementById("tempCanvas"),
              n = e.getContext("2d");
          n.fillStyle = bglayer ? bglayer : "#fffdc9";
          n.fillRect(0, 0, 300, 250);
          n.drawImage(t, 0, 0, 300, 250);
          var r = e.toDataURL("image/png");
          $("#newimg").html($("<img src=" + r + " width=300 height=250 />"));
        };
      };
    }, 100
  );

  if (insandbox)
  {
    $(".drawingForm").before('<p class="text-muted">Your drawing time: <span id="drawingTime">00:00</span></p>');
    var drawingTime = $("#drawingTime");
    sandboxDrawingStart = Date.now();
    setInterval(
      function()
      {
        var s = Math.floor((Date.now() - sandboxDrawingStart) / 1000);
        var minutes = Math.floor(s / 60);
        var seconds = s - (minutes * 60);
        if (minutes < 10) minutes = "0" + minutes;
        if (seconds < 10) seconds = "0" + seconds;
        drawingTime.text(minutes+':'+seconds);
      }, 1000
    );

    // Allow to choose a palette to test
    var paloptions = $('<ul style="list-style: none; padding: 0; line-height: 200%">');
    for (var i = 0; i < palettes.length; i++)
    {
      paloptions.append('<li><a class="label ' + palettes[i].class +
        '" href="#" onclick="return setPalette(' + i + ');">' +
        (palettes[i].longname || palettes[i].name) +'</a></li>');
    }
    var pallabel = $('<a id="paletteChooser" class="label label-normalpal" href="#" title="Choose the palette">Normal &#x25BC;</a>');
    pallabel.popover({container: "body", placement: "bottom", html: 1, content: paloptions});
    pallabel.attr("title", "Click to choose the palette");
    $("#colorOptions").prepend($('<p style="text-align: center"></p>').append(pallabel));

    // Re-add missing background color selection in sandbox
    bgoptions = $('<div id="bgOptions">');
    $(".colorPicker").each(
      function()
      {
        var c = $(this).attr("data-color");
        bgoptions.append('<a class="bglayerPicker" onclick="drawApp.setBglayer(\'' + c + '\')" data-color="' + c + '" style="background:' + c + '">');
      }
    );
    var newbutton = $('<button onclick="return false;" id="btn-bglayer" class="btn btn-yellow btn-drawtool" title="Background Layer"><span class="glyphicon glyphicon-bold"></span></button>');
    newbutton.popover({container: "body", placement: "top", html: 1, content: bgoptions});
    newbutton.attr("title", "Background Layer");
    $(".drawingForm .btn-group").slice(2, 3).before($('<div class="btn-group">').append(newbutton).after(" "));

    // Add upload to imgur button
    $(".drawingForm .btn-info").after(
      '&nbsp;' +
      '<a id="imgurup" href="#" onclick="return uploadCanvasToImgur();" class="btn btn-info"><span class="glyphicon glyphicon-upload"></span> <b>Upload to imgur</b></a>' +
      '<br><br><a id="imgurimgurl" class="selectable lead" href="#" style="display:none"></a>' +
      '<a id="imgurdelurl" class="lead glyphicon glyphicon-remove btn btn-sm btn-danger" href="#" target="_blank" title="Delete from imgur" style="margin: -10px 0 0 10px; display:none"></a>'
    );
    // Help selecting for copying
    $("#imgurimgurl").mousedown(
      function(e)
      {
        if (window.getSelection)
        {
          var range = document.createRange();
          range.selectNodeContents(e.target);
          var selection = window.getSelection();
          selection.removeAllRanges();
          selection.addRange(range);
        }
      }
    );
  }

  if (options.enableWacom && options.fixTabletPluginGoingAWOL)
  {
    window.onblur = function(e)
    {
      document.body.removeChild(wtPlugin);
    };
    window.onfocus = function(e)
    {
      document.body.appendChild(wtPlugin);
    };
  }
}

function documentReadyOnPlay() // Mostly copied from the $(document).ready function
{
  var timeleft = $("#timeleft").text();

  if ($('#drawingCanvas').length)
  {
    defaultBgColor = $('#colorOptions').find('.defaultBgColor').attr('data-color');
    $('#drawingCanvas').css('background', defaultBgColor ? defaultBgColor : defaultFill);

    $('#btn-color').popover({
      html: true,
      content: function() {
        return $('#colorOptions').html();
      }
    });

    if ($('#btn-bglayer').html() != null) {
      $('#btn-bglayer').popover({ html : true, placement: 'top' });
      if (defaultBgColor) {
        bglayer = defaultBgColor;
        defaultFill = defaultBgColor;
      } else {
        bglayer = defaultFill;
      }
    } else {
      bglayer = null;
    }
    $('#brush-default').button('toggle');

    drawApp = new DrawApp("drawingCanvas");

    var ctx = drawApp.context;
    restorePoints = [ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height)];

    $('#timeleft').countdown({until: +timeleft, compact: true, format: "MS", onTick: highlightCountdown, onExpiry: timesUpWarning});

    $('#undo-button').click(function() {
      undo();
      return false;
    });

    $('#redo-button').click(function() {
      redo();
      return false;
    });

    // Fix broken submit button
    if ($("#play-submit").parent().get(0).childNodes[2].textContent.match(/Submit!/))
    {
      $("#play-submit").text("Submit!");
      $("#play-submit").parent().get(0).childNodes[2].textContent = "";
    }

  } else {
    if (timeleft != "") {
      $('#timeleft').countdown({until: +timeleft, compact: true, format: "MS", onTick: highlightCountdown, onExpiry: timesUp});
    }
  }
}

function loadNextGameAsync()
{
  if (document.location.href.indexOf("/play/") == -1)
  {
    console.log("loadNextGameAsync(): doesn't seem to be playing... o_O");
    return;
  }
  $.ajax({
    url: '/play/',
    cache: false,
    timeout: 15000,
    success: function(s)
    {
      var beginning = '<div class="wrapper">';
      var a = s.indexOf(beginning);
      var b = s.indexOf('</div> <!-- ./wrapper -->');
      if (a != -1 && b != -1)
      {
        var newContent = s.substring(a + beginning.length, b);
        $(".wrapper").html(newContent);

        // Kick-start the patient
        $('[rel=tooltip]').tooltip();
        documentReadyOnPlay();
        empowerPlay(true);
        enhanceCanvas(false);
      } else {
        // In case of mismatch, fallback
        document.location.replace("/play/");
      }
    },
    error: function()
    {
      // In case of error, fallback
      document.location.replace("/play/");
    }
  });
}


function empowerPlay(noReload)
{
  if (!document.getElementById("gameForm")) return;

  // Add options
  var optionsButton = $('<input type="button" value="Options &#x25BC;" class="btn btn-primary btn-sm">');
  var optionsDiv = $('<div>');
  var playModeButton = $('<input id="playMode" type="button" onclick="return playModeClick();" class="btn btn-default btn-sm">');
  playModeButton.attr("value", availablePlayModes[playMode]);
  optionsDiv.prepend(playModeButton);

  $(".gameControls").prepend(optionsButton);
  optionsButton.popover({container: "body", placement: "bottom", html: 1, content: optionsDiv});

  if (!noReload)
  {
    // Show time remaining in document title
    var origtitle = document.title;
    var old_highlightCountdown1 = window.highlightCountdown;
    window.highlightCountdown = function(p)
    {
      old_highlightCountdown1(p);
      var m = ("0" + p[5]).slice(-2);
      var s = ("0" + p[6]).slice(-2);
      document.title = "[" + m + ":" + s + "] " + origtitle;
    };
    $("#timeleft").countdown('option', 'onTick', window.highlightCountdown);

    // Add sound to timeout warning
    var blitz = isBlitzInPlay();
    if ((options.timeoutSound && !blitz) || (options.timeoutSoundBlitz && blitz))
    {
      window.playedWarningSound = false;
      var alarm = new Audio(alarmSoundOgg);
      var old_highlightCountdown2 = window.highlightCountdown;
      window.highlightCountdown = function(p)
      {
        old_highlightCountdown2(p);
        var seconds = $.countdown.periodsToSeconds(p);
        if (!window.playedWarningSound && seconds <= (blitz ? 5 : 61))
        {
          alarm.play();
          window.playedWarningSound = true;
        }
      };
      $("#timeleft").countdown('option', 'onTick', window.highlightCountdown);
    }
  } else {
    window.playedWarningSound = false;
  }

  // Remake skip function to async
  if (options.asyncSkip)
  {
    DrawceptionPlay.skipPanel = function()
    {
      var skipButton = $('input[value="Skip"]');
      if (skipButton.length) skipButton.attr("value", "Skipping...").attr("disabled", "disabled");
      $.ajax({
        url: '/play/skip.json',
        data: { game_token: $('input[name=which_game]').val()},
        type: 'post',
        cache: false,
        timeout: 15000,
        success: function(o)
        {
          localStorage.removeItem("anbt_drawingbackup");
          if (o.redirect)
          {
            loadNextGameAsync();
          } else {
            // Error: reload the page anyway
            loadNextGameAsync();
          }
        },
        error: function(o)
        {
          if (skipButton.length) skipButton.attr("value", "Skip").attr("disabled", null);
          DrawceptionPlay.handleError(o);
        }
      });
    };
  } else {
    // Remove backup in case skipping leads to same gameID, giving double extra time
    DrawceptionPlay.skipPanel_old = DrawceptionPlay.skipPanel;
    DrawceptionPlay.skipPanel = function()
    {
      localStorage.removeItem("anbt_drawingbackup");
      DrawceptionPlay.skipPanel_old();
    };
  }

  // Handle auto-skipping
  var captioning = !document.getElementById("drawingCanvas");
  if (captioning && playMode == MODE_DRAW_ONLY) autoSkip("Playing drawing-only mode");
  else if (!captioning && playMode == MODE_CAPTION_ONLY) autoSkip("Playing caption-only mode");

  // Make Enter work for submitting a caption
  if (captioning)
  {
    var submitclick = $(".button-form[value='Submit!']").attr("onclick");
    if (submitclick)
    {
      $("#gameForm").attr("action", "#");
      if (options.enterToCaption)
      {
        $("#gameForm").attr("onsubmit", submitclick + "; return false;");
      } else {
        $("#gameForm").attr("onsubmit", "return false;");
      }
    }
  }

  // Add bookmark button
  var bookmarkButton = $('<input type="button" value="Bookmark" class="btn btn-primary btn-sm">');
  bookmarkButton.click(function(e)
    {
      e.preventDefault();
      var games = localStorage.getItem("gpe_gameBookmarks");
      games = games ? JSON.parse(games) : {};
      var token = $('input[name="which_game"]').val();
      var pp = $(".play-phrase");
      var caption;
      if (pp.length) caption = pp.first().text().trim();
      games[token] = {time: Date.now(), caption: caption};
      localStorage.setItem("gpe_gameBookmarks", JSON.stringify(games));
      $(this).attr("value", "Bookmarked!").attr("disabled", "disabled").removeClass("btn-primary");
    }
  );
  optionsButton.before(bookmarkButton).before(" ");

  // Remove the temptation to judge
  if (options.removeFlagging) $('input.btn[value="Report"]').remove();
}

// Event functions referred to in HTML must have unwrapped access

window.playModeClick = playModeClick;
function playModeClick()
{
  playMode = (playMode + 1) % availablePlayModes.length;
  localStorage.setItem("gpe_playMode", playMode.toString());
  $("#playMode").attr("value", availablePlayModes[playMode]);
  return false;
}

window.setPalette = setPalette;
function setPalette(num)
{
  var pc = $("#paletteChooser");
  pc.popover("toggle");
  pc.text(palettes[num].name + " \u25BC");
  pc.removeClass().addClass("label").addClass(palettes[num].class);

  $(".colorPicker").parent().remove();
  var c, l, p = $("#tool-eraser").parent();
  bgoptions.empty();
  var falsefunc = function(){ return false; };
  for (var i = 0; i < palettes[num].colors.length; i++)
  {
    c = palettes[num].colors[i];
    l = $(
      '<label class="btn btn-default btn-sm btn-drawtool" style="margin-left: -1px;">' +
        '<input type="radio" name="options" id="color-' + (i+1) + '"/>' +
        '<button class="colorPicker" data-color="' + c + '" style="background:' + c + ';"/>' +
      '</label>'
    );
    l.mousedown(colorPickerMousedown);
    l.contextmenu(falsefunc);
    bgoptions.append('<a class="bglayerPicker" onclick="drawApp.setBglayer(\'' + c + '\')" data-color="' + c + '" style="background:' + c + '">');
    p.before(l);
  }
  return false;
}

window.colorPickerMousedown = colorPickerMousedown;
function colorPickerMousedown(e)
{
  e.preventDefault();
  var rightButton = (e.which === 3 || e.button === 2);
  var leftButton = !rightButton;
  var color = $(this).find(".colorPicker").attr("data-color");
  if (leftButton)
  {
    drawApp.setPrimaryColor(color);
  } else {
    drawApp.setSecondaryColor(color);
  }
  return false;
}

window.uploadCanvasToImgur = uploadCanvasToImgur;
function uploadCanvasToImgur()
{
  if ($("#imgurup b").text() == "Uploading...") return false;
  $("#imgurup b").text("Uploading...");
  $("#imgurimgurl").hide();
  $("#imgurdelurl").hide();
  var data, t = new Image();
  t.onload = function()
  {
    var e = document.getElementById("tempCanvas"),
        n = e.getContext("2d");
    n.fillStyle = bglayer ? bglayer : "#fffdc9";
    n.fillRect(0, 0, 300, 250);
    n.drawImage(t, 0, 0, 300, 250);
    data = e.toDataURL("image/png").split(',')[1];
    $.ajax(
      {
        url: 'https://api.imgur.com/3/image',
        type: 'post',
        headers: {Authorization: 'Client-ID dc1240eb1fddf64'},
        data: {image: data},
        dataType: 'json',
        success: function(r)
        {
          $("#imgurup b").text("Upload to imgur");
          $("#imgurimgurl").show();
          if (r.success)
          {
            $("#imgurimgurl").attr({target: "_blank", href: r.data.link}).text("![Uploaded image](" + r.data.link + ")");
            $("#imgurdelurl").show();
            $("#imgurdelurl").attr("href", "http://imgur.com/delete/" + r.data.deletehash);
          } else {
            var err = r.status ? ("Imgur error: " + r.status) : ("Error: " + r.responseText);
            $("#imgurimgurl").attr({target: "", href: "#"}).text(err);
          }
        },
        error: function(e)
        {
          console.log(e);
          $("#imgurup b").text("Upload to imgur");
          $("#imgurimgurl").show().attr({target: "", href: "#"}).text(("Error: " + e.statusText));
        }
      }
    );
  };
  t.src = drawApp.toDataURL();
  return false;
}

window.reversePanels = reversePanels;
function reversePanels()
{
  var e = $(".thumbnail").parent();
  e.parent().append(e.get().reverse());
  return false;
}

window.likePanelById = likePanelById;
function likePanelById(id)
{
  $.ajax({url: '/viewgame/like/panel.json?panelid=' + id + '&action=Like'});
}

window.likeAll = likeAll;
function likeAll()
{
  $("img[src='/img/thumb_up_off.png']").parent().each(
    function(k, v)
    {
      if ($(v).parent().parent().find("a:last-child").text().trim() != username) v.click();
    }
  );
  return false;
}

window.toggleLight = toggleLight;
function toggleLight()
{
  var css = document.getElementById("darkgraycss");
  if (!inDark)
  {
    if (!css)
    {
      css = document.createElement("style");
      css.id = "darkgraycss";
      css.type = "text/css";
      css.appendChild(document.createTextNode(localStorage.getItem("gpe_darkCSS")));
    }
    document.head.appendChild(css);
    inDark = 1;
  } else {
    document.head.removeChild(css);
    inDark = 0;
  }
  localStorage.setItem("gpe_inDark", inDark.toString());
  return;
}

function panelUrlToDate(url)
{
  var m = url.match(/\/pub\/panels\/(\d+)\/(\d+)-(\d+)\//);
  if (!m) return;
  var monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];
  var day = (100 + parseInt(m[3], 10)).toString().slice(-2);
  return monthNames[parseInt(m[2], 10) - 1] + " " + day + ", " + m[1];
}

function betterView()
{
  var drawings = $('img[src^="/pub/panels/"]');

  // Show approximate creation time from the first drawing panel
  var startDate = panelUrlToDate(drawings.attr("src"));
  var lead = $("#main .lead");
  lead.text(lead.text().replace("game completed", "game started on " + startDate + " and completed"));

  // Show each drawing make date
  drawings.each(function()
  {
    var d;
    if (d = panelUrlToDate(this.src))
    {
      this.title = "Made on " + d;
    }
  });

  // Fix misaligned panels
  var tryNextPanel = function()
  {
    if (!this.naturalWidth && !this.triedFixing)
    {
      var pos = this.src.match(/-(\d+)\.png$/)[1];
      pos++;
      this.src = this.src.replace(/-(\d+)\.png$/, "-" + pos + ".png");
      this.triedFixing = true;
    }
  };
  // TODO: also fix if script is executed after page load
  drawings.on("error", tryNextPanel);

  // Hide your own number of likes
  if (options.ownPanelLikesSecret)
    $(".panel-user").find('a[href*="/' + userid + '/"]').parent().parent().find("span.disabled .numlikes").text("?").css("opacity", "0.5");

  // Reverse panels button and like all button
  $("#btn-copy-url")
    .after(' <a href="#" class="btn btn-default" onclick="return reversePanels();" title="Reverse panels"><span class="glyphicon glyphicon-refresh"></span> Reverse</a>')
    .after(' <a href="#" class="btn btn-default" onclick="return likeAll();" title="Like all panels"><span class="glyphicon glyphicon-thumbs-up"></span> Like all</a>');

  // Remove the temptation to judge
  if (options.removeFlagging) $(".flagbutton").remove();

  // Panel favorite buttons
  var favButton = $('<span class="panel-number anbt_favpanel glyphicon glyphicon-heart text-muted" title="Favorite"></span>');
  favButton.click(function(e)
    {
      e.preventDefault();
      var t = $(this);
      if (t.hasClass("anbt_favedpanel")) return;
      var tp = t.parent();
      var id = scrambleID(tp.find(".gamepanel").attr("id").slice(6));

      var panels = localStorage.getItem("gpe_panelFavorites");
      panels = panels ? JSON.parse(panels) : {};

      var panel = {time: Date.now(), by: tp.find(".panel-user a").text()};
      var img = tp.find(".gamepanel img");
      if (img.length)
      {
        // Drawing panel
        panel.image = img.attr("src");
        panel.caption = img.attr("alt");
      } else {
        // Caption panel
        panel.caption = tp.find(".gamepanel").text().trim();
      }
      panels[id] = panel;
      localStorage.setItem("gpe_panelFavorites", JSON.stringify(panels));
      t.addClass("anbt_favedpanel");
    }
  );
  $(".panel-number").after(favButton);

  // Panel replay button
  if (options.newCanvas)
  {
    var addReplayButton = function()
    {
      if (this.replayAdded) return;
      this.replayAdded = true;
      var panel = $(this).parent();
      checkForRecording(this.src, function()
      {
        var id = scrambleID(panel.attr("id").slice(6));
        var replayButton = $('<a href="/sandbox/#' + id + '" class="panel-number anbt_replaypanel glyphicon glyphicon-repeat text-muted" title="Replay"></span>');
        replayButton.click(function(e)
        {
          if (e.which === 2) return;
          e.preventDefault();
          setupNewCanvas(true, "/sandbox/#" + id);
        });
        panel.before(replayButton);
      });
    };
    drawings.on("load", addReplayButton);
    drawings.each(function()
    {
      if (this.complete) addReplayButton.call(this);
    });
  }

  // Linkify the links
  $('.comment-body').each(function()
    {
      var t = $(this);
      if (t.text().indexOf("://") == -1) return;
      t.html(t.html().replace(/([^"]|^)(https?:\/\/[^\s<]+)/g, '$1<a href="$2">$2</a>'));
    }
  );

  // Highlight new comments and remember seen comments
  var seenComments = localStorage.getItem("gpe_seenComments");
  seenComments = (seenComments === null) ? {} : JSON.parse(seenComments);
  var gameid = document.location.href.match(/viewgame\/([^\/]+)\//)[1];
  var comments = $("#comments").parent();
  var holders = comments.find(".comment-holder");
  if (!holders.length) return;
  // Clear old tracked comments
  var hour = Math.floor(Date.now() / (1000 * 60*60)); // timestamp with 1 hour precision
  for (var tempgame in seenComments)
  {
    // Store game entry for up to a week after last tracked comment
    if (seenComments[tempgame].h + 24*7 < hour)
    {
      delete seenComments[tempgame];
    }
  }
  var maxseenid = 0;
  holders.each(function()
  {
    var t = $(this);
    var ago = t.find(".text-muted").text();
    var commentid = parseInt(t.attr("id").slice(1), 10);
    // Track comments from up to week ago
    if (ago.match(/just now|min|hour| [1-7] day/))
    {
      if (seenComments[gameid] && seenComments[gameid].id >= commentid) return;
      t.addClass("comment-new");
      if (maxseenid < commentid) maxseenid = commentid;
    }
  });
  if (maxseenid) seenComments[gameid] = {h: hour, id: maxseenid};
  localStorage.setItem("gpe_seenComments", JSON.stringify(seenComments));
}

function checkForRecording(url, yesfunc)
{
  var xhr = new XMLHttpRequest();
  xhr.open('GET', url, true);
  xhr.responseType = 'arraybuffer';
  xhr.onload = function()
  {
    var buffer = this.response;
    var dv = new DataView(buffer);
    var magic = dv.getUint32(0);
    if (magic != 0x89504e47) return;
    for (var i = 8; i < buffer.byteLength; i += 4 /* Skip CRC */)
    {
      var chunklen = dv.getUint32(i);
      i += 4;
      var chunkname = dv.getUint32(i);
      i += 4;
      if (chunkname == 0x73764762)
      {
        return yesfunc();
      } else {
        if (chunkname == 0x49454e44) break;
        i += chunklen;
      }
    }
  };
  xhr.send();
}

function betterPanel()
{
  var favButton = $('<button class="btn btn-info" style="margin-top: 20px"><span class="glyphicon glyphicon-heart"></span> <b>Favorite</b></button>');
  favButton.click(function(e)
    {
      e.preventDefault();
      var panels = localStorage.getItem("gpe_panelFavorites");
      panels = panels ? JSON.parse(panels) : {};
      var panel = {time: Date.now(), by: $(".lead a").text()};
      var id = document.location.href.match(/\/panel\/[^\/]+\/([^\/]+)\//)[1];
      var img = $(".gamepanel img");
      if (img.length)
      {
        // Drawing panel
        panel.image = img.attr("src");
        panel.caption = img.attr("alt");
      } else {
        // Caption panel
        panel.caption = $(".gamepanel").text().trim();
      }
      panels[id] = panel;
      localStorage.setItem("gpe_panelFavorites", JSON.stringify(panels));
      $(this).attr("disabled", "disabled").find("b").text("Favorited!");
    }
  );
  $(".gamepanel").after(favButton);

  var d, img = $(".gamepanel img");
  if (img.length && (d = panelUrlToDate(img.attr("src"))))
  {
    $("#main .lead").append("<br>made on " + d);
  }

  var panelId = getPanelId(location.pathname);

  // Only panels after 14924553 might have a recording
  if (options.newCanvas && unscrambleID(panelId) >= 14924553)
  {
    var img = $(".gamepanel img");
    if (img.length)
    {
      checkForRecording(img.attr("src"), function()
      {
        var replayLink = $('<a class="btn btn-primary" style="margin-top: 20px" href="/sandbox/#' + panelId + '"><span class="glyphicon glyphicon-repeat"></span> <b>Replay</b></a> ');
        replayLink.click(function(e)
        {
          if (e.which === 2) return;
          e.preventDefault();
          setupNewCanvas(true, "/sandbox/#" + panelId);
        });
        $(".gamepanel").after(replayLink);
      });
    }
  }

  if (options.rememberPosition && $(".regForm > .lead").text().match(/public game/)) // your own panel
  {
    panelPositions.load();
    if (panelPositions.player[panelId]) return;

    var profileUrl = $(".btn").has(".avatar").attr("href");
    $.get(profileUrl, function (html)
    {
      html = html.replace(/<img\b[^>]*>/ig, ''); // prevent image preload
      var profilePage = $.parseHTML(html);
      var panelProgressText = $(profilePage).find("a[href='" + location.pathname + "']").next().find(".progress-bar-text").text();
      var panelPosition = parseInt(panelProgressText.match(/\d+/)[0]);
      panelPositions.player[panelId] = panelPosition;
      panelPositions.clear(profilePage);
      panelPositions.save();
    });
  }
}

var panelPositions =
{
  player: null,
  last: null,
  load: function ()
  {
    function loadObj(key)
    {
      var val = localStorage.getItem(key);
      return val && JSON.parse(val) || {};
    }

    panelPositions.player = loadObj("gpe_panelPositions");
    panelPositions.last = loadObj("gpe_lastGamePositions");
  },
  save: function ()
  {
    localStorage.setItem("gpe_panelPositions", JSON.stringify(panelPositions.player));
    localStorage.setItem("gpe_lastGamePositions", JSON.stringify(panelPositions.last));
  },
  clear: function (page)
  {
    function clearKeys(obj, keys)
    {
      $.each(obj, function (k) { if (keys.indexOf(k) < 0) delete obj[k]; });
    }

    var existingIds = $(page).find(".progress-striped").map(function()
    {
      return getPanelId($(this).prev().attr("href"));
    }).get();
    clearKeys(panelPositions.player, existingIds);
    clearKeys(panelPositions.last, existingIds);
  }
};

function initAjaxRetry()
{
  if (!options.ajaxRetry) return;

  var requestCount = 0;

  $.ajaxPrefilter(function (options, originalOptions)
  {
    requestCount++;
    $("body").css("cursor", "progress");

    if (options.retryEnabled) return;

    var isComment = options.url === "/viewgame/comments/add.json";
    var retryCount = 0;

    options.retryEnabled = true;
    options.success = function (data, textStatus, jqXHR)
    {
      if (options.url === "/viewgame/like/panel.json" && data && data.error === "Invalid request. You already liked this?")
      {
        data = { callJS: "updateLikeDisplay", data: { panelid: originalOptions.data.panelid, setstatus: originalOptions.data.action === "Like" ? "on" : "off"} };
      }

      if (options.url === "/play/skip.json" && data && data.error === "Sorry, but we couldn\u0027t find your current game.")
      {
        location.reload();
        return;
      }

      if (options.url === "/play/exit.json" && data && data.error === "Sorry, but we couldn\u0027t find your current game.")
      {
        location.pathname = "/";
        return;
      }

      originalOptions.success && originalOptions.success(data, textStatus, jqXHR);
    };
    options.error = function ()
    {
      if (!isComment && retryCount++ < 5)
        $.ajax(options);
      else
        originalOptions.error && originalOptions.error.apply(this, arguments);

      if (isComment)
        $("#commentButton").button("reset");
    };
    options.complete = function ()
    {
      originalOptions.complete && originalOptions.complete.apply(this, arguments);

      if (--requestCount <= 0)
        $("body").css("cursor", "");
    };
  });
}

function getPanelId(url)
{
  var match = url.match(/\/panel\/[^\/]+\/(\w+)\//);
  return match && match[1];
}

function simpleHash(s)
{
  return s.toString().split("").reduce(function(a, b)
    {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0
  );
}

function rot13(s)
{
  return s.toString().split("").map(function(c)
    {
      c = c.charCodeAt(0);
      if (c >= 97 && c <= 122) c = (c - 97 + 13) % 26 + 97;
      if (c >= 65 && c <= 90) c = (c - 65 + 13) % 26 + 65;
      return String.fromCharCode(c);
    }
  ).join("");
}

function randomGreeting()
{
  // Spoilers!
  var g = ["Oruvaq lbh!", "Ubcr vg'f abg envavat gbqnl.", "Jurer vf lbhe tbq abj?",
    "Lbh fubhyq srry 5% zber cbjreshy abj.", "Fhqqrayl, abguvat unccrarq!", "^_^",
    "Guvf gnxrf fb ybat gb svavfu...", "Jungrire lbh qb, qba'g ernq guvf grkg.",
    "Pyvpx urer sbe 1 serr KC", "Or cngvrag.", "Whfg qba'g fgneg nal qenzn nobhg vg.",
    "47726S6Q2069732074686520677265617465737421", "Cynl fzneg.", "Cynl avpr.",
    "Fzvyr!", "Qba'g sbetrg gb rng.", "V xabj jung lbh'ir qbar.", "Fpvrapr!",
    "Gbqnl vf n tbbq qnl."];
  var change_every_half_day = Math.floor(Date.now() / (1000 * 60 * 60 * 12));
  var rnddata = simpleHash(change_every_half_day + parseInt(userid, 10) + 178889);
  return rot13(g[rnddata % g.length]);
}

function formatTimestamp(d)
{
  if (typeof d == "number") d = new Date(d);
  if (options.localeTimestamp) return d.toLocaleString();
  var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var s = [
    (100 + d.getDate() + "").slice(-2),
    " ",
    months[d.getMonth()],
    " ",
    d.getFullYear(),
    " ",
    (100 + d.getHours() + "").slice(-2),
    ":",
    (100 + d.getMinutes() + "").slice(-2)
  ].join("");
  return s;
}

window.viewMyPanelFavorites = viewMyPanelFavorites;
function viewMyPanelFavorites()
{
  var panels = localStorage.getItem("gpe_panelFavorites");
  panels = panels ? JSON.parse(panels) : {};
  var result = "";
  for (var id in panels)
  {
    result += '<div id="' + id + '" class="col-xs-6 col-sm-4 col-md-2" style="min-width: 150px;">' +
      '<div class="thumbnail" style="overflow:hidden"><a class="anbt_paneldel" href="#" title="Remove">X</a>' +
      '<a href="/panel/-/' +
      id + '/-/" class="thumbnail thumbpanel" rel="tooltip" title="' +
      panels[id].caption + '">' +
      (panels[id].image
        ? '<img src="' + panels[id].image + '" width="125" height="104" alt="' + panels[id].caption + '" />'
        : panels[id].caption) +
      '</a><span class="text-muted" style="white-space:nowrap">by ' + panels[id].by +
      '</span><br><span class="text-muted"><span class="glyphicon glyphicon-heart"></span> ' +
      formatTimestamp(panels[id].time) + '</span></div></div>';
  }
  if (!result) result = "You don't have any favorited panels.";
  $("#anbt_userpage").html(result);
  $("#anbt_userpage").on("click", ".anbt_paneldel", function(e)
    {
      e.preventDefault();
      var id = $(this).parent().parent().attr("id");
      $("#" + id).fadeOut();
      delete panels[id];
      localStorage.setItem("gpe_panelFavorites", JSON.stringify(panels));
    }
  );
}

window.viewMyGameBookmarks = viewMyGameBookmarks;
function viewMyGameBookmarks()
{
  var removeButtonHTML = '<a class="anbt_gamedel pull-right lead glyphicon glyphicon-remove btn btn-sm btn-danger" href="#" title="Remove" style="margin-left: 10px"></a>';
  var games = localStorage.getItem("gpe_gameBookmarks");
  games = games ? JSON.parse(games) : {};
  var result = "";
  for (var id in games)
  {
    if (id.length == 43) // token
    {
      result += '<p class="well" id="' + id + '"><span>' + id + '</span>' + removeButtonHTML + '</p>';
      (function(id)
        {
          $.ajax(
            {
              url: '/play/' + id,
              cache: false,
              error: function(e)
              {
                $("#" + id).find("span").text("Error while retrieving game: " + e.statusText);
                return;
              },
              success: function(e)
              {
                var m = e.match(/Game is not private/) || e.match(/Problem loading game/) && "dust";
                if (m)
                {
                  var gamename = "";
                  if (games[id].caption) gamename += " " + games[id].caption;
                  if (games[id].time) gamename += " bookmarked on " + formatTimestamp(games[id].time);
                  if (!gamename) gamename = id;
                  var status = (m == "dust") ? "Deleted / dusted" : "Unfinished public";
                  $("#" + id).find("span").text(status + " game" + gamename);
                  return;
                }
                var title = e.match(/<title>(.+)<\/title>/)[1];
                m = e.match(/\/viewgame\/([^\/]+)\/[^\/]+\//);
                var url = m[0];
                var gameid = m[1];
                delete games[id];
                games[gameid] = {title: title, url: url};
                $("#" + id).attr("id", gameid).find("span").replaceWith('<a href="' + url +'">' + title + '</a>');
                localStorage.setItem("gpe_gameBookmarks", JSON.stringify(games));
              }
            }
          );
        }
      )(id);
    }
    else if (id.length == 10) // game ID
    {
      result += '<p class="well" id="' + id + '"><a href="' + games[id].url + '">' + games[id].title + '</a>' + removeButtonHTML + '</p>';
    }
  }
  if (!result) result = "You don't have any bookmarked games.";
  $("#anbt_userpage").html(result);
  $("#anbt_userpage").on("click", ".anbt_gamedel", function(e)
    {
      e.preventDefault();
      var id = $(this).parent().attr("id");
      $("#" + id).fadeOut();
      delete games[id];
      localStorage.setItem("gpe_gameBookmarks", JSON.stringify(games));
    }
  );
}

function betterPlayer()
{
  // Remove the temptation to judge
  if (options.removeFlagging) $('a.btn:contains("Report")').remove();

  var loc = document.location.href;
  // If it's user's homepage, add new buttons in there
  if (loc.match(new RegExp('/player/' + userid + '/[^/]+/(?:$|#)')))
  {
    var a = $("<h3>ANBT stuff: </h3>");
    a.append('<a class="btn btn-primary" href="#anbt_panelfavorites" onclick="viewMyPanelFavorites();">Panel Favorites</a> ');
    a.append('<a class="btn btn-primary" href="#anbt_gamebookmarks" onclick="viewMyGameBookmarks();">Game Bookmarks</a>');
    var newrow = $('<div class="row"></div>');
    newrow.append($('<div class="col-md-12"></div>').append(a).append('<div id="anbt_userpage">' + randomGreeting() + '</div>'));
    $("div.col-md-8").first().parent().before(newrow);

    if (document.location.hash.indexOf("#anbt_panelfavorites") != -1) viewMyPanelFavorites();
    if (document.location.hash.indexOf("#anbt_gamebookmarks") != -1) viewMyGameBookmarks();

    // Make delete cover button safer
    var old_deleteCover = DrawceptionPlay.deleteCover;
    DrawceptionPlay.deleteCover = function()
    {
      apprise('Delete the whole cover, really?', {'verify': true}, function(r)
        {
          if (r) { old_deleteCover(); }
        }
      );
    };

    if (options.rememberPosition)
    {
      panelPositions.load();
      panelPositions.clear(document);

      $(".progress-striped").each(function ()
      {
        var panelId = getPanelId($(this).prev().attr("href"));
        var playerPanelPosition = panelPositions.player[panelId];
        var lastSeenPanelPosition = panelPositions.last[panelId];
        var panelProgress = $(this).find(".progress-bar-text");
        var panelProgressText = panelProgress.text();
        var panelPosition = parseInt(panelProgressText.match(/\d+/)[0]);
        var totalPanelCount = parseInt(panelProgressText.match(/\d+/g)[1]);

        panelProgress.css("pointer-events", "none"); // to make tooltips work under label
        if ((playerPanelPosition || lastSeenPanelPosition || panelPosition) < panelPosition)
        {
          $(this).find(".progress-bar")
            .width((playerPanelPosition || lastSeenPanelPosition) / totalPanelCount * 100 + "%");
        }
        if (playerPanelPosition && panelPosition > playerPanelPosition && playerPanelPosition < lastSeenPanelPosition)
        {
          $('<div class="progress-bar progress-bar-info" title="Panels added after yours">')
            .width((Math.min(lastSeenPanelPosition || panelPosition, panelPosition) - playerPanelPosition) / totalPanelCount * 100 + "%")
            .insertBefore(panelProgress)
            .tooltip();
        }
        if (lastSeenPanelPosition && panelPosition > lastSeenPanelPosition)
        {
          $('<div class="progress-bar progress-bar-success" title="Panels added recently">')
            .width((panelPosition - lastSeenPanelPosition) / totalPanelCount * 100 + "%")
            .insertBefore(panelProgress)
            .tooltip();
        }
        if (lastSeenPanelPosition && panelPosition < lastSeenPanelPosition)
        {
          $('<div class="progress-bar progress-bar-danger" title="Panel was removed recently">')
            .width(1 / totalPanelCount * 100 + "%")
            .insertBefore(panelProgress)
            .tooltip();
        }
        if (playerPanelPosition)
        {
          $('<span title="Your panel position">')
            .text("#" + playerPanelPosition)
            .insertBefore(this)
            .tooltip();
        }

        panelPositions.last[panelId] = panelPosition;
      });

      panelPositions.save();
    }
  } else {
    var drawings = $('img[src^="/pub/panels/"]');
    // Show replayable panels; links are not straightforward to make since there's no panel ID
    if (options.newCanvas)
    {
      var addReplaySign = function()
      {
        if (this.replayAdded) return;
        this.replayAdded = true;
        var panel = $(this).parent().parent();
        checkForRecording(this.src, function()
        {
          var replaySign = $('<span class="pull-right glyphicon glyphicon-repeat" style="color:#8af;margin-right:4px" title="Replayable!"></span>');
          panel.append(replaySign);
          replaySign.tooltip();
        });
      };
      drawings.on("load", addReplaySign);
      drawings.each(function()
      {
        if (this.complete) addReplaySign.call(this);
      });
    }
    // Detect Draw Firsts
    drawings.each(function()
    {
      if (this.src.match(/-1\.png$/))
      {
        var drawFirstSign = $('<span class="pull-right" title="Draw First game"><img src="/img/icon-coins.png"></span>');
        $(this).parent().parent().append(drawFirstSign);
        drawFirstSign.tooltip();
      }
    });
  }
}

function betterForum()
{
  // Convert times
  // Forum time is Florida, GMT-6, to be +1 DST since 08 Mar 2015, 2:00
  var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function convertForumTime(year, month, day, hours, minutes)
  {
    var d = new Date(year, month, day, hours, minutes);
    var tzo = d.getTimezoneOffset() * 60 * 1000;
    return formatTimestamp(d.getTime() - tzo + 6 * 60 * 60 * 1000);
  }

  $("span.muted, span.text-muted").each(function(index)
    {
      var year, month, day, minutes, hours;
      var m, t = $(this), tx = t.text();
      // Don't touch relative times
      if (tx.indexOf('ago') != -1) return;
      if (m = tx.match(/^\s*\(last post (...) (\d+).. (\d+):(\d+)([ap]m)\)\s*$/))
      {
        var d = new Date();
        month = months.indexOf(m[1]);
        day = parseInt(m[2], 10);
        hours = parseInt(m[3], 10) % 12;
        minutes = parseInt(m[4], 10);
        year = d.getFullYear();
        if ((d.getMonth() < 6) && (month >= 6)) year--;
        hours += (m[5] == 'pm') ? 12 : 0;
        var time = convertForumTime(year, month, day, hours, minutes);
        t.text("(last post " + time + ")");
        // Track new posts at subforum list
        if (location.href.match(/forums\/$/))
        {
          if (time != localStorage.getItem("anbt_subforum" + index))
          {
            t.parent().prepend('<span class="label label-sm label-warning">NEW</span>');
            localStorage.setItem("anbt_subforum" + index, time);
          }
        }
      }
      else if (m = tx.match(/^\s*\[ (\d+):(\d+) ([ap]m) ... (...) (\d+).., (\d{4}) \]\s*$/))
      {
        hours = parseInt(m[1], 10) % 12;
        minutes = parseInt(m[2], 10);
        hours += (m[3] == 'pm') ? 12 : 0;
        month = months.indexOf(m[4]);
        day = parseInt(m[5], 10);
        year = parseInt(m[6], 10);
        t.text("[ " + convertForumTime(year, month, day, hours, minutes) + " ]");
      }
    }
  );

  // Linkify the links
  $('.comment-body p').each(function()
    {
      var t = $(this);
      if (t.text().indexOf("://") == -1) return;
      t.html(t.html().replace(/([^"]|^)(https?:\/\/[^\s<]+)/g, '$1<a href="$2">$2</a>'));
    }
  );

  // Linkify drawing panels
  $('img[src*="/pub/panels/"]').each(function()
    {
      var t = $(this);
      if (!t.parent().is("a"))
      {
        var gameid = t.attr("src").match(/\/([^-]+)-\d+.png/)[1];
        var gameurl = "/viewgame/" + gameid + "/-/";
        t.wrap('<a href="' + gameurl +'"></a>');
      }
    }
  );
  $('img[src*="/panel/"]').each(function()
    {
      var t = $(this);
      if (!t.parent().is("a"))
      {
        t.wrap('<a href="' + t.attr("src") + '-/"></a>');
      }
    }
  );
  // Fix the dead link
  $('img[src*="/display-panel.php?"]').each(function()
    {
      var t = $(this);
      if (!t.parent().is("a"))
      {
        var panelid = t.attr("src").match(/x=(\d+)/)[1];
        var newsrc = "/panel/drawing/" + scrambleID(panelid) + "/";
        t.attr("src", newsrc);
        t.wrap('<a href="' + newsrc + '-/"></a>');
      }
    }
  );

  // Show posts IDs and link
  var lastid = 0;
  $("span.muted").each(function()
    {
      var t = $(this), anch, id;
      try
      {
        anch = t.parent().parent().parent().parent().attr("id");
      } catch(e) {}
      if (anch)
      {
        id = parseInt(anch.substring(1), 10);
        if (id > lastid)
        {
          t.after(' <a class="text-muted" href="#' + anch + '">#' + id + '</a>');
        } else {
          t.after(' <a class="text-muted wrong-order" href="#' + anch + '">#' + id + '</a>');
        }
        lastid = id;
      }
    }
  );

  if (options.proxyImgur)
  {
    $('img[src*="imgur.com/"]').each(function()
      {
        var t = $(this);
        t.attr("src", "http://www.gmodules.com/ig/proxy?url=" + encodeURIComponent(t.attr("src")));
      }
    );
  }
}

function loadScriptSettings()
{
  var result = localStorage.getItem("gpe_anbtSettings");
  if (!result) return;
  result = JSON.parse(result);
  for (var i in result) options[i] = result[i];
}

window.updateScriptSettings = updateScriptSettings;
function updateScriptSettings(theForm)
{
  var result = {};
  $(theForm).find("input").each(function()
    {
      if (this.type == "checkbox")
      {
        result[this.name] = this.checked ? 1 : 0;
      }
      else if (this.getAttribute("data-subtype") == "number")
      {
        result[this.name] = parseFloat(this.value);
      }
      else
      {
        result[this.name] = this.value;
      }
    }
  );
  localStorage.setItem("gpe_anbtSettings", JSON.stringify(result));
  loadScriptSettings();
  $("#anbtSettingsOK").fadeIn("slow").fadeOut("slow");
  return false;
}

function addScriptSettings()
{
  var theForm = $('<form class="regForm form-horizontal" action="#" onsubmit="return updateScriptSettings(this);"></form>');
  theForm.append('<legend>ANBT script settings</legend>');

  var addGroup = function(name, settings)
  {
    var div = $('<div class="control-group"></div>');
    div.append('<label class="control-label" for="">' + name + '</label>');
    settings.forEach(function(id)
      {
        var v = options[id[0]], name = id[0], t = id[1], desc = id[2];
        var c = $('<div class="controls"></div>');
        if (t == "boolean")
        {
          c.append('<input type="checkbox" id="anbt_' + name + '" name="' + name + '" value="1" ' + (v ? 'checked="checked"' : '') + '">');
          c.append('<label for="anbt_' + name + '">' + desc + '</label>');
        }
        else if (t == "number")
        {
          c.append('<b>' + desc + ':</b><input class="form-control" type="text" data-subtype="number" name="' + name + '" value="' + v + '">');
        }
        else
        {
          c.append('<b>' + desc + ':</b><input class="form-control" type="text" name="' + name + '" value="' + v + '">');
        }
        div.append(c);
      }
    );
    theForm.append(div);
  };
  addGroup('Pen Tablet (requires plugin: <a href="http://www.wacomeng.com/web/fbWTPInstall.zip">Windows</a> | <a href="http://www.wacomeng.com/web/Wacom%20Mac%20Plug-in%20Installer.zip">Mac OS</a> | <a href="https://github.com/ZaneA/WacomWebPlugin">Linux</a>)',
    [
      ["enableWacom", "boolean", "Enable Wacom plugin / pressure sensitivity support"],
      ["fixTabletPluginGoingAWOL", "boolean", "Try to prevent Wacom plugin from disappearing"],
      ["pressureExponent", "number", "Pressure exponent (smaller = softer tablet response, bigger = sharper)"],
    ]
  );
  addGroup("Play",
    [
      ["newCanvas", "boolean", 'New drawing canvas (also allows <a href="http://grompe.org.ru/replayable-drawception/">watching playback</a>)'],
      ["submitConfirm", "boolean", "Confirm submitting if more than a minute is left (New canvas only)"],
      ["asyncSkip", "boolean", "Fast Async Skip (experimental, applies to old canvas only)"],
      ["hideCross", "boolean", "Hide the cross when drawing"],
      ["enterToCaption", "boolean", "Submit captions by pressing Enter"],
      ["backup", "boolean", "Save the drawing in case of error and restore it in sandbox"],
      ["timeoutSound", "boolean", "Warning sound when only a minute is left (normal games)"],
      ["timeoutSoundBlitz", "boolean", "Warning sound when only 5 seconds left (blitz)"],
      ["rememberPosition", "boolean", "Show your panel position and track changes in unfinished games list"],
    ]
  );
  addGroup('Chat (Standalone address: <a href="http://chat.grompe.org.ru/#drawception">http://chat.grompe.org.ru/#drawception</a>)',
    [
      ["loadChat", "boolean", "Load the embedded chat"],
      ["chatAutoConnect", "boolean", "Automatically connect to the chat"],
    ]
  );
  addGroup("Miscellaneous",
    [
      ["localeTimestamp", "boolean", "Format timestamps as your system locale (" + (new Date()).toLocaleString() +")"],
      ["removeFlagging", "boolean", "Remove flagging buttons"],
      ["ownPanelLikesSecret", "boolean", "Hide your own panels' number of Likes (in game only)"],
      ["proxyImgur", "boolean", "Use Google proxy to load links from imgur, in case your ISP blocks them"],
      ["ajaxRetry", "boolean", "Retry failed AJAX requests"],
      ["autoplay", "boolean", "Automatically start replay when watching playback"],
    ]
  );
  theForm.append('<div class="control-group"><div class="controls"><input name="submit" type="submit" class="btn btn-primary" value="Apply"> <b id="anbtSettingsOK" class="label label-theme_holiday" style="display:none">Saved!</b></div></div>');
  $("#settingsForm").before(theForm);
}

function autoSkip(reason)
{
  var autoSkipInfo = $('<div id="autoSkipInfo" class="text-warning" style="cursor: pointer">(CLICK TO CANCEL)<br>Auto-skipping in <span id="autoSkipCounter">3</span>...<br>Reason: ' +  reason + '</div>');
  $(".play-instruction").append(autoSkipInfo);
  autoSkipInfo.click(function(e)
    {
      e.preventDefault();
      $("#autoSkipCounter").countdown("pause");
      autoSkipInfo.hide();
    }
  );
  $("#autoSkipCounter").countdown({
      until: 3,
      compact: 1,
      format: "S",
      onExpiry: timesUp
  });
}

function uploadToCanvas()
{
  if (!fileInput)
  {
    fileInput = $('<input type="file">');
    $(document.body).append(fileInput);
    fileInput.on("change", function(theEvt)
      {
        var thefile = theEvt.target.files[0];
        var reader = new FileReader();
        reader.onload = function(evt)
        {
          // can't do this with new undo
          //restorePoints.push(evt.target.result);
          //undo();
        };
        reader.readAsDataURL(thefile);
      }
    );
  }
  fileInput.get(0).click();
}

var theAlphabet = "36QtfkmuFds0UjlvCGIXZ125bEMhz48JSYgipwKn7OVHRBPoy9DLWaceqxANTr";
// Game IDs will never contain these symbols: u 0U lv I J i V o
// So they are base 52 for some reason...

function decTo62(n)
{
  var b = theAlphabet;
  var result = '';
  var bLen = b.length;
  while (n != 0) {
    var q = n % bLen;
    result = b[q] + result;
    n = (n - q) / bLen;
  }
  return result;
}

function _62ToDec(n)
{
  n = n.toString();
  var b = theAlphabet;
  var cache_pos = {};
  var bLen = b.length;
  var result = 0;
  var pow = 1;
  for (var i = n.length-1; i >= 0; i--) {
    var c = n[i];
    if (typeof cache_pos[c] == 'undefined') {
      cache_pos[c] = b.indexOf(c);
    }
    result += pow * cache_pos[c];
    pow *= bLen;
  }
  return result;
}

window.scrambleID = scrambleID;
function scrambleID(num)
{
  return decTo62(parseInt(num, 10) + 3521614606208).split("").reverse().join("");
}

window.unscrambleID = unscrambleID;
function unscrambleID(str)
{
  return _62ToDec(str.split("").reverse().join("")) - 3521614606208;
}

window.stalkNextPanel = stalkNextPanel;
function stalkNextPanel(forward)
{
  if (!forward) forward = 1;
  var sid = location.href.match(/\/panel\/[^\/]+\/(\w+)\/[^\/]+\//)[1];
  var sid2 = scrambleID(unscrambleID(sid) + 4 * forward);
  location.href = location.href.replace(sid, sid2);
}

window.drawingHint = drawingHint;
function drawingHint()
{
  var gp = $(".gamepanel");
  if (!gp.length) return;
  var id = gp.attr("src").match(/\d+/)[0];
  $.ajax(
    {
      url: '/panel/get.json?panelid=' + id,
      complete: function(result)
      {
        result = JSON.parse(result.responseText);

        alert("Title: " + result.data.title + "\nImage: http://drawception.com" + result.data.image);
      }
    }
  );
}

window.dataToCanvas = dataToCanvas;
function dataToCanvas()
{
  var url = prompt("Enter data:URI of the image you want to paste");
  if (url)
  {
    var img = new Image();
    if (url.indexOf("http://") != -1 && url.indexOf("//drawception.com/") == -1) img.crossOrigin = "Yes please";
    img.src = url;
    img.onload = function()
    {
      var oo = drawApp.context.globalCompositeOperation;
      drawApp.context.globalCompositeOperation = "copy";
      drawApp.context.drawImage(this, 0, 0, drawApp.context.canvas.width, drawApp.context.canvas.height);
      drawApp.context.globalCompositeOperation = oo;
      save();
    };
  }
}

function valueToHex(val)
{
  return (Math.floor(val/16)%16).toString(16)+(Math.floor(val)%16).toString(16);
}

function eyedropper(x, y)
{
  var p = drawApp.context.getImageData(x, y, 1, 1).data;
  return (p[3] > 0) ? ("#" + valueToHex(p[0]) + valueToHex(p[1]) + valueToHex(p[2])) : null;
}

function invertColor(c)
{
  // Support only hex color
  if (c.charAt(0) != "#") return c;
  c = c.substring(1);
  // Ensure it's in long form
  if (c.length == 3) c = c.charAt(0) + c.charAt(0) + c.charAt(1) + c.charAt(1) + c.charAt(2) + c.charAt(2);
  return "#" + ("000000" + (parseInt(c, 16) ^ 0xFFFFFF).toString(16)).slice(-6);
}

function dbg()
{
  if (!__DEBUG__) return;
  var out = [];
  for (var i = 0; i < arguments.length; i++)
  {
    out.push(arguments[i]);
  }
  __DEBUG__.innerHTML = out.join(", ");
}

function pagodaBoxError()
{
  if (document.body.innerHTML.match("There appears to be an error" + " with this site."))
  {
    GM_addStyle(
      "body {background: #755}" +
      ""
    );
    div = document.createElement("div");
    div.innerHTML = '<h1>ANBT speaking:</h1>' +
      'Meanwhile, you can visit the chat: ' +
      '<a href="http://chat.grompe.org.ru/#drawception">http://chat.grompe.org.ru/#drawception</a><br>' +
      'Or use the new sandbox: <a href="http://grompe.org.ru/drawit/">http://grompe.org.ru/drawit/</a>';
    document.body.appendChild(div);
    return true;
  }
}

function pageEnhancements()
{
  var loc = document.location.href;
  loadScriptSettings();

  if (pagodaBoxError()) return;

  if (typeof jQuery == "undefined") return; // Firefox Greasemonkey seems to call pageEnhancements() after document.write...

  __DEBUG__ = document.getElementById("_debug_");
  prestoOpera = jQuery.browser.opera && (parseInt(jQuery.browser.version, 10) <= 12);
  firefox4OrOlder = jQuery.browser.mozilla && (parseInt(jQuery.browser.version, 10) < 5);

  var scroll = $("#content").scrollTop();

  // Stop tracking me! Best to block
  // api.mixpanel.com and cdn.mxpnl.com
  if (typeof mixpanel != "undefined") mixpanel = {track: function(){}, identify: function(){}};

  initAjaxRetry();

  try
  {
    var tmpuserlink = $(".glyphicon-user").parent();
    username = tmpuserlink.text().trim();
    userid = tmpuserlink.attr("href").match(/\/player\/(\d+)\//)[1];
    // Fix keyboard scrolling without clicking on the window
    $("#content a[href='/play/']").get()[0].focus();
    localStorage.setItem("gpe_lastSeenName", username);
    localStorage.setItem("gpe_lastSeenId", userid);
  }
  catch(e){}

  var insandbox = loc.match(/drawception\.com\/sandbox\/#?(.*)/);
  var inplay = loc.match(/drawception\.com\/play\/(.*)/);
  if (options.newCanvas)
  {
    // If created a friend game, the link won't present playable form
    if (insandbox || (inplay && document.getElementById("gameForm")) || __DEBUG__)
    {
      return(setupNewCanvas(insandbox, loc));
    }
  } else {
    if (insandbox || inplay || __DEBUG__)
    {
      enhanceCanvas(insandbox);
    }
    if (inplay || __DEBUG__)
    {
      empowerPlay();
    }
  }
  if (loc.match(/drawception\.com\/viewgame\//))
  {
    betterView();
  }
  if (loc.match(/drawception\.com\/panel\//))
  {
    betterPanel();
  }
  if (loc.match(/drawception\.com\/player\//))
  {
    betterPlayer();
  }
  if (loc.match(/drawception\.com\/forums\//))
  {
    betterForum();
  }
  if (loc.match(/drawception\.com\/settings\//))
  {
    addScriptSettings();
  }
  GM_addStyle(
    ".thumbnail > .panel-details {max-height: 30px; overflow: visible; display: flex; flex-direction: row-reverse; justify-content: space-between}" +
    ".thumbnail > .panel-details > .btn-group.pull-right {float: none !important; flex-grow: 0; flex-shrink: 0}" +
    ".thumbnail > .panel-details > .panel-user {flex-grow: 1; flex-shrink: 1}" +
    ".gpe-wide {display: none}" +
    ".gpe-btn {padding: 5px 8px; height: 28px}" +
    ".gpe-spacer {margin-right: 7px; float:left}" +
    "@media (min-width:992px) {#open-left {display: none} .gpe-wide {display: inline}}" +
    "@media (min-width:1200px) {.gpe-btn {padding: 5px 16px;} .gpe-spacer {margin-right: 20px;}}" +
    "#anbtver {font-size: 10px; position:absolute; opacity:0.3; right:10px; top:50px}" +
    ".anbt_paneldel {position:absolute; padding:1px 6px; color:#FFF; background:#d9534f; text-decoration: none !important; right: 18px; border-radius: 5px}" +
    ".anbt_paneldel:hover {background:#d2322d}" +
    ".anbt_favpanel {top: 40px; font-weight: normal; padding: 4px 2px}" +
    ".anbt_favpanel:hover {color: #d9534f; cursor:pointer}" +
    ".anbt_favedpanel {color: #d9534f; border-color: #d9534f}" +
    ".anbt_replaypanel {top: 80px; font-weight: normal; padding: 4px 2px}" +
    ".anbt_replaypanel:hover {color: #8af; text-decoration: none}" +
    ".gamepanel, .thumbpanel, .comment-body {word-wrap: break-word}" +
    ".comment-body img {max-width: 100%}" +
    ""
  );
  // Enhance menu for higher resolutions
  var p = $("#open-left").parent();
  //p.prepend('<a href="/" class="gpe-wide" style="float:left; margin-right:8px"><img src="/img/logo-sm.png" width="166" height="43" alt="drawception" /></a>');
  p.append('<span class="gpe-wide gpe-spacer">&nbsp</span>');
  p.append('<a href="/sandbox/" title="Sandbox" class="gpe-wide gpe-btn btn btn-menu navbar-btn navbar-user-item" style="background:#5A5"><span class="glyphicon glyphicon-edit" style="color:#BFB" /></a>');
  p.append('<a href="/browse/all-games/" title="Browse Games" class="gpe-wide gpe-btn btn btn-menu navbar-btn navbar-user-item"><span class="glyphicon glyphicon-folder-open" /></a>');
  p.append('<a href="/contests/" title="Contests" class="gpe-wide gpe-btn btn btn-menu navbar-btn navbar-user-item"><span class="glyphicon glyphicon-tower" /></a>');
  p.append('<a href="javascript:toggleLight()" title="Toggle light" class="gpe-wide gpe-btn btn btn-menu navbar-btn navbar-user-item" style="background:#AA5"><span class="glyphicon glyphicon-eye-open" style="color:#FFB" /></a>');
  p.append('<a href="/leaderboard/" title="Leaderboards" class="gpe-wide gpe-btn btn btn-menu navbar-btn navbar-user-item"><span class="glyphicon glyphicon-fire" /></a>');
  p.append('<a href="/faq/" title="FAQ" class="gpe-wide gpe-btn btn btn-menu navbar-btn navbar-user-item"><span class="glyphicon glyphicon-info-sign" /></a>');
  p.append('<a href="/forums/" title="Forums" class="gpe-wide gpe-btn btn btn-menu navbar-btn navbar-user-item" style="background:#55A"><span class="glyphicon glyphicon-comment" style="color:#BBF" /></a>');
  p.append('<a href="/search/" title="Search" class="gpe-wide gpe-btn btn btn-menu navbar-btn navbar-user-item"><span class="glyphicon glyphicon-search" /></a>');
  p.append('<a id="menusettings" href="/settings/" title="Settings" class="gpe-wide gpe-btn btn btn-menu navbar-btn navbar-user-item"><span class="glyphicon glyphicon-cog" /></a>');
  p.append('<a href="/logout" title="Log Out" class="gpe-wide gpe-btn btn btn-menu navbar-btn navbar-user-item" style="background:#A55"><span class="glyphicon glyphicon-log-out" style="color:#FBB" /></a>');

  // Tell to look at settings if freshly installed
  var newSettingsSeen = localStorage.getItem("anbt_newSettingsSeen");
  if (!newSettingsSeen && $(window).width() > 974)
  {
    var freshSettingsHint = "Thanks for choosing ANBT! Script settings are on the settings page.";
    if (!options.newCanvas)
    {
      freshSettingsHint += " Don't forget to try the new canvas!";
    }
    $("#menusettings").attr("title", "");
    $("#menusettings").tooltip({container: "body", placement: "bottom", title: freshSettingsHint});
    $("#menusettings").tooltip("show");
    var freshHintRemove = function()
    {
      localStorage.setItem("anbt_newSettingsSeen", 1);
    };
    $("#menusettings").on('click', freshHintRemove);
    $("#menusettings").on('mousedown', freshHintRemove);
    $("#menusettings").on('touchstart', freshHintRemove);
  }
  // Make new notifications actually discernable from the old ones
  var num = $("#user-notify-count").text().trim();
  GM_addStyle(
    "#user-notify-list .list-group .list-group-item .glyphicon {color: #888}" +
    "#user-notify-list .list-group .list-group-item:nth-child(-n+" + num + ") .glyphicon {color: #2F5}" +
    "a.wrong-order {color: #F99} div.comment-holder:target {background-color: #DFD}" +
    ".comment-new .text-muted:after {content: 'New'; color: #2F5; font-weight: bold; background-color: #183; border-radius: 9px; display: inline-block; padding: 0px 6px; margin-left: 10px;}"
  );

  // Fix usability in Opera and old Firefox browsers
  if (prestoOpera || firefox4OrOlder)
  {
    $(".snap-drawers").remove();
    GM_addStyle(
      ".snap-content {position: static !important}" +
      "a.list-group-item:focus {background-color: #555 !important}" // CSS bug on the site
    );
    // Remake the notification list into a modal dialog
    $("#user-notify-list").remove();
    $(document.body).append(
      '<div class="modal fade" id="myNotifications" tabindex="-1" role="dialog" aria-labelledby="myModalLabel" aria-hidden="true">' +
        '<div class="modal-dialog">' +
          '<div class="modal-content">' +
            '<div class="modal-header">' +
              '<button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>' +
              '<h4 class="modal-title">Notifications</h4>' +
            '</div>' +
            '<div id="user-notify-list" class="modal-body" style="background-color: #333">' + // Ugly hack to make background visible
            '</div>' +
            '<div class="modal-footer">' +
              '<button type="button" class="btn btn-default" data-dismiss="modal">Close</button>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>'
    );
    $("#open-right").attr({"data-toggle": "modal", "href": "#myNotifications"});
  }
  // Restore scroll position
  $("html").scrollTop(scroll);

  // Show an error if it occurs instead of "loading forever"
  window.getNotifications = function()
  {
    if (!notificationsOpened)
    {
      $("#user-notify-list").html('<img src="/img/loading.gif" alt="Loading...."/>');
      $.ajax(
        {
          url: "/notification/view/",
          cache: false,
          error: function(e)
          {
            $("#user-notify-list").html(e.statusText);
            notificationsOpened = true;
          },
          success: function (e)
          {
            $("#user-notify-list").html(e);
            $("#user-notify-count").text("0");
            notificationsOpened = true;
          }
        }
      );
    }
  };

  var jsVersion, cssVersion, versionDisplay;
  try
  {
    jsVersion = $('script[src*="script-ck.js"]').attr("src").match(/\?v=([^&]+)/)[1];
    cssVersion = $('head link[href*="main.css"]').attr("href").match(/\?v=([^&]+)/)[1];
    versionDisplay = "ANBT v" + SCRIPT_VERSION + " | js v" + jsVersion + ", css v" + cssVersion;
    if (jsVersion != "4.27" || cssVersion != "3.21") versionDisplay += " | woah, site got updated!";
  } catch(e)
  {
    versionDisplay = "ANBT v" + SCRIPT_VERSION + " | js/css unknown";
  }
  $("#navbar-user").append('<div id="anbtver">' + versionDisplay + '</div>');

  $(".footer-main .list-unstyled").eq(0).append('<li><a href="/forums/general/11830/anbt-script/?page=20">ANBT script</a></li>');
  $(".footer-main .list-unstyled").eq(1).append('<li><a href="http://drawception.wikia.com/">Wiki</a></li>');
  $(".footer-main .list-unstyled").eq(2).append('<li><a href="http://chat.grompe.org.ru/#drawception">Chat</a> (<a href="http://cgiirc.synirc.net/?chan=%23drawception">IRC</a>)</li>');
  
  if (options.newCanvas)
  {
    var directToNewSandbox, directToNewPlay;
    {
      directToNewSandbox = function(e)
      {
        if (e.which === 2) return;
        e.preventDefault();
        setupNewCanvas(true, this.href);
      };
      directToNewPlay = function(e)
      {
        if (e.which === 2) return;
        e.preventDefault();
        setupNewCanvas(false, this.href);
      };
    }
    $('a[href^="/sandbox/"]').click(directToNewSandbox);
    $('a[href="/play/"]').click(directToNewPlay);
  }
  window.onbeforeunload = function() {if ($("#drawingCanvas").length && painted) return "Did you finish drawing?";};

  if (options.loadChat)
  {
    $.ajax(
      {
        dataType: "script",
        cache: true,
        url: "http://chat.grompe.org.ru/jappix-mini.js"
      }
    ).success(function()
    {
      MINI_GROUPCHATS = ["drawception"];
      MINI_GROUPCHATS_NOCLOSE = ["drawception@chat.grompe.org.ru"];
      MINI_NICKNAME = username;
      MINI_RESOURCE = userid + "/jm" + Math.random().toString(36).slice(1, 5);
      launchMini(Boolean(options.chatAutoConnect), true, "ip");
    });
  }
}

var mark = document.createElement("b");
mark.id = "_anbt_";
mark.style = "display:none";
document.body.appendChild(mark);

pageEnhancements();

} // wrapped

// From http://userstyles.org/styles/93911/dark-gray-style-for-drawception-com
localStorage.setItem("gpe_darkCSS",
  ("a{color:#77c0ff$}.wrapper{~#444$}#nav-drag{~#353535$}.btn-default{~#7f7f7f$;border-bottom-color:#666$;border-left-color:#666$;border-right-color:#666$;border-top-color:#666$;color:#CCC$}" +
  ".btn-default:hover,.btn-default:focus,.btn-default:active,.btn-default.active,.open .dropdown-toggle.btn-default{~#757575$;border-bottom-color:#565656$;border-left-color:#565656$;border-right-color:#565656$;border-top-color:#565656$;color:#DDD$}" +
  ".btn-success{~#2e2e2e$;border-bottom-color:#262626$;border-left-color:#262626$;border-right-color:#262626$;border-top-color:#262626$;color:#CCC$}" +
  ".btn-success:hover,.btn-success:focus,.btn-success:active,.btn-success.active,.open .dropdown-toggle.btn-success{~#232323$;border-bottom-color:#1c1c1c$;border-left-color:#1c1c1c$;border-right-color:#1c1c1c$;border-top-color:#1c1c1c$;color:#DDD$}" +
  ".btn-primary{~#212184$;border-bottom-color:#1a1a68$;border-left-color:#1a1a68$;border-right-color:#1a1a68$;border-top-color:#1a1a68$;color:#CCC$}" +
  ".btn-primary:hover,.btn-primary:focus,.btn-primary:active,.btn-primary.active,.open .dropdown-toggle.btn-primary{~#191964$;border-bottom-color:#141450$;border-left-color:#141450$;border-right-color:#141450$;border-top-color:#141450$;color:#DDD$}" +
  ".btn-info{~#2d8787$;border-bottom-color:#236969$;border-left-color:#236969$;border-right-color:#236969$;border-top-color:#236969$;color:#CCC$}" +
  ".btn-info:hover,.btn-info:focus,.btn-info:active,.btn-info.active,.open .dropdown-toggle.btn-info{~#1c5454$;border-bottom-color:#133939$;border-left-color:#133939$;border-right-color:#133939$;border-top-color:#133939$;color:#DDD$}" +
  ".navbar-default .navbar-toggle:hover,.navbar-default .navbar-toggle:focus{~#3b3b3b$}.navbar-toggle{~#393939$}.navbar{border-bottom:1px solid #000$}.forum-thread-starter,.breadcrumb,.regForm{~#555$}" +
  ".form-control{~#555$;border:1px solid #000$;color:#EEE$}code,pre{~#656$;color:#FCC$}body{color:#EEE$}footer{~#333$;border-top:1px solid #000$}" +
  ".pagination>li>a:hover,.pagination>li>span:hover,.pagination>li>a:focus,.pagination>li>span:focus{~#444$}.pagination>li>a,.pagination>li>span{~#555$;border:1px solid #000$}" +
  ".pagination>.active>a,.pagination>.active>span,.pagination>.active>a:hover,.pagination>.active>span:hover,.pagination>.active>a:focus,.pagination>.active>span:focus{~#666$;border-top:1px solid #444$;border-bottom:1px solid #444$}" +
  ".drawingForm{~#555$}.well{~#666$;border:1px solid #333$}#timeleft{color:#AAA$}legend{border-bottom:1px solid #000$}.thumbnail{~#555$}.thumbpanel img{~#fffdc9$}.panel-number,.modal-content,.profile-user-header{~#555$}" +
  "#commentForm{~#555$;border:1px solid #000$}.comment-holder,.modal-header,.nav-tabs{border-bottom:1px solid #000$}hr,.modal-footer{border-top:1px solid #000$}" +
  ".store-item{background:#666$;~-moz-linear-gradient(top,#666 0,#333 100%)$;~-webkit-gradient(linear,left top,left bottom,color-stop(0,#666),color-stop(100%,#333))$;~-webkit-linear-gradient(top,#666 0,#333 100%)$;~-o-linear-gradient(top,#666 0,#333 100%)$;~-ms-linear-gradient(top,#666 0,#333 100%)$;~linear-gradient(to bottom,#666 0,#333 100%)$;border:1px solid #222$}" +
  ".store-item:hover{border:1px solid #000$}.store-item-title{~#222$;color:#DDD$}.store-title-link{color:#DDD$}.profile-award{~#222$}.profile-award-unlocked{~#888$}.progress-bar{color:#CCC$;~#214565$}.progress{~#333$}" +
  ".progress-striped .progress-bar{background-image:-webkit-gradient(linear,0 100%,100% 0,color-stop(.25,rgba(0,0,0,0.15)),color-stop(.25,transparent),color-stop(.5,transparent),color-stop(.5,rgba(0,0,0,0.15)),color-stop(.75,rgba(0,0,0,0.15)),color-stop(.75,transparent),to(transparent))$;background-image:-webkit-linear-gradient(45deg,rgba(0,0,0,0.15) 25%,transparent 25%,transparent 50%,rgba(0,0,0,0.15) 50%,rgba(0,0,0,0.15) 75%,transparent 75%,transparent)$;background-image:-moz-linear-gradient(45deg,rgba(0,0,0,0.15) 25%,transparent 25%,transparent 50%,rgba(0,0,0,0.15) 50%,rgba(0,0,0,0.15) 75%,transparent 75%,transparent)$;background-image:linear-gradient(45deg,rgba(0,0,0,0.15) 25%,transparent 25%,transparent 50%,rgba(0,0,0,0.15) 50%,rgba(0,0,0,0.15) 75%,transparent 75%,transparent)$}" +
  ".progress-bar-success{~#363$}.progress-bar-info{~#367$}.progress-bar-warning{~#863$}.progress-bar-danger{~#733$}" +
  ".nav-tabs>li.active>a,.nav-tabs>li.active>a:hover,.nav-tabs>li.active>a:focus{color:#DDD$;~#555$;border:1px solid #222$}.nav>li>a:hover,.nav>li>a:focus{~#333$;border-bottom-color:#222$;border-left-color:#111$;border-right-color:#111$;border-top-color:#111$}" +
  ".nav>li.disabled>a,.nav>li.disabled>a:hover,.nav>li.disabled>a:focus{color:#555$}.table-striped>tbody>tr:nth-child(2n+1)>td,.table-striped>tbody>tr:nth-child(2n+1)>th{~#333$}" +
  ".table-hover>tbody>tr:hover>td,.table-hover>tbody>tr:hover>th{~#555$}.table thead>tr>th,.table tbody>tr>th,.table tfoot>tr>th,.table thead>tr>td,.table tbody>tr>td,.table tfoot>tr>td{border-top:1px solid #333$}.news-alert{~#555$;border:2px solid #444$}" +
  ".btn-menu{~#2e2e2e$}.btn-menu:hover{~#232323$}.btn-yellow{~#8a874e$}.btn-yellow:hover{~#747034$}" +
  "a.label{color:#fff$}a.text-muted{color:#999$}a.wrong-order{color:#F99$}div.comment-holder:target{~#454$}" +
  ".popover{~#777$}.popover-title{~#666$;border-bottom:1px solid #444$}.popover.top .arrow:after{border-top-color:#777$}.popover.right .arrow:after{border-right-color:#777$}.popover.bottom .arrow:after{border-bottom-color:#777$}.popover.left .arrow:after{border-left-color:#777$}" +
  ".bg-lifesupport{~#444$}body{~#555$}.snap-content{~#333$}" +
  ".gsc-control-cse{~#444$;border-color:#333$}.gsc-above-wrapper-area,.gsc-result{border:none$}.gs-snippet{color:#AAA$}.gs-visibleUrl{color:#8A8$}a.gs-title b,.gs-visibleUrl b{color:#EEE$}.gsc-adBlock{display:none$}" +
  "#jappix_mini a{color:#000$}" +
  "a:visited.thumbnail{border-color:#555$}" +
  // We have entered specificity hell...
  "a.anbt_replaypanel:hover{color:#8af$}" +
  // Some lamey compression method!
  "").replace(/~/g, "background-color:").replace(/\$/g, " !important")
);

if (parseInt(localStorage.getItem("gpe_inDark"), 10) == 1)
{
  var css = document.createElement("style");
  css.id = "darkgraycss";
  css.type = "text/css";
  css.appendChild(document.createTextNode(localStorage.getItem("gpe_darkCSS")));
  if (document.head)
  {
    document.head.appendChild(css);
  } else {
    var darkLoad = setInterval(
      function()
      {
        if (!document.head) return;
        document.head.appendChild(css);
        clearInterval(darkLoad);
      },
      100
    );
  }
}

function anbtLoad()
{
  if (document.getElementById("_anbt_")) return;
  var script = document.createElement("script");
  script.textContent = "(" + wrapped.toString() + ")();";
  document.body.appendChild(script);
  return true;
}

if (document && document.body)
{
  anbtLoad();
  if (window.opera && parseInt(localStorage.getItem("gpe_operaWarning"), 10) != 1)
  {
    var w = document.createElement("h2");
    w.innerHTML = "ANBT speaking:<br/>Rename your script file so it doesn't contain \".user.\" part for smoother loading!<br/>This warning is only shown once.";
    var m = document.getElementById("main");
    m.insertBefore(w, m.firstChild);
    localStorage.setItem("gpe_operaWarning", 1);
  }
}
document.addEventListener("DOMContentLoaded", anbtLoad, false);
