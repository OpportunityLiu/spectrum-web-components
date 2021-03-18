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
    SpectrumElement,
    CSSResultArray,
    TemplateResult,
    property,
    query,
    PropertyValues,
    ifDefined,
} from '@spectrum-web-components/base';
import '../sp-combobox-item.js';
import { ComboboxItem } from './ComboboxItem.js';
import { openOverlay } from '@spectrum-web-components/overlay';

import styles from './combobox.css.js';

export type ComboboxOption = {
    id: string;
    value: string;
};

/**
 * @element sp-combobox
 */
export class Combobox extends SpectrumElement {
    public static get styles(): CSSResultArray {
        return [styles];
    }

    /**
     * The currently active ComboboxItem descendent, when available.
     */
    @property({ attribute: false })
    protected activeDescendent?: ComboboxOption;

    @property({ attribute: false })
    protected availableOptions: ComboboxOption[] = [];

    @property()
    public label = '';

    /**
     * Whether the listbox is visible.
     **/
    @property({ type: Boolean, reflect: true })
    public open = false;

    @property()
    public value = '';

    @query('input')
    public focusElement!: HTMLInputElement;

    @query('#listbox')
    public listbox!: HTMLDivElement;

    public overlay!: HTMLDivElement;

    /**
     * The array of the children of the combobox, ie ComboboxItems.
     **/
    @property({ type: Array })
    public options: ComboboxOption[] = [];

    // { value: "String thing", id: "string1" }
    public focus(): void {
        this.focusElement.focus();
    }

    public click(): void {
        this.focus();
        this.focusElement.click();
    }

    public onComboboxKeydown(event: KeyboardEvent): void {
        if (event.altKey && event.code === 'ArrowDown') {
            this.open = true;
        } else if (event.code === 'ArrowDown') {
            event.preventDefault();
            this.open = true;
            this.activateNextDescendent();
            const activeEl = this.overlay.querySelector(
                `#${(this.activeDescendent as ComboboxOption).id}`
            ) as HTMLElement;
            if (activeEl) {
                activeEl.scrollIntoView({ block: 'nearest' });
            }
        } else if (event.code === 'ArrowUp') {
            event.preventDefault();
            this.open = true;
            this.activatePreviousDescendent();
            const activeEl = this.overlay.querySelector(
                `#${(this.activeDescendent as ComboboxOption).id}`
            ) as HTMLElement;
            if (activeEl) {
                activeEl.scrollIntoView({ block: 'nearest' });
            }
        } else if (event.code === 'Escape') {
            if (!this.open) {
                this.value = '';
            }
            this.open = false;
        } else if (event.code === 'Enter') {
            this.selectDescendent();
            this.open = false;
        } else if (event.code === 'Home') {
            this.focusElement.setSelectionRange(0, 0);
            this.activeDescendent = undefined;
        } else if (event.code === 'End') {
            const { length } = this.value;
            this.focusElement.setSelectionRange(length, length);
            this.activeDescendent = undefined;
        } else if (event.code === 'ArrowLeft') {
            this.activeDescendent = undefined;
        } else if (event.code === 'ArrowRight') {
            this.activeDescendent = undefined;
        }
    }

    /**
     * Get the elements from the picker list
     * put them into the descendents array by mapping each li element into it
     **/
    private manageDescendents(): void {
        // const list = this.shadowRoot.querySelector(
        //     '#listbox'
        // ) as HTMLUListElement;
        // this.options = ([...list.children] as ComboboxItem[]).filter(
        //     (descendent) => descendent.getAttribute('role') === 'option'
        // );
    }

    public activateNextDescendent(): void {
        const activeIndex = !this.activeDescendent
            ? -1
            : this.options.indexOf(this.activeDescendent);
        const nextActiveIndex =
            (this.options.length + activeIndex + 1) % this.options.length;
        this.activeDescendent = this.options[nextActiveIndex];
    }

