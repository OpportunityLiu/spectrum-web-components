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
import { html } from 'lit-html';

import '../sp-slider.js';
import { Slider, SliderHandle, HandleValues, variants } from '../';
import { TemplateResult } from '@spectrum-web-components/base';
import { spreadProps } from '@open-wc/lit-helpers';

const action = (msg1: string) => (msg2: string | HandleValues): void => {
    const message =
        typeof msg2 === 'string' ? msg2 : JSON.stringify(msg2, null, 2);
    console.log(msg1, message);
};

export default {
    component: 'sp-slider',
    title: 'Slider',
    argTypes: {
        variant: {
            name: 'Variant',
            description: 'Determines the style of slider.',
            table: {
                type: { summary: 'string' },
                defaultValue: { summary: undefined },
            },
            control: {
                type: 'inline-radio',
                options: [undefined, ...variants],
            },
        },
        tickStep: {
            name: 'Tick Step',
            description: 'Tick spacing on slider.',
            table: {
                type: { summary: 'number' },
                defaultValue: { summary: 0.1 },
            },
            control: {
                type: 'number',
            },
        },
    },
    args: {
        variant: undefined,
        tickStep: 0.1,
    },
};

interface StoryArgs {
    variant?: string;
    tickStep?: number;
}

export const Default = (args: StoryArgs): TemplateResult => {
    const handleEvent = (event: Event): void => {
        const target = event.target as Slider;
        if (target.value != null) {
            action(event.type)(target.value.toString());
        }
    };
    return html`
        <div style="width: 500px; margin: 12px 20px;">
            <sp-slider
                max="1"
                min="0"
                value=".5"
                step="0.01"
                @input=${handleEvent}
                @change=${handleEvent}
                .formatOptions=${{ style: 'percent' }}
                ...=${spreadProps(args)}
            >
                Opacity
            </sp-slider>
        </div>
    `;
};

export const Gradient = (args: StoryArgs): TemplateResult => {
    const handleEvent = (event: Event): void => {
        const target = event.target as Slider;
        if (target.value != null) {
            action(event.type)(target.value.toString());
        }
    };
    return html`
        <div
            style="
                width: 500px;
                margin: 12px 20px;
                --spectrum-slider-track-color:linear-gradient(to right, red, green 100%);
                --spectrum-slider-track-color-rtl:linear-gradient(to left, red, green 100%);
            "
        >
            <sp-slider
                label="Opacity"
                max="100"
                min="0"
                value="50"
                id="opacity-slider"
                @input=${handleEvent}
                @change=${handleEvent}
                ...=${spreadProps(args)}
            ></sp-slider>
        </div>
    `;
};
Gradient.args = {
    variant: undefined,
};

export const tick = (args: StoryArgs): TemplateResult => {
    return html`
        <sp-slider
            label="Slider Label"
            variant="tick"
            min="0"
            max="92"
            ...=${spreadProps(args)}
        ></sp-slider>
    `;
};
tick.args = {
    variant: 'tick',
    tickStep: 5,
};

export const Disabled = (args: StoryArgs): TemplateResult => {
    return html`
        <div style="width: 500px; margin: 12px 20px;">
            <sp-slider
                disabled
                value="5"
                step="0.5"
                min="0"
                max="20"
                label="Intensity"
                ...=${spreadProps(args)}
            ></sp-slider>
        </div>
    `;
};

export const ExplicitHandle = (args: StoryArgs): TemplateResult => {
    const handleEvent = (event: Event): void => {
        const target = event.target as SliderHandle;
        if (target.value != null) {
            if (typeof target.value === 'object') {
                action(event.type)(target.value);
            } else {
                action(event.type)(`${target.name}: ${target.value}`);
            }
        }
    };
    return html`
        <div style="width: 500px; margin: 12px 20px;">
            <sp-slider
                step="0.5"
                min="0"
                max="20"
                label="Intensity"
                @input=${handleEvent}
                @change=${handleEvent}
                ...=${spreadProps(args)}
            >
                <sp-slider-handle slot="handle" value="5"></sp-slider-handle slot="handle">
            </sp-slider>
        </div>
    `;
};

export const TwoHandles = (args: StoryArgs): TemplateResult => {
    const handleEvent = (event: Event): void => {
        const target = event.target as SliderHandle;
        if (target.value != null) {
            if (typeof target.value === 'object') {
                action(event.type)(target.value);
            } else {
                action(event.type)(`${target.name}: ${target.value}`);
            }
        }
    };
    return html`
        <div style="width: 500px; margin: 12px 20px;">
            <sp-slider
                value="5"
                step="1"
                min="0"
                max="255"
                @input=${handleEvent}
                @change=${handleEvent}
                ...=${spreadProps(args)}
            >
                Output Levels
                <sp-slider-handle slot="handle" name="min" value="5"></sp-slider-handle slot="handle">
                <sp-slider-handle slot="handle" name="max" value="250"></sp-slider-handle slot="handle">
            </sp-slider>
        </div>
    `;
};
TwoHandles.args = {
    variant: 'range',
    tickStep: 10,
};

export const ThreeHandlesOrdered = (args: StoryArgs): TemplateResult => {
    const handleEvent = (event: Event): void => {
        const target = event.target as SliderHandle;
        if (target.value != null) {
            if (typeof target.value === 'object') {
                action(event.type)(target.value);
            } else {
                action(event.type)(`${target.name}: ${target.value}`);
            }
        }
    };
    return html`
        <div style="width: 500px; margin: 12px 20px;">
            <sp-slider
                value="5"
                step="1"
                min="0"
                max="255"
                label="Output Levels"
                @input=${handleEvent}
                @change=${handleEvent}
                ...=${spreadProps(args)}
            >
                <sp-slider-handle slot="handle"
                    name="low"
                    value="5"
                    max="next"
                ></sp-slider-handle slot="handle">
                <sp-slider-handle slot="handle"
                    name="mid"
                    value="100"
                    min="previous"
                    max="next"
                ></sp-slider-handle slot="handle">
                <sp-slider-handle slot="handle"
                    name="high"
                    value="250"
                    min="previous"
                ></sp-slider-handle slot="handle">
            </sp-slider>
        </div>
    `;
};
ThreeHandlesOrdered.args = {
    tickStep: 10,
};

export const focusTabDemo = (args: StoryArgs): TemplateResult => {
    const value = 50;
    const min = 0;
    const max = 100;
    const step = 1;
    return html`
        <div style="width: 500px; margin: 12px 20px 20px;">
            <sp-slider
                value="${value}"
                step="${step}"
                min="${min}"
                max="${max}"
                label="Opacity"
                id="opacity-slider-opacity"
                ...=${spreadProps(args)}
            ></sp-slider>
        </div>
        <div style="width: 500px; margin: 20px;">
            <sp-slider
                value="${value}"
                step="${step}"
                min="${min}"
                max="${max}"
                label="Lightness"
                id="opacity-slider-lightness"
                ...=${spreadProps(args)}
            ></sp-slider>
        </div>
        <div style="width: 500px; margin: 20px 20px 12px;">
            <sp-slider
                value="${value}"
                step="${step}"
                min="${min}"
                max="${max}"
                label="Saturation"
                id="opacity-slider-saturation"
                ...=${spreadProps(args)}
            ></sp-slider>
        </div>
    `;
};
