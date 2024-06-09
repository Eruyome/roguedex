# Rogue Dex Browser Extension

## Description
Rogue Dex is a browser extension that connects to Pokerogue and uses PokeAPI to show information about Pokemon weaknesses, immunities, and resistances for each round.

## Features
- Displays Pokemon weaknesses, immunities, and resistances in real-time during gameplay.
- Enhances the Pokerogue experience by providing valuable Pokemon information.

## Installation
- Clone this repository to your local machine.
- Load the extension in developer mode in your browser.
	- `Load unpacked` -> select `src` folder of this repository if using development code, or `dist` if using distribution code (if available).
- Launch Pokerogue and start playing to see Pokemon data in action.

## Usage
- Start a new game or load a saved game in Pokerogue.
- The extension will display Pokemon information for each round.
- Use the data to strategize your gameplay effectively.

## Development
- After cloning the repository, run `npm install` in a console/terminal (after navigating to the repo directory).
- Husky will run pre-commit hooks if enabled, read more: https://typicode.github.io/husky/how-to.html, currently disabled.
- `Package.json` has a bunch of scripts to lint and format code, css and html files. These can be run by a pre-commit hook or manually, for example `npm run <script name>`.
- Eslint: for linting javascript code, config file in root dir.
- Stylelint: for linting stylesheets, config file in root dir.
- Prettier: for beautifying / formatting js, css and html, config file in root dir.
- Development files should be in `src` directory.
- Distribution code and zip files can be created with the `npm run package` script, output will be in the `dist` directory. This includes file minifying.
- `npm run build-test` can be used to build the dist files while skipping some processes (terser, babel).

## Contribution
Feel free to contribute to this project by forking the repository, making changes, and submitting pull requests.

## Credits
[PokeAPI](https://github.com/PokeAPI/pokeapi) for various pokemon-related assets 

## Policy
No user data is transferred to any external servers by this extension. All the traffic is analyzed on each browser only and there is no server component that acts upon this data.
