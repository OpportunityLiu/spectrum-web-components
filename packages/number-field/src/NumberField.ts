/*
Copyright 2020 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
*/

import {
    html,
    CSSResultArray,
    TemplateResult,
    property,
    PropertyValues,
    query,
} from '@spectrum-web-components/base';
import { streamingListener } from '@spectrum-web-components/base/src/streaming-listener.js';

import '@spectrum-web-components/icons-ui/icons/sp-icon-chevron75.js';
import '@spectrum-web-components/action-button/sp-action-button.js';
import { Textfield } from '@spectrum-web-components/textfield';
import chevronStyles from '@spectrum-web-components/icon/src/spectrum-icon-chevron.css.js';
import styles from './number-field.css.js';

/**
 * @element sp-number-field
 */
export class NumberField extends Textfield {
    public static get styles(): CSSResultArray {
        return [...super.styles, styles, chevronStyles];
    }

    @query('.buttons')
    private buttons!: HTMLDivElement;

    @property({ type: Boolean, reflect: true })
    public focused = false;

    @property({ type: Object, attribute: 'format-options' })
    public formatOptions: Intl.NumberFormatOptions = {};

    @property({ type: Boolean, reflect: true, attribute: 'keyboard-focused' })
    public keyboardFocused = false;

    @property({ type: Number })
    public step = 1;

    private nextChange!: number;
    private changeCount = 0;
    private change!: () => void;
    private safty!: number;

    private findChange(event: PointerEvent): void {
        const path = event.composedPath();
        path.some((el) => {
            if ((el as HTMLElement).classList?.contains('stepUp')) {
                this.change = () => this.increment();
                return true;
            } else if ((el as HTMLElement).classList?.contains('stepDown')) {
                this.change = () => this.decrement();
                return true;
            }
            return false;
        });
    }

    private handlePointerdown(event: PointerEvent): void {
        if (event.button !== 0) {
            event.preventDefault();
            return;
        }
        this.findChange(event);
        this.startChange();
    }

    private startChange(): void {
        this.changeCount = 0;
        this.change();
        this.safty = (setTimeout(() => {
            this.doNextChange();
        }, 400) as unknown) as number;
    }

    private handlePointermove(event: PointerEvent): void {
        if (event.target === this.buttons) {
            if (event.type === 'pointerleave') {
                this.buttons.setPointerCapture(event.pointerId);
            } else if (event.type === 'pointerenter') {
                this.buttons.releasePointerCapture(event.pointerId);
            }
        }
        this.findChange(event);
    }

    private handlePointerup(event: PointerEvent): void {
        this.buttons.releasePointerCapture(event.pointerId);
        cancelAnimationFrame(this.nextChange);
        clearTimeout(this.safty);
    }

    private doNextChange(): number {
        this.changeCount += 1;
        if (this.changeCount % 5 === 0) {
            this.change();
        }
        return requestAnimationFrame(() => {
            this.nextChange = this.doNextChange();
        });
    }

    private increment(): void {
        let value = parseFloat(this.value) || 0;
        value += this.step;
        this.value = new Intl.NumberFormat(
            navigator.language,
            this.formatOptions
        ).format(value);
        this.focus();
    }

    private decrement(): void {
        let value = parseFloat(this.value) || 0;
        value -= this.step;
        this.value = new Intl.NumberFormat(
            navigator.language,
            this.formatOptions
        ).format(value);
        this.focus();
    }

    private handleKeydown(event: KeyboardEvent): void {
        switch (event.code) {
            case 'ArrowUp':
                event.preventDefault();
                this.increment();
                break;
            case 'ArrowDown':
                event.preventDefault();
                this.decrement();
                break;
        }
    }

    protected onFocus(): void {
        super.onFocus();
        this.keyboardFocused = true;
    }

    protected onBlur(): void {
        super.onBlur();
        this.keyboardFocused = false;
    }

    private handleFocusin(): void {
        this.focused = true;
        this.keyboardFocused = true;
    }

    private handleFocusout(): void {
        this.focused = false;
        this.keyboardFocused = false;
    }

    protected onChange(): void {
        super.onChange();
        const value = parseFloat(this.focusElement.value);
        this.value = new Intl.NumberFormat(
            navigator.language,
            this.formatOptions
        ).format(value);
    }

    protected render(): TemplateResult {
        this.autocomplete = 'off';
        return html`
            ${super.render()}
            <span
                class="buttons"
                @focusin=${this.handleFocusin}
                @focusout=${this.handleFocusout}
                @manage=${streamingListener(
                    { type: 'pointerdown', fn: this.handlePointerdown },
                    {
                        type: ['pointermove', 'pointerenter', 'pointerleave'],
                        fn: this.handlePointermove,
                    },
                    {
                        type: ['pointerup', 'pointercancel'],
                        fn: this.handlePointerup,
                    }
                )}
            >
                <sp-action-button
                    class="stepUp"
                    tabindex="-1"
                    ?focused=${this.focused}
                >
                    <sp-icon-chevron75
                        slot="icon"
                        class="stepper-icon spectrum-UIIcon-ChevronUp75"
                    ></sp-icon-chevron75>
                </sp-action-button>
                <sp-action-button
                    class="stepDown"
                    tabindex="-1"
                    ?focused=${this.focused}
                >
                    <sp-icon-chevron75
                        slot="icon"
                        class="stepper-icon spectrum-UIIcon-ChevronDown75"
                    ></sp-icon-chevron75>
                </sp-action-button>
            </span>
        `;
    }

    protected firstUpdated(changes: PropertyValues): void {
        super.firstUpdated(changes);
        this.multiline = false;
        this.addEventListener('keydown', this.handleKeydown);
    }
}
