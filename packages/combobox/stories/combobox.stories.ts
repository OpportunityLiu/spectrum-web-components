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

import { ComboboxOption } from '..';
import '../sp-combobox.js';

export default {
    title: 'Combobox',
    component: 'sp-combobox',
};

export const Default = (): TemplateResult => {
    const options: ComboboxOption[] = [
        { id: 'thing1', value: 'Abc Thing 1' },
        { id: 'thing1a', value: 'Bde Thing 2' },
        { id: 'thing1b', value: 'Bef Thing 3' },
        { id: 'thing4', value: 'Efg Thing 4' },
        { id: 'athing1', value: 'Abc Thing 1' },
        { id: 'athing1a', value: 'Bde Thing 2' },
        { id: 'athing1b', value: 'Bef Thing 3' },
        { id: 'athing4', value: 'Efg Thing 4' },
    ];
    return html`
        <sp-combobox .options=${options} style="margin: 100vh 0;">
            Things
        </sp-combobox>
    `;
};
