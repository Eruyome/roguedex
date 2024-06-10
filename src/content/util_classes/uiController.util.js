/**
 * @fileoverview UIController class manages UI interactions by binding mouse click, keyboard hotkey, and gamepad button events,
 * and triggering an external function when these events occur.
 * @file 'src/content/util_classes/uIController.utils.js'
 * @class UIController
 * 
 * Example usages:
 * // Initialize a UIController with only keyboard and gamepad bindings
 * const uiController1 = new UIController(externalFunction, '', { bindMouse: false, bindKeyboard: true, bindGamepad: true });
 * uiController1.setBindings();
 * 
 * // Initialize a UIController with only mouse binding
 * const uiController2 = new UIController(externalFunction, '#myElement', { bindMouse: true, bindKeyboard: false, bindGamepad: false });
 * 
 * // Attempt to set the same hotkey or button combination for another instance, which should log an error
 * const uiController3 = new UIController(externalFunction, '', { bindMouse: false, bindKeyboard: true, bindGamepad: true });
 * uiController3.setBindings(null, ['ShiftLeft', 'ControlLeft', 'KeyA'], [0, 1]); // This should log an error
 * 
 * // Initialize a UIController with all bindings
 * const uiController4 = new UIController(externalFunction, '#myElement', { bindMouse: true, bindKeyboard: true, bindGamepad: true });
 * uiController4.setBindings(document.getElementById('myElement'), ['AltLeft', 'KeyB', 'KeyC'], [2, 3]); // Assuming these are valid button indices * 
 */

class UIController {    // eslint-disable-line no-unused-vars
     /**
     * Set of assigned keyboard hotkeys and gamepad button combinations to ensure uniqueness.
     */
    static assignedKeyboardHotkeys = new Set();
    static assignedGamepadButtons = new Set();

    /**
     * Constructs a new UIController instance.
     * @param {function} externalFunction The external function to trigger on UI events.
     * @param {HTMLElement} mouseElement The DOM element reference to bind mouse click event (or css selector pointing to it).
     * @param {object} options Options for binding UI events (default: all true).
     */
    constructor(externalFunction, mouseElement, options = {}) {
        if (typeof externalFunction !== 'function') {
            throw new Error('An external function must be provided');
        }

        this.externalFunction = externalFunction;
        this.pressedKeys = new Set();
        this.gamepadButtonsPressed = new Set();
        this.keyboardCombination = [];
        this.gamepadCombination = [];        
        this.validKeyCodes = new Set([
            'ShiftLeft', 'ShiftRight', 'ControlLeft', 'ControlRight',
            'AltLeft', 'AltRight', 'MetaLeft', 'MetaRight', 'KeyA', 'KeyB', 'KeyC',
            // Add all other valid key codes here...
            // https://www.freecodecamp.org/news/javascript-keycode-list-keypress-event-key-codes/
        ]);

        const { bindMouse = true, bindKeyboard = true, bindGamepad = true } = options;

        if (bindMouse || bindKeyboard || bindGamepad) {
            this.init(bindMouse, bindKeyboard, bindGamepad, mouseElement);
        } else {
            throw new Error('At least one binding option must be true');
        }
    }

    /**
     * Initializes the UIController by binding specified events.
     * @param {boolean} bindMouse Whether to bind mouse click event.
     * @param {boolean} bindKeyboard Whether to bind keyboard hotkey event.
     * @param {boolean} bindGamepad Whether to bind gamepad button event.
     * @param {HTMLElement} mouseElement The DOM element reference to bind mouse click event (or css selector pointing to it).
     */
    init(bindMouse, bindKeyboard, bindGamepad, mouseElement) {
        if (bindMouse) {
            this.setMouseElement(mouseElement);
            this.bindMouseClick();
        }
        if (bindKeyboard) {
            this.bindKeyboardHotkey();
        }
        if (bindGamepad) {
            this.bindGamepadButtons();
        }
    }

