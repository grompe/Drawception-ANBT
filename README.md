Drawception ANBT [![Public domain](http://i.creativecommons.org/p/zero/1.0/88x31.png)](http://creativecommons.org/publicdomain/zero/1.0/)
================

A userscript to make Drawception.com better: more drawing tools, tablet support, sandbox with palettes and uploading to imgur, like all, quick menu buttons with old browser support, and other enhancements.

[**Direct script link**](https://raw.github.com/grompe/Drawception-ANBT/master/drawception-anbt.user.js) (use to install/update manually, or "save as...")

[New canvas with recording and playback, standalone version](http://grompe.org.ru/drawit/)

[ANBT script discussion at Drawception.com forum](http://drawception.com/forums/general/11830/anbt-script/)

[Chat about the script and the site](http://chat.grompe.org.ru/#drawception)

## HOW TO USE

- Chrome/Iron:
  - add the script in [Tampermonkey extension](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)
  - or open URL: chrome://extensions then drag and drop the .user.js file on it
- Firefox: add the script in [Greasemonkey add-on](https://addons.mozilla.org/en-US/firefox/addon/greasemonkey/)
- Firefox for Android: add the script in [User|Unified Script Injector](https://addons.mozilla.org/en-us/android/addon/userunified-script-injector/)
- Opera 12: add the script in "site properties"
- Opera 15+: add the script in [Violentmonkey add-on](https://addons.opera.com/en/extensions/details/violent-monkey/?display=en)
- Maxthon: add the script in [Violentmonkey add-on](http://extension.maxthon.com/detail/index.php?view_id=1680)
- Mobile browsers / other / single use:
  - create a bookmark with the following URL:

    `javascript:void($.ajax({dataType:"script",cache:!0,url:"//rawgit.com/grompe/Drawception-ANBT/master/drawception-anbt.user.js"}))`
    
    and follow it while being on drawception.com site; if that doesn't work, try pasting it in the address bar.

After installing script management add-on, just click on the [**Direct script link**](https://raw.github.com/grompe/Drawception-ANBT/master/drawception-anbt.user.js).


## FEATURES

General:

- Menu buttons in the header for easier access
- No temptation to judge
- An embedded chat (http://chat.grompe.org.ru/#drawception)
- Automatically retry failed requests to reduce annoying error messages

Canvas:

- Wacom tablet smooth pressure (old canvas only) and eraser support; doesn't conflict with mouse
- Secondary color, used with right mouse button; palette right-clicking
- Alt+click picks a color from the canvas
- Brush cursor
- Current colors indicator
- 0..9 and Shift+0..Shift+9 selects primary color
- X swaps primary and secondary colors
- B selects last used color as primary
- E selects eraser
- *[* *]* and - = changes brush sizes
- Shift+F fills with the current color
- Confirm closing a page if it has a canvas and is painted on
- Don't confirm clearing, but allow to undo it

Sandbox:

- Add drawing time indicator
- Upload directly to imgur

View game:

- Add reverse panels button
- Add "like all" button
- Track new comments
- Show when the game was started
- Ability to favorite panels

Play:

- Much faster skipping
- Play modes for those who only caption or only draw
- Enter pressed in caption mode submits the caption
- Ability to bookmark games without participating
- Show your panel position and track changes in unfinished games list

Forum:

- Better-looking timestamps with correct timezone
- Clickable drawing panels
- Clickable links
- Show and highlight direct links to forum posts

## CHANGELOG

See https://raw.github.com/grompe/Drawception-ANBT/master/CHANGELOG.txt
