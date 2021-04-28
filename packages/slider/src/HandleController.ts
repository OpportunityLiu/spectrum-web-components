/*
Copyright 2021 Adobe. All rights reserved.
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
    TemplateResult,
    ifDefined,
    classMap,
    styleMap,
} from '@spectrum-web-components/base';
import { streamingListener } from '@spectrum-web-components/base/src/streaming-listener.js';
import { Slider } from './Slider.js';
import { SliderHandle, HandleValues } from './SliderHandle.js';

interface HandleReference {
    handle: HTMLElement;
    input: HTMLInputElement;
}

interface HandleComponents extends HandleReference {
    model: SliderHandle;
}

export class HandleController {
    private observer!: MutationObserver;
    private host!: Slider;
    private model: Map<string, SliderHandle> = new Map();
    private handleOrder: string[] = [];
    private draggingHandle?: SliderHandle;
    private handleRefMap?: WeakMap<SliderHandle, HandleReference>;

    constructor(host: Slider) {
        this.host = host;
    }

    public get values(): HandleValues {
        const result: HandleValues = [];
        for (const model of this.model.values()) {
            result.push({
                name: model.handleName,
                value: model.value as number,
            });
        }
        return result;
    }

    public set values(values: HandleValues) {
        // TODO: Implement
        console.log(values);
    }

    /**
     * It is possible for value attributes to be set programmatically. The <input>
     * for a particular slider needs to have an opportunity to validate any such
     * values
     *
     * @param handle Handle who's value needs validation
     */
    public validateHandleValue(handle: SliderHandle): void {
        const elements = this.getHandleElements(handle);
        if (!elements) return;

        const { input } = elements;
        if (input.value === handle.value.toString()) return;
        input.value = handle.value.toString();
        handle.value = parseFloat(input.value);
        this.host.requestUpdate();
    }

    public formattedValueForHandle(handle: SliderHandle): string {
        const formatOptions =
            handle.formatOptions ?? this.host.formatOptions ?? {};
        return new Intl.NumberFormat(navigator.language, formatOptions).format(
            handle.value
        );
    }

    public get formattedValues(): Map<string, string> {
        const result = new Map<string, string>();
        for (const handle of this.model.values()) {
            result.set(handle.handleName, this.formattedValueForHandle(handle));
        }
        return result;
    }

    /**
     * Returns true if the caller has explicitly specified `sp-slider-handle` elements
     *
     * This is uses by the `Slider` class to determine how to return the `value` attribute.
     * If the user has supplied explicit handles, then the value is returned as structured
     * data, rather than as a single number.
     */
    public get hasExplicitHandles(): boolean {
        if (this.model.size === 0) return false;
        if (this.model.size > 1) return true;
        return this.model.values().next().value !== this.host;
    }

    get dragging(): boolean {
        return this.draggingHandle != null;
    }

    public get focusElement(): HTMLElement {
        const { input } = this.getActiveHandleElements();
        return input;
    }

    public hostConnected(): void {
        if (!this.observer) {
            this.observer = new MutationObserver(this.extractModelFromLightDom);
        }
        this.observer.observe(this.host, { subtree: true, childList: true });
        this.extractModelFromLightDom();
    }

    public hostDisconnected(): void {
        this.observer.disconnect();
    }

    private extractModelFromLightDom = () => {
        let elements = [
            ...this.host.querySelectorAll('sp-slider-handle'),
        ] as SliderHandle[];
        if (elements.length === 0) {
            elements = [this.host as SliderHandle];
        }
        this.model = new Map();
        this.handleOrder = [];
        elements.forEach((model, index) => {
            if (!model.handleName?.length) {
                model.name = `handle${index + 1}`;
            }
            this.model.set(model.handleName, model);
            this.handleOrder.push(model.handleName);
        });
        this.host.requestUpdate();
    };

    public get activeHandle(): string {
        return this.handleOrder[this.handleOrder.length - 1];
    }

    public activateHandle(name: string): void {
        const index = this.handleOrder.findIndex((item) => item === name);
        if (index >= 0) {
            this.handleOrder.splice(index, 1);
        }
        this.handleOrder.push(name);
    }

    public setActiveHandleValue(value: number): void {
        const { model, input } = this.getActiveHandleElements();
        input.value = value.toString();
        model.value = parseFloat(input.value);
        this.host.requestUpdate();
    }

    get handles(): Iterator<SliderHandle> {
        return this.model.values();
    }

    private getActiveHandleElements(): HandleComponents {
        const name = this.activeHandle;
        const handleSlider = this.model.get(name) as SliderHandle;
        const elements = this.getHandleElements(
            handleSlider
        ) as HandleReference;
        return { model: handleSlider, ...elements };
    }

    private getHandleElements(sliderHandle: SliderHandle): HandleReference {
        if (!this.handleRefMap) {
            this.handleRefMap = new WeakMap();

            const inputNodes = this.host.shadowRoot.querySelectorAll(
                '.handle > input'
            );
            for (const inputNode of inputNodes) {
                const input = inputNode as HTMLInputElement;
                const handle = input.parentElement as HTMLElement;
                const model = this.model.get(
                    handle.getAttribute('name') as string
                );
                if (model) {
                    this.handleRefMap.set(model, { input, handle });
                }
            }
        }

        const components = this.handleRefMap.get(
            sliderHandle
        ) as HandleReference;
        return components;
    }

    private clearHandleComponentCache() {
        delete this.handleRefMap;
    }

    private get boundingClientRect(): DOMRect {
        if (!this._boundingClientRect) {
            this._boundingClientRect = this.host.getBoundingClientRect();
        }
        return this._boundingClientRect;
    }

    private updateBoundingRect(): void {
        delete this._boundingClientRect;
    }

    private _boundingClientRect?: DOMRect;

    public get count(): number {
        return this.model.size;
    }

    /**
     * Receives an event from a track click and turns it into a drag
     * of the active handle
     * @param event Track click event
     */
    public beginTrackDrag(event: PointerEvent): void {
        const { handle } = this.getActiveHandleElements();
        const model = this.model.get(this.activeHandle);
        if (!model) return;

        event.stopPropagation();
        event.preventDefault();
        const applyDefault = handle.dispatchEvent(
            new PointerEvent('pointerdown', event)
        );
        if (applyDefault) {
            this.handlePointermove(event, model);
        }
    }

    private handlePointerdown(event: PointerEvent, model: SliderHandle): void {
        const handle = event.target as HTMLDivElement;
        if (this.host.disabled || event.button !== 0) {
            event.preventDefault();
            return;
        }
        this.updateBoundingRect();
        this.host.labelEl.click();
        this.draggingHandle = model;
        this.activateHandle(model.handleName);
        handle.setPointerCapture(event.pointerId);
        this.host.requestUpdate();
    }

    private handlePointerup(event: PointerEvent, model: SliderHandle): void {
        // Retain focus on input element after mouse up to enable keyboard interactions
        const handle = event.target as HTMLDivElement;
        const input = handle.querySelector('input') as HTMLInputElement;
        this.host.labelEl.click();
        model.highlight = false;
        delete this.draggingHandle;
        this.host.requestUpdate();
        handle.releasePointerCapture(event.pointerId);
        this.dispatchChangeEvent(input, model);
    }

    private handlePointermove(event: PointerEvent, model: SliderHandle): void {
        const handle = event.target as HTMLDivElement;
        const input = handle.querySelector('input') as HTMLInputElement;
        if (!this.draggingHandle) {
            return;
        }
        input.value = this.calculateHandlePosition(event).toString();
        model.value = parseFloat(input.value);
        this.host.requestUpdate();
        this.dispatchInputEvent(model);
    }

    /**
     * Keep the slider value property in sync with the input element's value
     */
    private onInputChange(event: Event, model: SliderHandle): void {
        const input = event.target as HTMLInputElement;
        const inputValue = parseFloat(input.value);
        model.value = inputValue;

        this.host.requestUpdate();
        this.dispatchChangeEvent(input, model);
    }

    private onInputFocus(event: Event, model: SliderHandle): void {
        const input = event.target as HTMLInputElement;
        let isFocusVisible;
        try {
            isFocusVisible =
                input.matches(':focus-visible') ||
                this.host.matches('.focus-visible');
        } catch (error) {
            isFocusVisible = this.host.matches('.focus-visible');
        }
        model.highlight = isFocusVisible;
    }

    private onInputBlur(model: SliderHandle): void {
        model.highlight = false;
    }

    private dispatchChangeEvent(
        input: HTMLInputElement,
        model: SliderHandle
    ): void {
        input.value = model.value.toString();

        const changeEvent = new Event('change', {
            bubbles: true,
            composed: true,
        });

        model.dispatchEvent(changeEvent);
    }

    private dispatchInputEvent(model: SliderHandle): void {
        if (!this.draggingHandle) {
            return;
        }
        const inputEvent = new Event('input', {
            bubbles: true,
            composed: true,
        });

        model.dispatchEvent(inputEvent);
    }

    /**
     * Returns the value under the cursor
     * @param: PointerEvent on slider
     * @return: Slider value that correlates to the position under the pointer
     */
    private calculateHandlePosition(event: PointerEvent | MouseEvent): number {
        const rect = this.boundingClientRect;
        const minOffset = rect.left;
        const offset = event.clientX;
        const size = rect.width;

        const percent = (offset - minOffset) / size;
        const value = this.host.min + (this.host.max - this.host.min) * percent;

        return this.host.isLTR ? value : this.host.max - value;
    }

    private normalizeValue(value: number): number {
        return (value - this.host.min) / (this.host.max - this.host.min);
    }

    public renderHandle(
        model: SliderHandle,
        zIndex: number,
        previous?: number,
        next?: number
    ): TemplateResult {
        const isActive = this.activeHandle === model.handleName;
        const classes = {
            handle: true,
            dragging: this.draggingHandle === model,
            'handle-highlight': model.highlight,
        };
        const style = {
            [this.host.isLTR ? 'left' : 'right']: `${
                this.handlePosition(model) * 100
            }%`,
            'z-index': zIndex.toString(),
        };
        const inputMin =
            (model.min === 'previous' ? previous : model.min) ?? this.host.min;
        const inputMax =
            (model.max === 'next' ? next : model.max) ?? this.host.max;
        return html`
            <div
                class=${classMap(classes)}
                name=${model.handleName}
                style=${styleMap(style)}
                @manage=${streamingListener(
                    {
                        type: 'pointerdown',
                        fn: (event) => this.handlePointerdown(event, model),
                    },
                    {
                        type: 'pointermove',
                        fn: (event) => this.handlePointermove(event, model),
                    },
                    {
                        type: ['pointerup', 'pointercancel'],
                        fn: (event) => this.handlePointerup(event, model),
                    }
                )}
                role="presentation"
            >
                <input
                    type="range"
                    class="input"
                    id=${ifDefined(isActive ? 'input' : undefined)}
                    value=${model.value}
                    step=${this.host.step}
                    min=${inputMin}
                    max=${inputMax}
                    aria-disabled=${ifDefined(
                        this.host.disabled ? 'true' : undefined
                    )}
                    aria-valuetext=${this.formattedValueForHandle(model)}
                    @change=${(event: Event) =>
                        this.onInputChange(event, model)}
                    @focus=${(event: Event) => this.onInputFocus(event, model)}
                    @blur=${() => this.onInputBlur(model)}
                />
            </div>
        `;
    }

    public render(): TemplateResult[] {
        this.clearHandleComponentCache();
        return Array.from(this.model.values()).map((model, index, array) => {
            const zIndex = this.handleOrder.indexOf(model.name) + 1;
            const previous = array[index - 1]?.value;
            const next = array[index + 1]?.value;
            return this.renderHandle(model, zIndex, previous, next);
        });
    }

    /**
     * Returns a list of track segment [start, end] tuples where the values are
     * normalized to be between 0 and 1.
     * @returns A list of track segment tuples [start, end]
     */
    public trackSegments(): [number, number][] {
        const values = [...this.model.values()].map((item) => item.value);
        values.sort((a, b) => a - b);
        const normalizedSegmentStartValues = values.map((value) =>
            this.normalizeValue(value)
        );
        // The first segment always starts at 0
        normalizedSegmentStartValues.unshift(0);
        return normalizedSegmentStartValues.map((value, index, array) => [
            value,
            array[index + 1] ?? 1,
        ]);
    }

    private handlePosition(model: SliderHandle): number {
        const range = this.host.max - this.host.min;
        const progress = model.value - this.host.min;

        return progress / range;
    }
}
