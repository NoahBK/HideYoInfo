// ==UserScript==
// @name        HideYerInfo
// @author      NoahBK (https://github.com/NoahBK)
// @namespace   https://violentmonkey.github.io/get-it/
// @version     1.5
// @homepage    https://github.com/NoahBK
// @supportURL  https://github.com/NoahBK/HideYerInfo/issues
// @downloadURL https://github.com/NoahBK/HideYerInfo/raw/main/script.user.js
// @updateURL   https://github.com/NoahBK/HideYerInfo/raw/main/script.user.js
// @description Automatically hide plaintext passkeys/API keys using styled spoiler tags w/ toggle visibility on click
// @grant       none
// ==/UserScript==

(function () {
    'use strict';

    // Function to create a clickable spoiler
    function wrapInSpoiler(passkey, parentNode) {
        const spoilerWrapper = document.createElement('span');
        spoilerWrapper.classList.add('spoiler-wrapper');
        spoilerWrapper.style.cursor = 'pointer';
        spoilerWrapper.style.border = '1px solid #aaa';
        spoilerWrapper.style.backgroundColor = '#f5f5f5';
        spoilerWrapper.style.color = '#888';
        spoilerWrapper.style.padding = '2px 4px';
        spoilerWrapper.style.marginLeft = '5px';
        spoilerWrapper.textContent = 'Show';

        const content = document.createElement('span');
        content.textContent = passkey;
        content.style.display = 'none';

        parentNode.appendChild(spoilerWrapper);
        parentNode.appendChild(content);

        spoilerWrapper.addEventListener('click', function () {
            const isHidden = content.style.display === 'none';
            content.style.display = isHidden ? 'inline' : 'none';
            spoilerWrapper.style.display = isHidden ? 'none' : 'inline';
        });

        content.addEventListener('click', function () {
            content.style.display = 'none';
            spoilerWrapper.style.display = 'inline';
        });
    }

    // Function to detect sensitive keys and protect them
    function protectSensitiveInfo() {
        // Updated pattern: match alphanumeric strings (16-50 characters) that are not URLs
        const keyPattern = /\b[a-z0-9]{16,50}\b/i;
        const sensitiveKeywords = ['passkey', 'api', 'pid', 'key'];
        const excludedPattern = /(https?:\/\/[^\s]+|www\.[^\s]+)/i;

        const textNodes = document.evaluate("//text()[not(ancestor::span[contains(@class, 'spoiler')])]", document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);

        for (let i = 0; i < textNodes.snapshotLength; i++) {
            const node = textNodes.snapshotItem(i);
            const textContent = node.nodeValue.trim();

            // Skip URLs and short content
            if (excludedPattern.test(textContent) || textContent.length < 16) {
                continue;
            }

            // Match passkeys with sensitive keywords
            const match = textContent.match(keyPattern);
            if (match && !node.parentElement.closest('.spoiler')) {
                const passkey = match[0];
                const containsSensitiveKeyword = sensitiveKeywords.some(keyword => textContent.toLowerCase().includes(keyword));

                if (containsSensitiveKeyword || keyPattern.test(passkey)) {
                    const [before, after] = textContent.split(passkey);
                    const beforeNode = document.createTextNode(before);
                    const afterNode = document.createTextNode(after);
                    const passkeyNode = document.createElement('span');

                    node.replaceWith(beforeNode, passkeyNode, afterNode);
                    wrapInSpoiler(passkey, passkeyNode);
                }
            }
        }
    }

    // Run on page load and on AJAX content load
    protectSensitiveInfo();
    document.addEventListener('DOMNodeInserted', protectSensitiveInfo);
})();
