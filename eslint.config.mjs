import { FlatCompat } from '@eslint/eslintrc'
import { fixupConfigRules } from '@eslint/compat'
import eslintConfigPrettier from 'eslint-config-prettier'

const compat = new FlatCompat()

export default [
    ...fixupConfigRules(
        compat.config({
            extends: ['standard'],
        })
    ),
	eslintConfigPrettier,
    {
        rules: {
            'no-undef': 'warn',
            'no-tabs': 'warn',
            'no-unused-vars': ['warn', { 'vars': 'all', 'args': 'after-used' }],
            'no-mixed-spaces-and-tabs': 'warn',
            eqeqeq: 'warn',
        }
    },
	{
		languageOptions: {
			globals: {
				"browser": true,
				"es2021": true,
				"node": true,
				"webextensions": true,
				"chrome": true,
				"CryptoJS": true,
				"UtilsClass": true,
				"PokemonMapperClass": true,
				"LocalStorageClass": true,
				"PokemonIconDrawer": true,
				"PokemonMapperClass": true,
				"UIController": true,
				"XMLHttpRequest": "readonly",
				"MutationObserver": "readonly",
				"ResizeObserver": "readonly",
				"Image": "readonly",
				"DOMParser": "readonly",
				"FileReader": "readonly",
				"Utils": true,
				"html": "readonly",
                "render": "readonly",
                "ref": "readonly",
                "unsafeHTML": "readonly",
                "unsafeSVG": "readonly",
                "templateContent": "readonly",
                "asyncAppend": "readonly",
                "asyncReplace": "readonly",
                "until": "readonly",
                "live": "readonly",
                "guard": "readonly",
                "cache": "readonly",
                "keyed": "readonly",
                "ifDefined": "readonly",
                "range": "readonly",
                "repeat": "readonly",
                "join": "readonly",
                "map": "readonly",
                "choose": "readonly",
                "when": "readonly",
                "classMap": "readonly",
                "styleMap": "readonly",
				"browserApi": "readonly",
			}
		}
	},
	{
		ignores: ["src/libs/*"]
	}
]
