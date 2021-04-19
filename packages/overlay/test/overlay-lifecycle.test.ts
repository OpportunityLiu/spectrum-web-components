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
    html,
    expect,
    waitUntil,
} from '@open-wc/testing';
import '@spectrum-web-components/tooltip/sp-tooltip.js';
import '@spectrum-web-components/action-button/sp-action-button.js';
import { OverlayTrigger } from '..';
import '@spectrum-web-components/overlay/overlay-trigger.js';
import { executeServerCommand } from '@web/test-runner-commands';
import { findAccessibilityNode } from '../../../test/testing-helpers';

describe('Overlay Trigger - Lifecycle Methods', () => {
    it('calls the overlay lifecycle', async () => {
        const el = await fixture<OverlayTrigger>(html`
            <overlay-trigger placement="right-start" open="hover">
                <sp-action-button slot="trigger">
                    Button with Tooltip
                </sp-action-button>
                <sp-tooltip slot="hover-content">
                    Described by this content on focus/hover.
                </sp-tooltip>
            </overlay-trigger>
        `);

        await elementUpdated(el);

        const trigger = el.querySelector('[slot="trigger"]') as HTMLElement;
        type DescribedNode = {
            name: string;
            description: string;
        };
        let snapshot = (await executeServerCommand(
            'a11y-snapshot'
        )) as DescribedNode & { children: DescribedNode[] };
        expect(
            findAccessibilityNode<DescribedNode>(
                snapshot,
                (node) =>
                    node.name === 'Button with Tooltip' &&
                    typeof node.description === 'undefined'
            ),
            '`name`ed with no `description`'
        );
        trigger.dispatchEvent(
            new FocusEvent('focusin', { bubbles: true, composed: true })
        );

        await waitUntil(() => el.hasAttribute('open'));

        snapshot = (await executeServerCommand(
            'a11y-snapshot'
        )) as DescribedNode & { children: DescribedNode[] };

        expect(
            findAccessibilityNode<DescribedNode>(
                snapshot,
                (node) =>
                    node.name === 'Button with Tooltip' &&
                    node.description ===
                        'Described by this content on focus/hover.'
            ),
            '`name`ed with `description`'
        );
    });
});
