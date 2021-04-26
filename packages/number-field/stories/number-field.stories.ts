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

import { html, TemplateResult } from '@spectrum-web-components/base';

import '../sp-number-field.js';

export default {
    title: 'Number Field',
    component: 'sp-number-field',
};

export const Default = (): TemplateResult => {
    return html`
        <sp-number-field
            style="width: 200px"
            placeholder="100"
        ></sp-number-field>
    `;
};

export const decimals = (): TemplateResult => {
    return html`
        <sp-number-field
            style="width: 200px"
            placeholder="100"
            .formatOptions=${{
                signDisplay: 'exceptZero',
                minimumFractionDigits: 1,
                maximumFractionDigits: 2,
            }}
        ></sp-number-field>
    `;
};

export const percents = (): TemplateResult => {
    return html`
        <sp-number-field
            style="width: 200px"
            placeholder="100"
            .formatOptions=${{ style: 'percent' }}
        ></sp-number-field>
    `;
};

export const currency = (): TemplateResult => {
    return html`
        <sp-number-field
            style="width: 200px"
            placeholder="100"
            .formatOptions=${{
                style: 'currency',
                currency: 'EUR',
                currencyDisplay: 'code',
                currencySign: 'accounting',
            }}
        ></sp-number-field>
    `;
};

export const units = (): TemplateResult => {
    return html`
        <sp-number-field
            style="width: 200px"
            placeholder="100"
            .formatOptions=${{
                style: 'unit',
                unit: 'inch',
                unitDisplay: 'long',
            }}
        ></sp-number-field>
    `;
};