    /**
     * Binds mouse click event to a DOM element.
     */
    bindMouseClick() {
        if (!this.mouseElement) {
            throw new Error('A DOM element reference or css selector string must be provided for mouse click binding');
        }
        this.mouseElement.addEventListener('click', this.handleMouseClick.bind(this));
    }

    /**
     * Handles mouse click event.
     * @param {MouseEvent} event The mouse click event object.
     */
    handleMouseClick(event) {
        // console.log('Mouse clicked:', event);
        this.externalFunction('mouse', event);
    }

    /**
     * Sets the DOM element to bind mouse click event.
     * @param {HTMLElement} element The DOM element reference to bind mouse click event (or css selector pointing to it).
     */
    setMouseElement(element) {
        if (typeof element === 'string') {
            const tempElement = document.querySelector(element);
            if (tempElement === null) {
                throw new Error("Provided DOM element doesn't exist. Selector (string): ", element);
            } else {
                this.mouseElement = tempElement;
            }            
        } else if (!!element && !!element.nodeType) {
            throw new Error("Provided DOM element doesn't exist. Element: ", element);
        } else {
            this.mouseElement = element;
        }
    }

    /**
     * Binds keyboard hotkey events.
     */
    bindKeyboardHotkey() {
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
        document.addEventListener('keyup', this.handleKeyUp.bind(this));
    }

    /**
     * Handles keyboard key down event.
     * @param {KeyboardEvent} event The key down event object.
     */
    handleKeyDown(event) {
        this.pressedKeys.add(event.code);
        if (this.pressedKeys.size >= 3) {
            this.checkKeyboardCombination();
        }
    }

    /**
     * Handles keyboard key up event.
     * @param {KeyboardEvent} event The key up event object.
     */
    handleKeyUp(event) {
        this.pressedKeys.delete(event.code);
    }

    /**
     * Checks if the keyboard combination is pressed.
     */
    checkKeyboardCombination() {
        if (this.keyboardCombination.every(code => this.pressedKeys.has(code))) {
            console.log('Keyboard combination pressed:', this.keyboardCombination);
            this.externalFunction('keyboard', this.keyboardCombination);
        }
    }

    /**
     * Binds gamepad button events.
     */
    bindGamepadButtons() {
        window.addEventListener("gamepadconnected", this.handleGamepadConnected.bind(this));
        window.addEventListener("gamepaddisconnected", this.handleGamepadDisconnected.bind(this));
        this.pollGamepads();
    }

    /**
     * Handles gamepad connected event.
     * @param {GamepadEvent} event The gamepad connected event object.
     */
    handleGamepadConnected(event) {
        console.log('Gamepad connected:', event.gamepad);
    }

    /**
     * Handles gamepad disconnected event.
     * @param {GamepadEvent} event The gamepad disconnected event object.
     */
    handleGamepadDisconnected(event) {
        console.log('Gamepad disconnected:', event.gamepad);
    }

    /**
     * Polls gamepad state to detect button presses.
     */
    pollGamepads() {
        const checkGamepads = () => {
            const gamepads = navigator.getGamepads();
            for (const gamepad of gamepads) {
                if (gamepad) {
                    gamepad.buttons.forEach((button, index) => {
                        if (button.pressed) {
                            this.gamepadButtonsPressed.add(index);
                        } else {
                            this.gamepadButtonsPressed.delete(index);
                        }
                    });
                    if (this.gamepadButtonsPressed.size >= 2) {
                        this.checkGamepadCombination();
                    }
                }
            }
            window.requestAnimationFrame(checkGamepads);
        };
        checkGamepads();
    }

    /**
     * Checks if the gamepad combination is pressed.
     */
    checkGamepadCombination() {
        if (this.gamepadCombination.every(index => this.gamepadButtonsPressed.has(index))) {
            console.log('Gamepad combination pressed:', this.gamepadCombination);
            this.externalFunction('gamepad', this.gamepadCombination);
        }
    }

