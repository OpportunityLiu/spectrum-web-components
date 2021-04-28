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

import { property, PropertyValues } from '@spectrum-web-components/base';
import { Focusable } from '@spectrum-web-components/shared/src/focusable.js';

export type HandleMin = number | 'previous';
export type HandleMax = number | 'next';

export type HandleValues = {
    name: string;
    value: number;
}[];

export abstract class SliderHandleBase extends Focusable {
    @property({ type: Boolean })
    public highlight = false;

    @property({ type: String })
    public name = '';

    @property({ reflect: true })
    public min?: HandleMin;

    @property({ reflect: true })
    public max?: HandleMax;

    @property({ type: Object, attribute: 'format-options' })
    public formatOptions: Intl.NumberFormatOptions = {};

    public abstract get handleName(): string;

    public shouldUpdate(changedProperties: PropertyValues): boolean {
        return super.shouldUpdate(changedProperties);
    }

    @property({ type: Number, attribute: false })
    protected _value = 10;
}

export class SliderHandle extends SliderHandleBase {
    @property({ type: Number })
    value = 10;

    public get handleName(): string {
        return this.name;
    }

    public shouldUpdate(changedProperties: PropertyValues): boolean {
        const event = new CustomEvent('sp-slider-handle-update', {
            detail: changedProperties,
            bubbles: true,
        });
        this.dispatchEvent(event);
        return false;
    }
}

declare global {
    interface GlobalEventHandlersEventMap {
        'sp-slider-handle-update': CustomEvent<PropertyValues>;
    }
}
