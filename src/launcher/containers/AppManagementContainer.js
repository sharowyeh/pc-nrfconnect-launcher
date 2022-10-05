/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import { connect } from 'react-redux';
import { openUrl } from 'pc-nrfconnect-shared';

import { createDesktopShortcut } from '../../ipc/createDesktopShortcut';
import AppManagementView from '../components/AppManagementView';
import {
    checkEngineAndLaunch,
    installDownloadableApp,
    removeDownloadableApp,
    upgradeDownloadableApp,
} from '../features/apps/appsEffects';
import { getAppsFilter } from '../features/filter/filterSlice';
import { show as showReleaseNotes } from '../features/releaseNotes/releaseNotesDialogSlice';

function mapStateToProps(state) {
    const {
        apps: {
            localApps,
            downloadableApps,
            installingAppName,
            removingAppName,
            upgradingAppName,
        },
    } = state;
    const allApps = localApps.concat(downloadableApps);

    const appsFilter = getAppsFilter(state);
    const apps = allApps.filter(appsFilter).sort((a, b) => {
        const cmpInstalled = !!b.currentVersion - !!a.currentVersion;
        const aName = a.displayName || a.name;
        const bName = b.displayName || b.name;
        return cmpInstalled || aName.localeCompare(bName);
    });

    return {
        apps,
        installingAppName,
        removingAppName,
        upgradingAppName,
        isProcessing:
            !!installingAppName || !!upgradingAppName || !!removingAppName,
        upgradeableApps: apps.filter(app => app.upgradeAvailable),
    };
}

function mapDispatchToProps(dispatch) {
    return {
        onInstall: (name, source) =>
            dispatch(installDownloadableApp(name, source)),
        onRemove: (name, source) =>
            dispatch(removeDownloadableApp(name, source)),
        onReadMore: homepage => openUrl(homepage),
        // Launcher actions
        onAppSelected: app => dispatch(checkEngineAndLaunch(app.toJS())),
        onCreateShortcut: app => createDesktopShortcut(app.toJS()),
        onShowReleaseNotes: appid => dispatch(showReleaseNotes(appid)),
        onUpgrade: (name, version, source) =>
            dispatch(upgradeDownloadableApp(name, version, source)),
    };
}

export default connect(mapStateToProps, mapDispatchToProps)(AppManagementView);
