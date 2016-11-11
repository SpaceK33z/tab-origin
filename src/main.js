const openerTabs = {};

function addTab(tab) {
	if (!tab.openerTabId) {
		console.log('Tab has no opener.');
		return;
	}
	chrome.tabs.get(tab.openerTabId, openerTab => {
		if (chrome.runtime.lastError) {
			console.error('Opener tab was already closed. This should almost never happen.');
			return;
		}
		openerTabs[tab.id] = {
			id: openerTab.id,
			url: openerTab.url,
		};
	});
}

function removeTab(tab) {
	delete openerTabs[tab.id];
}

chrome.tabs.onCreated.addListener(addTab);
chrome.tabs.onRemoved.addListener(removeTab);

chrome.tabs.onActivated.addListener(activeInfo => {
	const hasOpener = !!openerTabs[activeInfo.tabId];
	// TODO: `setIcon` also accepts a `tabId` parameter. Seemed very buggy though...
	chrome.browserAction.setIcon({
		path: hasOpener ? 'img/icon.png' : 'img/icon_inactive.png',
	});
});

chrome.browserAction.onClicked.addListener(tab => {
	const openerTab = openerTabs[tab.id];

	if (!openerTab) {
		// TODO: This needs to be showed in the UI somehow.
		console.log('Cannot find the opener tab.');
		return;
	}
	// First try to get the opener tab, if it still exists.
	chrome.tabs.get(openerTab.id, oTab => {
		if (chrome.runtime.lastError) {
			// If it doesn't exist, open a new tab for it.
			chrome.tabs.create({
				url: openerTab.url,
			});
			return;
		}
		// If it does exist, highlight that tab.
		chrome.tabs.highlight({
			tabs: oTab.index,
			windowId: oTab.windowId,
		});
	});
});