    public activatePreviousDescendent(): void {
        const activeIndex = !this.activeDescendent
            ? 0
            : this.options.indexOf(this.activeDescendent);
        const previousActiveIndex =
            (this.options.length + activeIndex - 1) % this.options.length;
        this.activeDescendent = this.options[previousActiveIndex];
    }

    public selectDescendent(): void {
        if (!this.activeDescendent) {
            return;
        }
        this.value = this.activeDescendent.value;
    }

    public filterAvailableOptions(): void {
        const valueLowerCase = this.value.toLowerCase();
        this.availableOptions = this.options.filter((descendent) => {
            const descendentValueLowerCase = descendent.value.toLowerCase();
            return descendentValueLowerCase.startsWith(valueLowerCase);
        });
    }

    public onComboboxInput({
        target,
    }: Event & { target: HTMLInputElement }): void {
        this.value = target.value;
        this.activeDescendent = undefined;
        this.open = true;
    }

    public onListPointerenter({
        target,
    }: PointerEvent & { target: ComboboxItem }) {
        this.activeDescendent = target;
    }

    public onListPointerleave() {
        this.activeDescendent = undefined;
    }

    public onListClick(event: PointerEvent & { target: ComboboxItem }) {
        const { target } = event;
        event.preventDefault();
        this.activeDescendent = target;
        if (!this.activeDescendent) {
            return;
        }
        this.selectDescendent();
        this.open = false;
        this._returnItems();
    }

    public onOverlayScroll = () => {
        console.log(this.overlay.scrollLeft, this.overlay.scrollTop);
        this.listbox.scroll(this.overlay.scrollLeft, this.overlay.scrollTop);
    };

    public onOpened(): void {
        this.observer.observe(this.overlay.parentElement as HTMLElement, {
            attributes: true,
        });
        this.overlay.addEventListener('scroll', this.onOverlayScroll);
    }

    public toggleOpen(): void {
        this.open = !this.open;
    }

    protected shouldUpdate(changed: PropertyValues<this>): boolean {
        if (changed.has('open') && !this.open) {
            this.activeDescendent = undefined;
        }
        if (changed.has('value')) {
            this.filterAvailableOptions();
        }
        return super.shouldUpdate(changed);
    }

    private positionListbox(entries: MutationRecord[]): void {
        entries.forEach((entry) => {
            const targetRect = (entry.target as HTMLElement).getBoundingClientRect();
            const rootRect = this.getBoundingClientRect();
            this.listbox.style.transform = `translate(${
                targetRect.x - rootRect.x
            }px, ${targetRect.y - rootRect.y}px)`;
            this.listbox.style.height = `${targetRect.height}px`;
            this.listbox.style.maxHeight = `${targetRect.height}px`;
        });
    }

    protected render(): TemplateResult {
        return html`
            <label id="label" for="combobox">
                <slot>${this.label}</slot>
            </label>
            <input
                aria-controls="listbox"
                aria-activedescendant=${ifDefined(
                    this.activeDescendent
                        ? `${this.activeDescendent.id}-sr`
                        : undefined
                )}
                aria-autocomplete="list"
                aria-expanded=${this.open ? 'true' : 'false'}
                aria-labelledby="label"
                @click=${this.toggleOpen}
                @input=${this.onComboboxInput}
                @keydown=${this.onComboboxKeydown}
                id="combobox"
                role="combobox"
                type="text"
                .value=${this.value}
                @sp-closed=${() => {
                    this.open = false;
                }}
                @sp-opened=${this.onOpened}
            />
            <button
                aria-controls="listbox"
                aria-expanded=${this.open ? 'true' : 'false'}
                aria-labelledby="label"
                @click=${this.toggleOpen}
                tabindex="-1"
            ></button>
            <div
                aria-labelledby="label"
                @pointerenter=${this.onListPointerenter}
                @pointerleave=${this.onListPointerleave}
                @click=${this.onListClick}
                ?hidden=${!this.open}
                role="listbox"
                id="overlay"
                style="overflow: auto; max-height: 100%;"
            >
                <slot name="option"></slot>
                ${this.availableOptions.map((option) => {
                    return html`
                        <sp-combobox-item
                            id=${option.id}
                            aria-selected=${ifDefined(
                                this.activeDescendent?.id === option.id
                                    ? 'true'
                                    : undefined
                            )}
                        >
                            ${option.value}
                        </sp-combobox-item>
                    `;
                })}
            </div>
            <div
                aria-labelledby="label"
                ?hidden=${!this.open}
                role="listbox"
                id="listbox"
                style="overflow: auto;"
            >
                <slot name="option"></slot>
                ${this.availableOptions.map((option) => {
                    return html`
                        <sp-combobox-item
                            id="${option.id}-sr"
                            aria-selected=${ifDefined(
                                this.activeDescendent?.id === option.id
                                    ? 'true'
                                    : undefined
                            )}
                        >
                            ${option.value}
                        </sp-combobox-item>
                    `;
                })}
            </div>
        `;
    }

