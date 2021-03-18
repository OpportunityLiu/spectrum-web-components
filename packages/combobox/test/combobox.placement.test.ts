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
    fixture,
    elementUpdated,
    expect,
    html,
    oneEvent,
    nextFrame,
} from '@open-wc/testing';
import { executeServerCommand } from '@web/test-runner-commands';

import '../sp-combobox.js';
import '../sp-combobox-item.js';
import { Combobox, ComboboxOption } from '..';
import { arrowUpEvent } from '../../../test/testing-helpers.js';
import { testActiveElement } from './combobox.test.js';

type TestableCombobox = Combobox & {
    activeDescendent: ComboboxOption;
    availableOptions: ComboboxOption[];
};

const comboboxFixture = async () => {
    const options: ComboboxOption[] = [
        { id: 'thing1', value: 'Abc Thing 1' },
        { id: 'thing1a', value: 'Bde Thing 2' },
        { id: 'thing1b', value: 'Bef Thing 3' },
        { id: 'thing4', value: 'Efg Thing 4' },
    ];

    const el = await fixture<TestableCombobox>(
        html`
            <sp-combobox .options=${options}></sp-combobox>
        `
    );

    return el;
};

describe('Combobox Placement', () => {
    it('opens with visible and accessible content in same place', async () => {
        const el = await comboboxFixture();

        await elementUpdated(el);
        const { offsetHeight } = el;
        el.style.marginTop = `calc(100vh - ${offsetHeight}px)`;
        el.style.marginBottom = `100vh`;

        const listbox = el.shadowRoot.querySelector('#listbox') as Element;
        const overlay = el.shadowRoot.querySelector('#overlay') as Element;

        el.click();

        await oneEvent(el, 'sp-opened');
        await nextFrame();
        expect(el.open).to.be.true;

        let listboxRect = listbox.getBoundingClientRect();
        let overlayRect = overlay.getBoundingClientRect();

        expect(listboxRect.x, 'does the list box start x').to.equal(
            overlayRect.x
        );
        expect(listboxRect.y, 'does the list box start y').to.equal(
            overlayRect.y
        );

        const firstPosition = [overlayRect.x, overlayRect.y];

        window.scroll(0, overlayRect.height * 2);

        await nextFrame();

        listboxRect = listbox.getBoundingClientRect();
        overlayRect = overlay.getBoundingClientRect();
        const secondPosition = [overlayRect.x, overlayRect.y];

        expect(firstPosition, 'does the overlay move').to.not.deep.equal(
            secondPosition
        );
        expect(listboxRect.x, 'does the list box follow x').to.equal(
            overlayRect.x
        );
        expect(listboxRect.y, 'does the list box follow y').to.equal(
            overlayRect.y
        );
    });
    it('matches the listbox height to the overlay height', async () => {
        const el = await comboboxFixture();

        await elementUpdated(el);

        const listbox = el.shadowRoot.querySelector('#listbox') as HTMLElement;
        const overlay = el.shadowRoot.querySelector('#overlay') as HTMLElement;

        el.click();

        await oneEvent(el, 'sp-opened');
        expect(el.open).to.be.true;

        let overlayRect = overlay.getBoundingClientRect();

        const { height } = overlayRect;
        await executeServerCommand('set-viewport', {
            width: 800,
            height: Math.ceil(height),
        });

        await nextFrame();

        overlayRect = overlay.getBoundingClientRect();
        let listboxRect = listbox.getBoundingClientRect();

        expect(overlayRect.height).to.not.equal(height);
        expect(listboxRect.height).to.equal(overlayRect.height);

        overlay.scroll(0, height * 2);

        await nextFrame();

        const lastOverlayItem = overlay.querySelector('#thing4') as HTMLElement;
        const lastListboxItem = listbox.querySelector(
            '#thing4-sr'
        ) as HTMLElement;

        const lastOverlayItemRect = lastOverlayItem.getBoundingClientRect();
        const lastListboxItemRect = lastListboxItem.getBoundingClientRect();

        const lastOverlayItemPosition = [
            lastOverlayItemRect.x,
            lastOverlayItemRect.y,
        ];
        const lastListboxItemPosition = [
            lastListboxItemRect.x,
            lastListboxItemRect.y,
        ];

        expect(lastListboxItemPosition).to.deep.equal(lastOverlayItemPosition);
        await executeServerCommand('set-viewport', { width: 800, height: 600 });
    });
    it('matches the listbox scroll position to the overlay scroll position on key press', async () => {
        const el = await comboboxFixture();

        await elementUpdated(el);

        const listbox = el.shadowRoot.querySelector('#listbox') as HTMLElement;
        const overlay = el.shadowRoot.querySelector('#overlay') as HTMLElement;

        el.click();

        await oneEvent(el, 'sp-opened');
        expect(el.open).to.be.true;

        let overlayRect = overlay.getBoundingClientRect();

        const lastOverlayItem = overlay.querySelector('#thing4') as HTMLElement;
        const lastListboxItem = listbox.querySelector(
            '#thing4-sr'
        ) as HTMLElement;

        let lastOverlayItemRect = lastOverlayItem.getBoundingClientRect();
        let lastListboxItemRect = lastListboxItem.getBoundingClientRect();

        let lastOverlayItemInitialPosition = [
            lastOverlayItemRect.x,
            lastOverlayItemRect.y,
        ];
        let lastListboxItemInitialPosition = [
            lastListboxItemRect.x,
            lastListboxItemRect.y,
        ];

        expect(
            lastListboxItemInitialPosition,
            'same place listbox/overlay'
        ).to.deep.equal(lastOverlayItemInitialPosition);

        const { height } = overlayRect;
        await executeServerCommand('set-viewport', {
            width: 800,
            height: Math.ceil(height),
        });

        await nextFrame();

        overlayRect = overlay.getBoundingClientRect();
        let listboxRect = listbox.getBoundingClientRect();

        // These not being the same means that the listbox and overlay elements
        // will need to scroll when interacting with items outside of their height.
        expect(overlayRect.height).to.not.equal(height);
        expect(listboxRect.height).to.equal(overlayRect.height);

        el.focusElement.focus();
        el.focusElement.dispatchEvent(arrowUpEvent);

        await elementUpdated(el);

        testActiveElement(el, 'thing4');

        lastOverlayItemRect = lastOverlayItem.getBoundingClientRect();
        lastListboxItemRect = lastListboxItem.getBoundingClientRect();

        let lastOverlayItemFinalPosition = [
            lastOverlayItemRect.x,
            lastOverlayItemRect.y,
        ];
        let lastListboxItemFinalPosition = [
            lastListboxItemRect.x,
            lastListboxItemRect.y,
        ];

        expect(lastOverlayItemFinalPosition, 'same place item').to.deep.equal(
            lastListboxItemFinalPosition
        );
        expect(lastOverlayItemFinalPosition).to.not.deep.equal(
            lastOverlayItemInitialPosition
        );
        expect(lastListboxItemFinalPosition).to.not.deep.equal(
            lastListboxItemInitialPosition
        );

        await executeServerCommand('set-viewport', { width: 800, height: 600 });
    });
    xit('comment into the above files with what the heck is going on!', () => {});
});
