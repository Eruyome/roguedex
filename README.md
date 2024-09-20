# Rogue Dex Browser Extension

## Description
Rogue Dex is a browser extension that connects to Pokerogue and uses PokeAPI to show information about Pokemon weaknesses, immunities, and resistances for each round.

## Features
- Displays Pokemon weaknesses, immunities, and resistances in real-time during gameplay.
- Lots of more detailed and varied information about enemy and ally pokemon (level, generation, region variant, shiny, moves, fusion details, luck, friendship exp and more).
- Comparisons of the enemy pokemons IVs and your starter pokemons to show whether an improvement can be gained via catching.
- Three different UI modes: Sidebar + Bottompanel (most detailed), Overlay cards (movable), Minified Overlay cards.
- Customizable via settings menu.
- DOES NOT show anything about enemy pokemon that could be used to strategize against them other than their type effectivenesses.

## Installation
1. Default
    - ~~Use the official extension from the store.~~ (currently not available)

2. Alternative
    - Download the zip-archives from the `releases` page.
    - OR clone this repository to your local machine.

2. Install the extension  
If you're on mobile you have to use [Firefox](https://www.mozilla.org/en-US/firefox/browsers/mobile/android/) or [Kiwi](https://kiwibrowser.com/) (for chrome extension) browser. There might be alternatives.
    1. [Default]
    2. [Alternative] Load the extension in developer mode in your browser.
	    - `Load unpacked` -> select `src` folder of this repository if using development code, or the extracted contents of the release zips if using distribution code.
        - Mobile browsers might need to load the zip archives instead.
3. Launch Pokerogue and start playing.
4. Make sure that your browser shows the RogueDex extension icon in your browser extension area (top left). If not, enable it (pin the extension). Clicking this icon with the Pokerogue website active will open the extension settings menu.
    - If you're on mobile you might not be able to pin the extension, instead open the browser settings menu/dropdown  and scroll down the list. If the extension is installed and you're on the pokerogue webpage, you should be able to find the extension listed here. Click/tap on it to open the settings in a new tab.

### Usage
- Start a new game or load a saved game in Pokerogue.
- The extension will display Pokemon information for each round.
- Use the data to strategize your gameplay effectively.

## Contribution
Feel free to contribute to this project by forking the repository, making changes, and submitting pull requests.

### 💻 Environment Setup
#### Prerequisites
- node: 20.13.1
- npm: [how to install](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm)

#### Note
Technically it's not neccessary to use the node/npm environment for developing unless you want to change the styles, in which case you need some way to convert sass/scss files to css. The pre-commit hooks (if enabled) also need the npm install. It is greatly appreciated to use it though for code consistency and quality.

#### Running Locally
1. Clone the repo and in the root directory run `npm install` in your terminal.
    - *if you run into any errors, reach out in discord*
2. Run `npm run start` or `npm run watch` to have style and code files be linted (and sass be converted to css). The sass conversion is the only requirement for development (IF you change the styles), it can be run seperately with `npm run watch-styles`.
3. Husky will run pre-commit hooks if enabled, read more: https://typicode.github.io/husky/how-to.html, currently disabled.

#### Linting
This project is using ESLint and Prettier as code linters and formatters. They will run automatically during the pre-commit hook but if you would like to manually run them, use the `npm run process-src-files` script. As mentioned above, there are watch tasks for this (`npm run watch`. `npm run watch-code`).

#### Code packaging
- Using the `npm run package` or `npm run build-dist` commands, you can create browser specific versions of the `src` folder code and styles (chrome and firefox), including zip-archives. 
- These projects will be linted and formatted, have the correct manifest files added etc. 
- These folder and archives can be used to publish  the extension or for easier testing in different browsers. 
- You will find these files under the `dist` directory. 
- Should something go wrong during the packaging process, there might be a `temp` folder left int he main directory, although it should be removed together with the `dist` folder, which likely contains incomplete project contents. You can run `npx gulp build-dist --skip-cleanup` to keep these files for inspection.

### Other Tasks
The `package.json` file has a bunch of other tasks available in the `scripts` section for more specific uses of those linting and formatting packages.

### JSDOC
Using the `npm run jsdoc` command you can create a [JSDOC](https://github.com/jsdoc/jsdoc) folder (`jsdoc-out`). This folder will not be added to git.

## Credits
- [PokeAPI](https://github.com/PokeAPI/pokeapi) for various pokemon-related assets.
- [Bulbapedia](https://bulbapedia.bulbagarden.net/wiki/Main_Page) for various pokemon-related assets.
- Galaxy Holo image from [aschefield101](https://www.deviantart.com/aschefield101/art/HoloSheet-2012-313543843).

## Policy
No user data is transferred to any external servers by this extension. All the traffic is analyzed on each browser only and there is no server component that acts upon this data.

## Contributors

- [Eruyome](https://github.com/Eruyome)
- [roguedex-dev](https://github.com/roguedex-dev)
- [devingearing](https://github.com/devingearing)

## License

This project is licensed under the [MIT License](LICENSE).