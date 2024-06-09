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
				"UIController": true,
				"XMLHttpRequest": "readonly",
				"Utils": true
			}
		}
	},
	{
		ignores: ["src/libs/*"]
	}
]
