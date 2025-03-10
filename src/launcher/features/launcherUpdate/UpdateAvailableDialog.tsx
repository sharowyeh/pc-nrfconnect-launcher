/*
 * Copyright (c) 2022 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import React from 'react';
import { Button, ConfirmationDialog, openUrl } from 'pc-nrfconnect-shared';

import { startUpdate } from '../../../ipc/launcherUpdate';
import { useLauncherDispatch, useLauncherSelector } from '../../util/hooks';
import { getLauncherUpdate, reset } from './launcherUpdateSlice';

const releaseNotesUrl =
    'https://github.com/NordicSemiconductor/pc-nrfconnect-launcher/releases';

export default () => {
    const dispatch = useLauncherDispatch();
    const {
        isUpdateAvailableDialogVisible: isVisible,
        latestVersion: version,
    } = useLauncherSelector(getLauncherUpdate);

    return (
        <ConfirmationDialog
            isVisible={isVisible}
            title="Update available"
            confirmLabel="Yes"
            cancelLabel="No"
            onConfirm={() => startUpdate()}
            onCancel={() => dispatch(reset())}
        >
            <p>
                A new version ({version}) of nRF Connect for Desktop is
                available. Would you like to update now?
            </p>
            <Button
                variant="link"
                large
                onClick={() => openUrl(releaseNotesUrl)}
            >
                Click to see release notes
            </Button>
        </ConfirmationDialog>
    );
};