    /**
     * Checks if the provided keyboard combination is unique.
     * @param {string[]} combination The keyboard combination to check.
     * @returns {boolean} True if the combination is unique, otherwise false.
     */
    static isUniqueKeyboardHotkey(combination) {
        const key = combination.sort().join(',');
        return !UIController.assignedKeyboardHotkeys.has(key);
    }

     /**
     * Checks if the provided gamepad combination is unique.
     * @param {number[]} combination The gamepad combination to check.
     * @returns {boolean} True if the combination is unique, otherwise false.
     */
    static isUniqueGamepadCombination(combination) {
        const key = combination.sort().join(',');
        return !UIController.assignedGamepadButtons.has(key);
    }

/**
     * Sets the keyboard and gamepad bindings dynamically.
     * @param {string[]} keyboardCombination The keyboard combination to bind.
     * @param {number[]} gamepadCombination The gamepad combination to bind.
     */
    setBindings(keyboardCombination, gamepadCombination) {
        if (!keyboardCombination && !gamepadCombination) {
            throw new Error('At least one binding must be provided');
        }

        if (keyboardCombination) {
            this.setKeyboardHotkey(keyboardCombination);
        }

        if (gamepadCombination) {
            this.setGamepadButtons(gamepadCombination);
        }
    }

    /**
     * Sets the keyboard hotkey combination dynamically.
     * @param {string[]} combination The keyboard combination to set.
     */
    setKeyboardHotkey(combination) {
        // Check if the combination is valid and unique
        if (combination.every(key => this.validKeyCodes.has(key))) {
            // Code to set the keyboard combination and handle uniqueness
        } else {
            console.error('Invalid keyboard combination:', combination);
        }
    }

    /**
     * Sets the gamepad button combination dynamically.
     * @param {number[]} combination The gamepad combination to set.
     */
    setGamepadButtons(combination) {
        // Check if the combination is valid and unique
        if (combination.every(index => Number.isInteger(index) && index >= 0)) {
            // Code to set the gamepad combination and handle uniqueness
        } else {
            console.error('Invalid gamepad combination:', combination);
        }
    }

    /**
     * Sets the keyboard hotkey combination.
     * @param {string[]} combination The keyboard combination to set.
     */
    setKeyboardHotkey(combination) {
        if (combination.every(key => this.validKeyCodes.has(key))) {
            const key = combination.sort().join(',');
            if (UIController.isUniqueKeyboardHotkey(combination)) {
                this.keyboardCombination = combination;
                UIController.assignedKeyboardHotkeys.add(key);
                console.log('Keyboard hotkey set to:', this.keyboardCombination);
            } else {
                console.error('Keyboard combination already in use:', combination);
            }
        } else {
            console.error('Invalid keyboard combination:', combination);
        }
    }

    /**
     * Sets the gamepad button combination.
     * @param {number[]} combination The gamepad combination to set.
     */
    setGamepadButtons(combination) {
        if (combination.every(index => Number.isInteger(index) && index >= 0)) {
            const key = combination.sort().join(',');
            if (UIController.isUniqueGamepadCombination(combination)) {
                this.gamepadCombination = combination;
                UIController.assignedGamepadButtons.add(key);
                console.log('Gamepad buttons set to:', this.gamepadCombination);
            } else {
                console.error('Gamepad combination already in use:', combination);
            }
        } else {
            console.error('Invalid gamepad combination:', combination);
        }
    }

    /**
     * Sets the keyboard and gamepad bindings.
     * @param {string[]} keyboardCombination The keyboard combination to bind.
     * @param {number[]} gamepadCombination The gamepad combination to bind.
     */
    setBindings(keyboardCombination, gamepadCombination) {
        if (!keyboardCombination && !gamepadCombination) {
            throw new Error('At least one binding must be provided');
        }

        if (keyboardCombination) {
            this.setKeyboardHotkey(keyboardCombination);
        }

        if (gamepadCombination) {
            this.setGamepadButtons(gamepadCombination);
        }
    }
}