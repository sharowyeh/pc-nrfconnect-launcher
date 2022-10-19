/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import React from 'react';
import ProgressBar from 'react-bootstrap/ProgressBar';

import { DisplayedApp } from '../appsSlice';

const AppProgress: React.FC<{ app: DisplayedApp }> = ({ app }) => {
    if (
        !app.isDownloadable ||
        !(
            app.progress.isInstalling ||
            app.progress.isUpgrading ||
            app.progress.isRemoving
        )
    ) {
        return null;
    }

    return <ProgressBar now={app.progress.fraction} />;
};

export default AppProgress;