    protected firstUpdated(changed: PropertyValues<this>): void {
        super.firstUpdated(changed);
        this.overlay = this.shadowRoot.querySelector(
            '#overlay'
        ) as HTMLDivElement;
        this.updateComplete.then(() => {
            this.manageDescendents();
            this.availableOptions = this.options;
        });
    }

    private _returnItems = () => {
        return;
    };

    protected async manageListOverlay(): Promise<void> {
        if (this.open) {
            this._returnItems = await openOverlay(
                this.shadowRoot.querySelector('#combobox') as HTMLElement,
                'click',
                this.shadowRoot.querySelector('#overlay') as HTMLElement,
                {
                    offset: 0,
                    placement: 'top-start',
                }
            );
        } else {
            this._returnItems();
        }
    }

    protected updated(changed: PropertyValues<this>): void {
        if (changed.has('open')) {
            this.manageListOverlay();
            if (!this.open) {
                this.observer.disconnect();
                this.overlay.removeEventListener(
                    'scroll',
                    this.onOverlayScroll
                );
            }
        }
    }

    protected async _getUpdateComplete(): Promise<void> {
        await super._getUpdateComplete();
        const list = this.shadowRoot.querySelector(
            '#listbox'
        ) as HTMLUListElement;
        if (list) {
            const descendents = [...list.children] as ComboboxItem[];
            await Promise.all(
                descendents.map((descendent) => descendent.updateComplete)
            );
        }
    }

    public connectedCallback(): void {
        super.connectedCallback();
        if (!this.observer) {
            this.observer = new MutationObserver(
                this.positionListbox.bind(this)
            );
        }
    }

    public disconnectedCallback(): void {
        this.observer.disconnect();
        super.disconnectedCallback();
    }

    private observer!: MutationObserver;
}

/**
 * 
    <sp-combobox>
        #shadow-root
    this.shadowRoot.querySelector('#listbox').children;
    this.shadowRoot.querySelectorAll('li');
            <div class="spectrum-Textfield spectrum-InputGroup-textfield">
                <input type="text" placeholder="Type here" name="field" value="" class="spectrum-Textfield-input spectrum-InputGroup-input">
            </div>
            <button class="spectrum-Picker spectrum-Picker--sizeM spectrum-InputGroup-button" tabindex="-1" aria-haspopup="true">
                <svg class="spectrum-Icon spectrum-UIIcon-ChevronDown100 spectrum-Picker-menuIcon spectrum-InputGroup-icon" focusable="false" aria-hidden="true">
                    <use xlink:href="#spectrum-css-icon-Chevron100" />
                </svg>
            </button>
    </sp-conbobox>
 * 
 */

/**
 *
 * Public API
 * popover requirement
 *
 * Aria-Spectrum consumption
 *
 * visual delivery - Spectrum CSS
 *
 *
 * does test:watch build the plugins correctly?
 */
