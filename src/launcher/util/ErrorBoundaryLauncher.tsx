/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import React from 'react';
import { getCurrentWindow } from '@electron/remote';
import { ErrorBoundary } from 'pc-nrfconnect-shared';

import pkgJson from '../../../package.json';
import { resetStore } from '../../ipc/persistedStore';
import { sendLauncherUsageData } from '../features/usageData/usageDataEffects';

const ErrorBoundaryLauncher: React.FC = ({ children }) => {
    const restoreDefaults = () => {
        resetStore();
        getCurrentWindow().reload();
    };

    const sendUsageData = (error: string) => {
        const launcherInfo = pkgJson.version ? `v${pkgJson.version}` : '';
        const errorLabel = `${process.platform}; ${process.arch}; v${launcherInfo}; ${error}`;
        sendLauncherUsageData('Report error', errorLabel);
    };

    return (
        <ErrorBoundary
            appName="Launcher"
            restoreDefaults={restoreDefaults}
            sendUsageData={sendUsageData}
        >
            {children}
        </ErrorBoundary>
    );
};

export default ErrorBoundaryLauncher;
